<?php

namespace App\Http\Controllers;

use App\Services\AdminMoneyService;
use App\Models\{Customer, IdentificationType};
use App\Models\Invoice;
use App\Support\Settings;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CustomerController extends Controller
{
    public function index(Request $request, AdminMoneyService $adminMoneyService)
    {
        if (!$request->user() || !$request->user()->can('view customers')) {
            return redirect()->route('dashboard')->with('error', __('app.admin.customers.permissions.view_denied'));
        }

        $search = trim((string) $request->input('search', ''));
        $currencySettings = Settings::get('currency', []);

        $segment = trim((string) $request->input('segment', ''));

        $customers = Customer::query()
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($qq) use ($search) {
                    $qq->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('address', 'like', "%{$search}%");
                });
            })
            ->when($segment === 'vip', function ($q) {
                $q->has('invoices', '>=', 5);
            })
            ->when($segment === 'new', function ($q) {
                $q->whereDoesntHave('invoices')
                  ->orWhere('created_at', '>=', now()->subDays(30));
            })
            ->when($segment === 'at_risk', function ($q) {
                $q->has('invoices')
                  ->where(function ($qq) {
                      $qq->whereNull('last_purchase_at')
                         ->orWhere('last_purchase_at', '<', now()->subDays(90));
                  });
            })
            ->withCount('invoices')
            ->orderBy('name')
            ->paginate(12)
            ->withQueryString();

        $customers->getCollection()->load([
            'invoices:id,customer_id,status,total_usd,currency_code,base_currency_code,monetary_totals_json',
        ]);

        $adminCurrencyContext = $adminMoneyService->getAdminCurrencyContext($currencySettings);
        $zeroTotals = [];
        foreach (($adminCurrencyContext['codes'] ?? []) as $code) {
            $zeroTotals[$code] = 0.0;
        }

        $customers->setCollection(
            $customers->getCollection()->map(function (Customer $customer) use ($adminMoneyService, $currencySettings, $zeroTotals) {
                $customerTotals = $zeroTotals;

                foreach ($customer->invoices as $invoice) {
                    $documentTotals = $this->resolveInvoiceDocumentTotals($invoice, $adminMoneyService, $currencySettings);

                    foreach ($customerTotals as $code => $amount) {
                        $customerTotals[$code] = round($amount + (float) ($documentTotals[$code] ?? 0), 2);
                    }
                }

                $customer->admin_total_spent = $customerTotals;
                $customer->invoices_total_usd = (float) $customer->invoices->sum('total_usd');
                // Segmento calculado
                $invoiceCount = $customer->invoices_count ?? 0;
                $lastPurchase = $customer->last_purchase_at;
                $daysSince = $lastPurchase ? (int) now()->diffInDays($lastPurchase) : null;
                $customer->segment = match(true) {
                    $invoiceCount >= 5 => 'vip',
                    $invoiceCount === 0 => 'new',
                    $daysSince !== null && $daysSince > 90 => 'at_risk',
                    default => null,
                };

                // Score del cliente (RFM+P)
                $paidCount = $customer->invoices->where('status', 'paid')->count();
                $scoreData = $this->computeCustomerScore(
                    $invoiceCount,
                    $paidCount,
                    (float) $customer->invoices_total_usd,
                    $daysSince,
                );
                $customer->score = $scoreData['score'];
                $customer->score_tier = $scoreData['tier'];

                unset($customer->invoices);

                return $customer;
            })
        );

        $customerStats = Customer::query()->selectRaw("
            COUNT(*) as total,
            SUM(CASE WHEN loyalty_points > 0 THEN 1 ELSE 0 END) as with_points
        ")->first();

        $totalRevUsd = (float) Invoice::whereNotNull('customer_id')->sum('total_usd');
        $revenueContext = $adminMoneyService->buildTotalsWithContext($totalRevUsd, $adminCurrencyContext);
        $displayCode = $adminCurrencyContext['display_code'] ?? 'USD';

        $summary = [
            'total'           => (int) ($customerStats->total ?? 0),
            'with_invoices'   => Customer::has('invoices')->count(),
            'with_points'     => (int) ($customerStats->with_points ?? 0),
            'revenue_usd'     => $totalRevUsd,
            'revenue_display' => isset($revenueContext['totals'][$displayCode])
                ? number_format((float) $revenueContext['totals'][$displayCode], 2) . ' ' . $displayCode
                : number_format($totalRevUsd, 2) . ' USD',
            'vip_count'       => Customer::has('invoices', '>=', 5)->count(),
            'new_count'       => Customer::whereDoesntHave('invoices')->count(),
            'at_risk_count'   => Customer::has('invoices')->where(function ($q) {
                $q->whereNull('last_purchase_at')
                  ->orWhere('last_purchase_at', '<', now()->subDays(90));
            })->count(),
        ];

        return Inertia::render('Admin/Customer/Index', [
            'customers'            => $customers,
            'filters'              => ['search' => $search, 'segment' => $segment],
            'adminCurrencyContext'  => $adminCurrencyContext,
            'identificationTypes'  => IdentificationType::orderBy('code')->get(['id','code','name']),
            'summary'              => $summary,
        ]);
    }

    public function store(Request $request)
    {
        if (!$request->user() || !$request->user()->can('manage customers')) {
            return redirect()->route('dashboard')->with('error', __('app.admin.customers.permissions.manage_denied'));
        }

        $data = $request->validate([
            'identification_type_id' => ['required','exists:identification_types,id'],
            'identification' => ['required','string','max:50'],
            'name' => ['required','string','max:255'],
            'email' => ['nullable','email','max:255','unique:customers,email'],
            'phone' => ['nullable','string','max:50'],
            'address' => ['nullable','string','max:500'],
        ]);

        Customer::create($data);

        return redirect()->route('admin.customers.index')->with('success', __('app.admin.customers.notifications.created'));
    }

    public function show(Request $request, Customer $customer, AdminMoneyService $adminMoneyService)
    {
        if (!$request->user() || !$request->user()->can('view customers')) {
            return redirect()->route('dashboard')->with('error', __('app.admin.customers.permissions.view_denied'));
        }

        $customer->load([
            'invoices' => function ($q) {
                $q->latest()->with(['invoiceStatus', 'items.product:id,name,image_url']);
            },
            'creditAccount',
            'notes.user:id,name',
        ]);

        $currencySettings = Settings::get('currency', []);

        $invoices = $customer->invoices->map(function ($inv) use ($adminMoneyService, $currencySettings) {
            return [
                'id'             => $inv->id,
                'number'         => $inv->number,
                'status'         => $inv->status,
                'status_name'    => optional($inv->invoiceStatus)->name,
                'total_usd'      => (float) $inv->total_usd,
                'total_bs'       => (float) $inv->total_bs,
                'document_totals'=> $this->resolveInvoiceDocumentTotals($inv, $adminMoneyService, $currencySettings),
                'created_at'     => $inv->created_at,
                'points_earned'  => (int) floor((float) $inv->total_usd),
                'items_count'    => $inv->items->count(),
            ];
        });

        $adminCurrencyContext = $adminMoneyService->getAdminCurrencyContext($currencySettings);

        // Estadísticas del cliente
        $paidInvoices    = $customer->invoices->where('status', 'paid');
        $pendingInvoices = $customer->invoices->where('status', 'pending');
        $totalPaid       = $paidInvoices->sum('total_usd');
        $avgTicket       = $paidInvoices->count() > 0 ? $totalPaid / $paidInvoices->count() : 0;
        $daysSinceLastPurchase = $customer->last_purchase_at
            ? (int) now()->diffInDays($customer->last_purchase_at)
            : null;

        // Producto más comprado
        $productCounts = [];
        foreach ($customer->invoices as $inv) {
            foreach ($inv->items as $item) {
                $name = $item->product?->name ?? $item->name ?? 'Desconocido';
                $productCounts[$name] = ($productCounts[$name] ?? 0) + (int) $item->quantity;
            }
        }
        arsort($productCounts);
        $topProduct = !empty($productCounts) ? array_key_first($productCounts) : null;
        $topProductQty = $topProduct ? $productCounts[$topProduct] : 0;

        $customerMoney = [
            'lifetime_spent' => [
                'totals' => $this->sumInvoiceDocumentTotals($customer->invoices, $adminMoneyService, $currencySettings, $adminCurrencyContext),
            ],
        ];

        $creditAccount = $customer->creditAccount ? [
            'id'               => $customer->creditAccount->id,
            'balance_usd'      => (float) $customer->creditAccount->balance_usd,
            'credit_limit_usd' => $customer->creditAccount->credit_limit_usd !== null
                ? (float) $customer->creditAccount->credit_limit_usd
                : null,
            'status'           => $customer->creditAccount->status,
        ] : null;

        // Score del cliente (RFM+P)
        $scoreData = $this->computeCustomerScore(
            $customer->invoices->count(),
            $paidInvoices->count(),
            (float) $customer->invoices->sum('total_usd'),
            $daysSinceLastPurchase,
        );

        return Inertia::render('Admin/Customer/Show', [
            'customer' => [
                'id'                 => $customer->id,
                'name'               => $customer->name,
                'email'              => $customer->email,
                'phone'              => $customer->phone,
                'address'            => $customer->address,
                'city'               => $customer->city ?? null,
                'document'           => $customer->document ?? $customer->dni ?? null,
                'loyalty_points'     => (int) ($customer->loyalty_points ?? 0),
                'lifetime_spent_usd' => (float) ($customer->lifetime_spent_usd ?? 0),
                'last_purchase_at'   => $customer->last_purchase_at,
                'created_at'         => $customer->created_at,
                'invoices_count'     => $customer->invoices->count(),
                'paid_count'         => $paidInvoices->count(),
                'pending_count'      => $pendingInvoices->count(),
                'avg_ticket_usd'     => round($avgTicket, 2),
                'days_since_purchase'=> $daysSinceLastPurchase,
                'top_product'        => $topProduct,
                'top_product_qty'    => $topProductQty,
                'score'              => $scoreData['score'],
                'score_tier'         => $scoreData['tier'],
                'score_breakdown'    => $scoreData['breakdown'],
            ],
            'invoices'            => $invoices,
            'adminCurrencyContext' => $adminCurrencyContext,
            'customerMoney'       => $customerMoney,
            'creditAccount'       => $creditAccount,
            'notes'               => $customer->notes->map(fn ($n) => [
                'id'         => $n->id,
                'body'       => $n->body,
                'type'       => $n->type,
                'is_pinned'  => $n->is_pinned,
                'user_name'  => $n->user?->name ?? 'Sistema',
                'created_at' => $n->created_at,
            ]),
        ]);
    }

    /**
     * Calcula un score 0-100 del cliente basado en Recencia, Frecuencia, Monto y Puntualidad de pago (RFM+P).
     * @return array{score:int, tier:string, breakdown:array}
     */
    protected function computeCustomerScore(int $invoiceCount, int $paidCount, float $totalSpentUsd, ?int $daysSincePurchase): array
    {
        // Recencia (0-30)
        $recency = match (true) {
            $daysSincePurchase === null => 0,
            $daysSincePurchase <= 30    => 30,
            $daysSincePurchase <= 90    => 20,
            $daysSincePurchase <= 180   => 10,
            default                     => 5,
        };

        // Frecuencia (0-30)
        $frequency = match (true) {
            $invoiceCount >= 10 => 30,
            $invoiceCount >= 5  => 22,
            $invoiceCount >= 2  => 14,
            $invoiceCount >= 1  => 7,
            default             => 0,
        };

        // Monto (0-25)
        $monetary = match (true) {
            $totalSpentUsd >= 1000 => 25,
            $totalSpentUsd >= 500  => 18,
            $totalSpentUsd >= 100  => 10,
            $totalSpentUsd > 0     => 5,
            default                => 0,
        };

        // Puntualidad de pago (0-15)
        $paidRatio = $invoiceCount > 0 ? $paidCount / $invoiceCount : 0;
        $punctuality = match (true) {
            $paidRatio >= 0.9 => 15,
            $paidRatio >= 0.6 => 10,
            $paidRatio >= 0.3 => 5,
            default           => 0,
        };

        $score = $recency + $frequency + $monetary + $punctuality;

        $tier = match (true) {
            $score >= 80 => 'excellent',
            $score >= 60 => 'good',
            $score >= 35 => 'average',
            default      => 'low',
        };

        return [
            'score' => (int) $score,
            'tier'  => $tier,
            'breakdown' => [
                'recency'     => $recency,
                'frequency'   => $frequency,
                'monetary'    => $monetary,
                'punctuality' => $punctuality,
            ],
        ];
    }

    protected function resolveInvoiceDocumentTotals(Invoice $invoice, AdminMoneyService $adminMoneyService, array $currencySettings): array
    {
        if (is_array($invoice->monetary_totals_json['totals'] ?? null)) {
            return $invoice->monetary_totals_json['totals'];
        }

        $snapshot = is_array($invoice->monetary_totals_json['rates'] ?? null)
            ? [
                'base_currency' => (string) ($invoice->base_currency_code ?: 'USD'),
                'captured_at' => $invoice->monetary_totals_json['captured_at'] ?? null,
                'rates' => $invoice->monetary_totals_json['rates'],
            ]
            : null;

        return $adminMoneyService->buildDocumentTotals((float) ($invoice->total_usd ?? 0), $currencySettings, $snapshot)['totals'];
    }

    protected function sumInvoiceDocumentTotals(iterable $invoices, AdminMoneyService $adminMoneyService, array $currencySettings, array $adminCurrencyContext): array
    {
        $totals = [];

        foreach (($adminCurrencyContext['codes'] ?? []) as $code) {
            $totals[$code] = 0.0;
        }

        foreach ($invoices as $invoice) {
            $documentTotals = $this->resolveInvoiceDocumentTotals($invoice, $adminMoneyService, $currencySettings);

            foreach ($totals as $code => $amount) {
                $totals[$code] = round($amount + (float) ($documentTotals[$code] ?? 0), 2);
            }
        }

        return $totals;
    }
}

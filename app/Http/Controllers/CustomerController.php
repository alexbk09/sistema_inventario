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

        $customers = Customer::query()
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($qq) use ($search) {
                    $qq->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('address', 'like', "%{$search}%");
                });
            })
            ->withCount('invoices')
            ->orderBy('name')
            ->paginate(12)
            ->withQueryString();

        $customers->getCollection()->load([
            'invoices:id,customer_id,total_usd,currency_code,base_currency_code,monetary_totals_json',
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
                unset($customer->invoices);

                return $customer;
            })
        );

        return Inertia::render('Admin/Customer/Index', [
            'customers' => $customers,
            'filters' => [
                'search' => $search,
            ],
            'adminCurrencyContext' => $adminCurrencyContext,
            'identificationTypes' => IdentificationType::orderBy('code')->get(['id','code','name']),
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

        $customer->load(['invoices' => function ($q) {
            $q->latest()->with('invoiceStatus');
        }]);

        $currencySettings = Settings::get('currency', []);

        $invoices = $customer->invoices->map(function ($inv) use ($adminMoneyService, $currencySettings) {
            return [
                'id' => $inv->id,
                'number' => $inv->number,
                'status' => $inv->status,
                'status_name' => optional($inv->invoiceStatus)->name,
                'total_usd' => (float) $inv->total_usd,
                'total_bs' => (float) $inv->total_bs,
                'document_totals' => $this->resolveInvoiceDocumentTotals($inv, $adminMoneyService, $currencySettings),
                'created_at' => $inv->created_at,
                'points_earned' => (int) floor((float) $inv->total_usd),
            ];
        });

        $adminCurrencyContext = $adminMoneyService->getAdminCurrencyContext($currencySettings);
        $customerMoney = [
            'lifetime_spent' => [
                'totals' => $this->sumInvoiceDocumentTotals($customer->invoices, $adminMoneyService, $currencySettings, $adminCurrencyContext),
            ],
        ];

        return Inertia::render('Admin/Customer/Show', [
            'customer' => [
                'id' => $customer->id,
                'name' => $customer->name,
                'email' => $customer->email,
                'phone' => $customer->phone,
                'address' => $customer->address,
                'loyalty_points' => (int) ($customer->loyalty_points ?? 0),
                'lifetime_spent_usd' => (float) ($customer->lifetime_spent_usd ?? 0),
                'last_purchase_at' => $customer->last_purchase_at,
                'invoices_count' => $customer->invoices_count ?? $customer->invoices()->count(),
            ],
            'invoices' => $invoices,
            'adminCurrencyContext' => $adminCurrencyContext,
            'customerMoney' => $customerMoney,
        ]);
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

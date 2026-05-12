<?php

namespace App\Http\Controllers;

use App\Models\{Rma, RmaItem, Invoice, InvoiceItem, Product, Customer, InvoiceStatus, MovementType};
use App\Services\{AdminMoneyService, AdminNotificationService, CurrencyService, InventoryService};
use App\Support\Settings;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class RmaController extends Controller
{
    public function index(Request $request, AdminMoneyService $adminMoneyService)
    {
        if (!$request->user() || !$request->user()->can('view rmas')) {
            return redirect()->route('dashboard')->with('error', __('app.rmas.permissions.module_denied'));
        }

        $search = trim((string) $request->input('search', ''));
        $status = (string) $request->input('status', '');
        $currencySettings = Settings::get('currency', []);

        $rmas = Rma::query()
            ->with(['invoice:id,number', 'customer:id,name'])
            ->when($search !== '', function ($q) use ($search) {
                $q->where('number', 'like', "%{$search}%")
                    ->orWhereHas('invoice', function ($iq) use ($search) {
                        $iq->where('number', 'like', "%{$search}%");
                    })
                    ->orWhereHas('customer', function ($cq) use ($search) {
                        $cq->where('name', 'like', "%{$search}%");
                    });
            })
            ->when($status !== '', function ($q) use ($status) {
                $q->where('status', $status);
            })
            ->latest()
            ->paginate(12)
            ->withQueryString();

        $adminCurrencyContext = $adminMoneyService->getAdminCurrencyContext($currencySettings);
        $rmas->setCollection(
            $rmas->getCollection()->map(function (Rma $rma) use ($adminMoneyService, $currencySettings) {
                $rma->document_totals = $this->resolveRmaDocumentTotals($rma, $adminMoneyService, $currencySettings);

                return $rma;
            })
        );

        return Inertia::render('Admin/Rma/Index', [
            'rmas' => $rmas,
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
            'adminCurrencyContext' => $adminCurrencyContext,
        ]);
    }

    public function create(Request $request, AdminMoneyService $adminMoneyService)
    {
        if (!$request->user() || !$request->user()->can('manage rmas')) {
            return redirect()->route('dashboard')->with('error', __('app.rmas.permissions.create_denied'));
        }

        $currencySettings = Settings::get('currency', []);
        $adminCurrencyContext = $adminMoneyService->getAdminCurrencyContext($currencySettings);

        $invoices = Invoice::whereIn('status', ['paid','completed'])
            ->latest()
            ->take(50)
            ->get(['id','number','total_usd','currency_code','base_currency_code','monetary_totals_json'])
            ->map(function (Invoice $invoice) use ($adminMoneyService, $currencySettings) {
                return [
                    'id' => $invoice->id,
                    'number' => $invoice->number,
                    'total_usd' => (float) ($invoice->total_usd ?? 0),
                    'document_totals' => $this->resolveInvoiceDocumentTotals($invoice, $adminMoneyService, $currencySettings),
                ];
            })
            ->values();

        $customers = Customer::orderBy('name')->get(['id','name']);

        $products = Product::orderBy('name')->get(['id','name','price_usd','stock'])
            ->map(function (Product $product) use ($adminMoneyService, $currencySettings) {
                $product->price_admin_totals = $adminMoneyService->buildAdminTotals((float) ($product->price_usd ?? 0), $currencySettings)['totals'];

                return $product;
            });

        return Inertia::render('Admin/Rma/Create', [
            'invoices' => $invoices,
            'customers' => $customers,
            'products' => $products,
            'adminCurrencyContext' => $adminCurrencyContext,
        ]);
    }

    public function store(Request $request, CurrencyService $currency, AdminNotificationService $notificationService, AdminMoneyService $adminMoneyService)
    {
        if (!$request->user() || !$request->user()->can('manage rmas')) {
            return redirect()->route('dashboard')->with('error', __('app.rmas.permissions.create_denied'));
        }

        $data = $request->validate([
            'invoice_id' => ['nullable','exists:invoices,id'],
            'customer_id' => ['nullable','exists:customers,id'],
            'reason_type' => ['nullable','string','max:100'],
            'reason' => ['nullable','string'],
            'resolution_type' => ['nullable','string','max:100'],
            'items' => ['required','array','min:1'],
            'items.*.product_id' => ['required','exists:products,id'],
            'items.*.invoice_item_id' => ['nullable','exists:invoice_items,id'],
            'items.*.quantity' => ['required','integer','min:1'],
            'items.*.reason' => ['nullable','string'],
        ]);

        return DB::transaction(function () use ($data, $currency, $notificationService, $adminMoneyService) {
            $currencySettings = \App\Support\Settings::get('currency', []);
            $enabledCurrencyContext = $adminMoneyService->getEnabledCurrencyContext($currencySettings);
            $documentSnapshot = $adminMoneyService->buildSnapshot(
                $enabledCurrencyContext['rates'] ?? [],
                $enabledCurrencyContext['base_currency'] ?? 'USD',
                now()->toIso8601String(),
            );

            $rma = new Rma();
            $rma->number = 'RMA-'.Str::upper(Str::random(8));
            $rma->invoice_id = $data['invoice_id'] ?? null;
            $rma->customer_id = $data['customer_id'] ?? null;
            $rma->status = 'pending';
            $rma->reason_type = $data['reason_type'] ?? null;
            $rma->reason = $data['reason'] ?? null;
            $rma->resolution_type = $data['resolution_type'] ?? null;
            $rma->total_usd = 0;
            $rma->total_bs = 0;
            $rma->currency_code = 'USD';
            $rma->base_currency_code = $documentSnapshot['base_currency'] ?? 'USD';
            $rma->exchange_rate_snapshot = 1;
            $rma->exchange_rate_source = 'manual';
            $rma->save();

            $totalUsd = 0.0;

            foreach ($data['items'] as $itemData) {
                $product = Product::findOrFail($itemData['product_id']);
                $qty = (int) $itemData['quantity'];
                $unitPriceUsd = (float) ($product->price_usd ?? 0);

                if (!empty($itemData['invoice_item_id'])) {
                    $invoiceItem = InvoiceItem::find($itemData['invoice_item_id']);
                    if ($invoiceItem) {
                        $unitPriceUsd = (float) $invoiceItem->price_usd;
                    }
                }

                $subtotalUsd = $unitPriceUsd * $qty;
                $subtotalBs = $currency->usdToBs($subtotalUsd);

                RmaItem::create([
                    'rma_id' => $rma->id,
                    'product_id' => $product->id,
                    'invoice_item_id' => $itemData['invoice_item_id'] ?? null,
                    'quantity' => $qty,
                    'unit_price_usd' => $unitPriceUsd,
                    'subtotal_usd' => $subtotalUsd,
                    'subtotal_bs' => $subtotalBs,
                    'reason' => $itemData['reason'] ?? null,
                    'unit_currency_code' => 'USD',
                    'unit_price_original' => $unitPriceUsd,
                    'subtotal_original' => $subtotalUsd,
                    'exchange_rate_snapshot' => 1,
                    'monetary_breakdown_json' => $adminMoneyService->buildDocumentTotals($subtotalUsd, $currencySettings, $documentSnapshot),
                ]);

                $totalUsd += $subtotalUsd;
            }

            $rma->update([
                'total_usd' => $totalUsd,
                'total_bs' => $currency->usdToBs($totalUsd),
                'currency_code' => 'USD',
                'base_currency_code' => $documentSnapshot['base_currency'] ?? 'USD',
                'exchange_rate_snapshot' => 1,
                'exchange_rate_source' => 'manual',
                'monetary_totals_json' => [
                    'original_currency' => 'USD',
                    'original_amount' => round($totalUsd, 2),
                    ...$adminMoneyService->buildDocumentTotals($totalUsd, $currencySettings, $documentSnapshot),
                ],
            ]);

            $notificationService->notifyStaff(
                'rma_created',
                'Nuevo RMA '.$rma->number,
                'Estado inicial: '.$rma->status,
                [
                    'severity' => 'warning',
                    'action_url' => route('admin.rmas.show', $rma->id),
                    'action_label' => 'Revisar RMA',
                    'dedupe_key' => 'rma_created:'.$rma->id,
                    'data' => [
                        'rma_id' => $rma->id,
                        'status' => $rma->status,
                    ],
                ]
            );

            return redirect()->route('admin.rmas.index')->with('success', __('app.rmas.notifications.created'));
        });
    }

    public function show(Request $request, Rma $rma, AdminMoneyService $adminMoneyService)
    {
        if (!$request->user() || !$request->user()->can('view rmas')) {
            return redirect()->route('dashboard')->with('error', __('app.rmas.permissions.view_denied'));
        }

        $rma->load(['invoice', 'customer', 'items.product']);
        $currencySettings = Settings::get('currency', []);
        $adminCurrencyContext = $adminMoneyService->getAdminCurrencyContext($currencySettings);
        $documentTotals = $this->resolveRmaDocumentTotals($rma, $adminMoneyService, $currencySettings);

        return Inertia::render('Admin/Rma/Show', [
            'rma' => [
                'id' => $rma->id,
                'number' => $rma->number,
                'status' => $rma->status,
                'reason_type' => $rma->reason_type,
                'reason' => $rma->reason,
                'resolution_type' => $rma->resolution_type,
                'total_usd' => $rma->total_usd,
                'total_bs' => $rma->total_bs,
                'document_totals' => $documentTotals,
                'invoice' => $rma->invoice ? [
                    'id' => $rma->invoice->id,
                    'number' => $rma->invoice->number,
                    'status' => $rma->invoice->status,
                ] : null,
                'customer' => $rma->customer ? [
                    'id' => $rma->customer->id,
                    'name' => $rma->customer->name,
                ] : null,
                'items' => $rma->items->map(function (RmaItem $item) use ($adminMoneyService, $currencySettings) {
                    return [
                        'id' => $item->id,
                        'product' => $item->product ? [
                            'id' => $item->product->id,
                            'name' => $item->product->name,
                        ] : null,
                        'quantity' => $item->quantity,
                        'unit_price_usd' => $item->unit_price_usd,
                        'unit_price_admin_totals' => $adminMoneyService->buildAdminTotals((float) ($item->unit_price_usd ?? 0), $currencySettings)['totals'],
                        'subtotal_usd' => $item->subtotal_usd,
                        'subtotal_bs' => $item->subtotal_bs,
                        'document_totals' => is_array($item->monetary_breakdown_json['totals'] ?? null)
                            ? $item->monetary_breakdown_json['totals']
                            : $adminMoneyService->buildDocumentTotals(
                                (float) ($item->subtotal_usd ?? 0),
                                $currencySettings,
                                is_array($rma->monetary_totals_json['rates'] ?? null)
                                    ? [
                                        'base_currency' => (string) ($rma->base_currency_code ?: 'USD'),
                                        'captured_at' => $rma->monetary_totals_json['captured_at'] ?? null,
                                        'rates' => $rma->monetary_totals_json['rates'],
                                    ]
                                    : null,
                            )['totals'],
                        'reason' => $item->reason,
                    ];
                }),
            ],
            'adminCurrencyContext' => $adminCurrencyContext,
        ]);
    }

    public function update(Request $request, Rma $rma, InventoryService $inventory, CurrencyService $currency, AdminNotificationService $notificationService)
    {
        if (!$request->user() || !$request->user()->can('manage rmas')) {
            return redirect()->route('dashboard')->with('error', __('app.rmas.permissions.update_denied'));
        }

        $data = $request->validate([
            'status' => ['required','in:pending,approved,rejected,completed'],
            'resolution_type' => ['nullable','string','max:100'],
        ]);

        $oldStatus = $rma->status;

        return DB::transaction(function () use ($rma, $data, $inventory, $currency, $oldStatus, $notificationService) {
            $rma->status = $data['status'];
            if (isset($data['resolution_type'])) {
                $rma->resolution_type = $data['resolution_type'];
            }
            $rma->save();

            // Cuando pasa a "approved" o "completed", registrar entradas de inventario
            if (in_array($rma->status, ['approved','completed']) && !in_array($oldStatus, ['approved','completed'])) {
                $movementType = MovementType::where('code', 'return')->first();

                $rma->loadMissing('items.product');

                foreach ($rma->items as $item) {
                    if (!$item->product) {
                        continue;
                    }

                    $inventory->registerEntry(
                        $item->product,
                        (int) $item->quantity,
                        (float) $item->unit_price_usd,
                        $movementType?->id,
                        $rma->number,
                        'Entrada por devolución/RMA'
                    );
                }
            }

            if ($oldStatus !== $rma->status) {
                $notificationService->notifyStaff(
                    'rma_status_changed',
                    'RMA '.$rma->number.' actualizado',
                    'Estado: '.$oldStatus.' -> '.$rma->status,
                    [
                        'severity' => in_array($rma->status, ['approved', 'completed'], true) ? 'success' : 'warning',
                        'action_url' => route('admin.rmas.show', $rma->id),
                        'action_label' => 'Ver RMA',
                        'dedupe_key' => 'rma_status_changed:'.$rma->id.':'.$rma->status,
                        'data' => [
                            'rma_id' => $rma->id,
                            'old_status' => $oldStatus,
                            'new_status' => $rma->status,
                        ],
                    ]
                );
            }

            return redirect()->route('admin.rmas.show', $rma->id)->with('success', __('app.rmas.notifications.updated'));
        });
    }

    protected function resolveRmaDocumentTotals(Rma $rma, AdminMoneyService $adminMoneyService, array $currencySettings): array
    {
        if (is_array($rma->monetary_totals_json['totals'] ?? null)) {
            return $rma->monetary_totals_json['totals'];
        }

        $snapshot = is_array($rma->monetary_totals_json['rates'] ?? null)
            ? [
                'base_currency' => (string) ($rma->base_currency_code ?: 'USD'),
                'captured_at' => $rma->monetary_totals_json['captured_at'] ?? null,
                'rates' => $rma->monetary_totals_json['rates'],
            ]
            : null;

        return $adminMoneyService->buildDocumentTotals((float) ($rma->total_usd ?? 0), $currencySettings, $snapshot)['totals'];
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
}

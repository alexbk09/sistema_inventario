<?php

namespace App\Http\Controllers;

use App\Models\{Invoice, InvoiceItem, Product, Customer, MovementType, InvoiceStatus, Warehouse, InvoiceAdjustment, CreditAccount, CreditMovement, Layaway};
use App\Services\{AdminMoneyService, AdminNotificationService, CurrencyService, InventoryService};
use App\Support\{Settings, Audit};
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class InvoiceController extends Controller
{
    public function index(Request $request, AdminMoneyService $adminMoneyService)
    {
        $search = trim((string) $request->input('search', ''));
        $invoices = Invoice::query()
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($qq) use ($search) {
                    $qq->where('number', 'like', "%{$search}%")
                        ->orWhere('status', 'like', "%{$search}%");
                })
                ->orWhereHas('customer', function ($cq) use ($search) {
                    $cq->where('name', 'like', "%{$search}%");
                })
                ->orWhereHas('invoiceStatus', function ($sq) use ($search) {
                    $sq->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->with([
                'customer:id,name',
                'creditAccount:id,customer_id,balance_usd',
                'layaway:id,number,status',
                'items.product',
                'contact',
                'payments',
                'gatewayTransactions',
                'adjustments',
                'invoiceStatus',
            ])
            ->paginate(12)
            ->withQueryString();

        $adminCurrencyContext = $adminMoneyService->getAdminCurrencyContext();
        $currencySettings = Settings::get('currency', []);

        $invoices->setCollection(
            $invoices->getCollection()->map(function (Invoice $invoice) use ($adminMoneyService, $currencySettings) {
                $invoice->document_totals = $this->resolveInvoiceDocumentTotals($invoice, $adminMoneyService, $currencySettings);

                return $invoice;
            })
        );

        return Inertia::render('Admin/Invoice/Index', [
            'invoices' => $invoices,
            'filters' => ['search' => $search],
            'adminCurrencyContext' => $adminCurrencyContext,
        ]);
    }

    public function create(AdminMoneyService $adminMoneyService)
    {
        $currencySettings = Settings::get('currency', []);
        $adminCurrencyContext = $adminMoneyService->getAdminCurrencyContext($currencySettings);
        $products = Product::select('id','name','price_usd','stock')->get()
            ->map(function (Product $product) use ($adminMoneyService, $currencySettings) {
                $product->price_admin_totals = $adminMoneyService->buildAdminTotals((float) ($product->price_usd ?? 0), $currencySettings)['totals'];

                return $product;
            });

        return Inertia::render('Admin/Invoice/Create', [
            'products' => $products,
            'customers' => Customer::select('id','name')->get(),
            'warehouses' => Warehouse::select('id','name','code')->orderBy('name')->get(),
            'layaways' => Layaway::where('status', 'active')
                ->with('customer:id,name')
                ->orderByDesc('id')
                ->get(['id','number','customer_id','total_usd','currency_code','base_currency_code','monetary_totals_json'])
                ->map(function (Layaway $layaway) use ($adminMoneyService, $currencySettings) {
                    return [
                        'id' => $layaway->id,
                        'number' => $layaway->number,
                        'customer_id' => $layaway->customer_id,
                        'customer' => $layaway->customer,
                        'total_usd' => (float) ($layaway->total_usd ?? 0),
                        'document_totals' => $this->resolveLayawayDocumentTotals($layaway, $adminMoneyService, $currencySettings),
                    ];
                })
                ->values(),
            'users' => \App\Models\User::select('id','name')->orderBy('name')->get(),
            'adminCurrencyContext' => $adminCurrencyContext,
        ]);
    }

    public function store(Request $request, CurrencyService $currency, AdminNotificationService $notificationService, AdminMoneyService $adminMoneyService)
    {
        $data = $request->validate([
            'customer_id' => ['nullable','exists:customers,id'],
            'warehouse_id' => ['nullable','exists:warehouses,id'],
            'seller_id' => ['nullable','exists:users,id'],
            'layaway_id' => ['nullable','exists:layaways,id'],
            'document_type' => ['required','in:invoice,delivery_note,proforma'],
            'items' => ['required','array','min:1'],
            'items.*.product_id' => ['required','exists:products,id'],
            'items.*.quantity' => ['required','integer','min:1'],
            'items.*.bs_subtotal' => ['nullable','numeric'],
            'internal_notes' => ['nullable','string'],
            'public_notes' => ['nullable','string'],
            'cancellation_reason' => ['nullable','string','max:500'],
            'adjustments' => ['sometimes','array'],
            'adjustments.*.type' => ['required_with:adjustments','in:credit,debit'],
            'adjustments.*.amount_usd' => ['required_with:adjustments','numeric','min:0.01'],
            'adjustments.*.currency_code' => ['nullable','string','max:10'],
            'adjustments.*.description' => ['nullable','string','max:255'],
            'credit_sale' => ['sometimes','boolean'],
            'credit_due_date' => ['nullable','date'],
            'payments' => ['sometimes','array'],
            'payments.*.method' => ['required_with:payments','string','max:50'],
            'payments.*.amount_usd' => ['required_with:payments','numeric','min:0'],
            'payments.*.currency_code' => ['nullable','string','max:10'],
            'payments.*.amount_bs' => ['nullable','numeric','min:0'],
            'payments.*.reference' => ['nullable','string','max:255'],
            'payments.*.bank' => ['nullable','string','max:255'],
            'payments.*.notes' => ['nullable','string','max:500'],
        ]);

        // Aplicar reglas de multi-bodega desde settings (bodega por defecto y obligatoriedad)
        $warehouseSettings = Settings::get('warehouses', [
            'require_warehouse_on_invoice' => false,
            'default_warehouse_id' => null,
        ]);

        if (empty($data['warehouse_id']) && !empty($warehouseSettings['default_warehouse_id'])) {
            $data['warehouse_id'] = $warehouseSettings['default_warehouse_id'];
        }

        if (!empty($warehouseSettings['require_warehouse_on_invoice']) && empty($data['warehouse_id'])) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'warehouse_id' => 'Debes seleccionar una sucursal/bodega para la factura.',
            ]);
        }

        $billing = Settings::get('billing', [
            'invoice_prefix' => 'F-',
            'invoice_length' => 8,
        ]);

        $prefix = (string) ($billing['invoice_prefix'] ?? 'F-');
        $length = (int) ($billing['invoice_length'] ?? 8);

        // Si la sucursal tiene una serie propia configurada, usarla para esta factura
        if (!empty($data['warehouse_id'])) {
            $warehouse = Warehouse::find($data['warehouse_id']);
            if ($warehouse) {
                if (!empty($warehouse->invoice_prefix)) {
                    $prefix = (string) $warehouse->invoice_prefix;
                }
                if (!is_null($warehouse->invoice_length)) {
                    $length = (int) $warehouse->invoice_length;
                }
            }
        }

        $lastId = (int) (Invoice::max('id') ?? 0) + 1;
        $padded = str_pad((string) $lastId, max(1, $length), '0', STR_PAD_LEFT);

        $invoice = new Invoice();
        $invoice->number = $prefix.$padded;
        $invoice->document_type = $data['document_type'];
        $invoice->customer_id = $data['customer_id'] ?? null;
        $invoice->seller_id = $data['seller_id'] ?? $request->user()?->id;
        $invoice->layaway_id = $data['layaway_id'] ?? null;
        $invoice->warehouse_id = $data['warehouse_id'] ?? null;
        $invoice->status = 'pending';
        $invoice->internal_notes = $data['internal_notes'] ?? null;
        $invoice->public_notes = $data['public_notes'] ?? null;

        // Asociar estado inicial usando la tabla invoice_statuses
        $pendingStatus = InvoiceStatus::where('code', 'pending')->first();
        if ($pendingStatus) {
            $invoice->invoice_status_id = $pendingStatus->id;
        }

        $currencySettings = Settings::get('currency', []);
        $enabledCurrencyContext = $adminMoneyService->getEnabledCurrencyContext($currencySettings);
        $documentSnapshot = $adminMoneyService->buildSnapshot(
            $enabledCurrencyContext['rates'] ?? [],
            $enabledCurrencyContext['base_currency'] ?? 'USD',
            now()->toIso8601String(),
        );

        $invoice->total_usd = 0;
        $invoice->total_bs = 0;
        $invoice->currency_code = 'USD';
        $invoice->base_currency_code = $documentSnapshot['base_currency'] ?? 'USD';
        $invoice->exchange_rate_snapshot = 1;
        $invoice->exchange_rate_source = 'manual';
        $invoice->save();

        $taxPercent = (float) Settings::get('billing', ['default_tax_percent' => 0])['default_tax_percent'] ?? 0;
        $taxRate = max(0.0, min(100.0, $taxPercent)) / 100.0;

        $totalUsd = 0;
        foreach ($data['items'] as $it) {
            $product = Product::findOrFail($it['product_id']);
            $qty = (int) $it['quantity'];
            $subtotalUsd = $product->price_usd * $qty;
            // Preferir el valor en Bs provisto por el frontend (viene de la API)
            if (isset($it['bs_subtotal']) && is_numeric($it['bs_subtotal'])) {
                $subtotalBs = (float) $it['bs_subtotal'];
            } else {
                $subtotalBs = $currency->usdToBs($subtotalUsd);
            }

            InvoiceItem::create([
                'invoice_id' => $invoice->id,
                'product_id' => $product->id,
                'quantity' => $qty,
                'price_usd' => $product->price_usd,
                'subtotal_usd' => $subtotalUsd,
                'subtotal_bs' => $subtotalBs,
                'unit_currency_code' => 'USD',
                'unit_price_original' => (float) $product->price_usd,
                'subtotal_original' => $subtotalUsd,
                'exchange_rate_snapshot' => 1,
                'monetary_breakdown_json' => $adminMoneyService->buildDocumentTotals($subtotalUsd, $currencySettings, $documentSnapshot),
            ]);
            $totalUsd += $subtotalUsd;
        }

        $taxUsd = $taxRate > 0 ? round($totalUsd * $taxRate, 2) : 0.0;
        $grandTotalUsd = $totalUsd + $taxUsd;

        $invoice->update([
            'total_usd' => $grandTotalUsd,
            'total_bs' => $currency->usdToBs($grandTotalUsd),
            'currency_code' => 'USD',
            'base_currency_code' => $documentSnapshot['base_currency'] ?? 'USD',
            'exchange_rate_snapshot' => 1,
            'exchange_rate_source' => 'manual',
            'monetary_totals_json' => [
                'original_currency' => 'USD',
                'original_amount' => round($grandTotalUsd, 2),
                ...$adminMoneyService->buildDocumentTotals($grandTotalUsd, $currencySettings, $documentSnapshot),
            ],
        ]);

        // Si es venta a crédito, crear/actualizar cuenta de crédito y movimiento de cargo
        if (!empty($data['credit_sale']) && $invoice->customer_id) {
            $account = CreditAccount::firstOrCreate(
                ['customer_id' => $invoice->customer_id],
                ['balance_usd' => 0, 'credit_limit_usd' => null, 'status' => 'active']
            );

            CreditMovement::create([
                'credit_account_id' => $account->id,
                'invoice_id' => $invoice->id,
                'type' => 'charge',
                'amount_usd' => $grandTotalUsd,
                'amount_original' => (float) ($invoice->monetary_totals_json['original_amount'] ?? $grandTotalUsd),
                'currency_code' => (string) ($invoice->currency_code ?: 'USD'),
                'base_currency_code' => (string) ($invoice->base_currency_code ?: 'USD'),
                'exchange_rate_snapshot' => (float) ($invoice->exchange_rate_snapshot ?? 1),
                'exchange_rate_source' => $invoice->exchange_rate_source,
                'monetary_totals_json' => is_array($invoice->monetary_totals_json) ? $invoice->monetary_totals_json : null,
                'description' => 'Venta a crédito factura '.$invoice->number,
                'due_date' => $data['credit_due_date'] ?? null,
            ]);

            $account->balance_usd = (float) $account->balance_usd + (float) $grandTotalUsd;
            $account->save();

            $invoice->credit_account_id = $account->id;
            $invoice->save();
        }

        // Si la factura liquida un apartado, marcarlo como completado
        if (!empty($data['layaway_id'])) {
            $layaway = Layaway::find($data['layaway_id']);
            if ($layaway) {
                $layaway->status = 'completed';
                $layaway->paid_usd = $grandTotalUsd;
                $layaway->save();
            }
        }

        if (!empty($data['adjustments'])) {
            foreach ($data['adjustments'] as $adj) {
                InvoiceAdjustment::create($this->buildInvoiceAdjustmentPayload(
                    $invoice,
                    $adj,
                    $documentSnapshot,
                    $currencySettings,
                    $adminMoneyService,
                    $request->user()?->id,
                ));
            }
        }

        if (!empty($data['payments'])) {
            foreach ($data['payments'] as $pay) {
                $invoice->payments()->create($this->buildInvoicePaymentPayload(
                    $pay,
                    $documentSnapshot,
                    $currencySettings,
                    $adminMoneyService,
                ));
            }
        }

        Audit::log('invoice_created', 'invoices', $invoice, [
            'number' => $invoice->number,
            'total_usd' => $invoice->total_usd,
            'customer_id' => $invoice->customer_id,
        ]);

        $notificationMessage = $notificationService->formatDocumentAmount(
            'Monto',
            $invoice->currency_code,
            $invoice->total_usd,
            is_array($invoice->monetary_totals_json) ? $invoice->monetary_totals_json : null,
        );
        if ($invoice->customer_id && $invoice->customer) {
            $notificationMessage .= ' / Cliente: '.$invoice->customer->name;
        }

        $notificationService->notifyStaff(
            'invoice_created',
            'Nueva factura '.$invoice->number,
            $notificationMessage,
            [
                'severity' => 'info',
                'action_url' => route('admin.invoices.index'),
                'action_label' => 'Ver facturas',
                'dedupe_key' => 'invoice_created:'.$invoice->id,
                'data' => [
                    'invoice_id' => $invoice->id,
                    'status' => $invoice->status,
                ],
            ]
        );

        return redirect()->route('admin.invoices.index');
    }

    public function update(Request $request, Invoice $invoice, CurrencyService $currency, InventoryService $inventory, AdminNotificationService $notificationService, AdminMoneyService $adminMoneyService)
    {
        if ($invoice->status !== 'pending') {
            abort(403, 'Solo se pueden editar facturas en estado pendiente.');
        }

        $data = $request->validate([
            'status' => ['required', 'in:pending,paid,cancelled'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.id' => ['required', 'exists:invoice_items,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'internal_notes' => ['nullable','string'],
            'public_notes' => ['nullable','string'],
            'cancellation_reason' => ['nullable','string','max:500'],
            'payments' => ['sometimes','array'],
            'payments.*.method' => ['required_with:payments','string','max:50'],
            'payments.*.amount_usd' => ['required_with:payments','numeric','min:0'],
            'payments.*.currency_code' => ['nullable','string','max:10'],
            'payments.*.amount_bs' => ['nullable','numeric','min:0'],
            'payments.*.reference' => ['nullable','string','max:255'],
            'payments.*.bank' => ['nullable','string','max:255'],
            'payments.*.notes' => ['nullable','string','max:500'],
            'adjustments' => ['sometimes','array'],
            'adjustments.*.type' => ['required_with:adjustments','in:credit,debit'],
            'adjustments.*.amount_usd' => ['required_with:adjustments','numeric','min:0.01'],
            'adjustments.*.currency_code' => ['nullable','string','max:10'],
            'adjustments.*.description' => ['nullable','string','max:255'],
        ]);

        $oldStatus = $invoice->status;

        $billing = Settings::get('billing', [
            'default_tax_percent' => 0,
        ]);

        $taxPercent = (float) ($billing['default_tax_percent'] ?? 0);
        $taxRate = max(0.0, min(100.0, $taxPercent)) / 100.0;
        $currencySettings = Settings::get('currency', []);
        $documentCurrency = (string) ($invoice->currency_code ?: 'USD');
        $documentSnapshot = is_array($invoice->monetary_totals_json['rates'] ?? null)
            ? [
                'base_currency' => (string) ($invoice->base_currency_code ?: 'USD'),
                'captured_at' => $invoice->monetary_totals_json['captured_at'] ?? null,
                'rates' => $invoice->monetary_totals_json['rates'],
            ]
            : $adminMoneyService->buildSnapshot(
                $adminMoneyService->getEnabledCurrencyContext($currencySettings)['rates'] ?? [],
                $invoice->base_currency_code ?: 'USD',
                now()->toIso8601String(),
            );

        $itemsTotalUsd = 0.0;

        foreach ($data['items'] as $itemData) {
            $item = InvoiceItem::where('invoice_id', $invoice->id)
                ->where('id', $itemData['id'])
                ->firstOrFail();

            $qty = (int) $itemData['quantity'];
            $subtotalUsd = (float) $item->price_usd * $qty;
            $subtotalBs = $currency->usdToBs($subtotalUsd);

            $item->update([
                'quantity' => $qty,
                'subtotal_usd' => $subtotalUsd,
                'subtotal_bs' => $subtotalBs,
                'unit_currency_code' => $documentCurrency,
                'unit_price_original' => $adminMoneyService->convertUsingSnapshot((float) $item->price_usd, $documentCurrency, $documentSnapshot),
                'subtotal_original' => $adminMoneyService->convertUsingSnapshot($subtotalUsd, $documentCurrency, $documentSnapshot),
                'exchange_rate_snapshot' => $documentCurrency === ($documentSnapshot['base_currency'] ?? 'USD')
                    ? 1
                    : (float) ($documentSnapshot['rates'][$documentCurrency] ?? null),
                'monetary_breakdown_json' => $adminMoneyService->buildDocumentTotals($subtotalUsd, $currencySettings, $documentSnapshot),
            ]);

            $itemsTotalUsd += $subtotalUsd;
        }

        // Recalculate invoice totals usando impuesto por defecto y sin envío fijo
        $taxUsd = $taxRate > 0 ? round($itemsTotalUsd * $taxRate, 2) : 0.0;
        $totalUsd = $itemsTotalUsd + $taxUsd;

        $invoice->total_usd = $totalUsd;
        $invoice->total_bs = $currency->usdToBs($totalUsd);
        $invoice->base_currency_code = $documentSnapshot['base_currency'] ?? ($invoice->base_currency_code ?: 'USD');
        $invoice->currency_code = $documentCurrency;
        $invoice->exchange_rate_snapshot = $documentCurrency === ($documentSnapshot['base_currency'] ?? 'USD')
            ? 1
            : (float) ($documentSnapshot['rates'][$documentCurrency] ?? null);
        $invoice->exchange_rate_source = $documentCurrency === 'USD'
            ? 'manual'
            : ($adminMoneyService->resolveCurrencyRateSource($documentCurrency, $currencySettings) ?? $invoice->exchange_rate_source);
        $invoice->monetary_totals_json = [
            'original_currency' => $documentCurrency,
            'original_amount' => $adminMoneyService->convertUsingSnapshot($totalUsd, $documentCurrency, $documentSnapshot),
            ...$adminMoneyService->buildDocumentTotals($totalUsd, $currencySettings, $documentSnapshot),
        ];
        $invoice->status = $data['status'];
        $invoice->internal_notes = $data['internal_notes'] ?? null;
        $invoice->public_notes = $data['public_notes'] ?? null;

        if ($oldStatus !== 'cancelled' && $data['status'] === 'cancelled') {
            $invoice->cancelled_at = now();
            $invoice->cancelled_by = $request->user()?->id;
            $invoice->cancellation_reason = $data['cancellation_reason'] ?? null;
        }

        // Sincronizar invoice_status_id con el código recibido
        $newStatus = InvoiceStatus::where('code', $data['status'])->first();
        if ($newStatus) {
            $invoice->invoice_status_id = $newStatus->id;
        }

        $invoice->save();

        if (isset($data['payments'])) {
            $invoice->payments()->delete();
            foreach ($data['payments'] as $pay) {
                $invoice->payments()->create($this->buildInvoicePaymentPayload(
                    $pay,
                    $documentSnapshot,
                    $currencySettings,
                    $adminMoneyService,
                ));
            }
        }

        if (isset($data['adjustments'])) {
            $invoice->adjustments()->delete();
            foreach ($data['adjustments'] as $adj) {
                $invoice->adjustments()->create($this->buildInvoiceAdjustmentPayload(
                    $invoice,
                    $adj,
                    $documentSnapshot,
                    $currencySettings,
                    $adminMoneyService,
                    $request->user()?->id,
                ));
            }
        }

        // If status changed from pending to paid, register stock exits
        if ($oldStatus === 'pending' && $data['status'] === 'paid') {
            $movementType = MovementType::where('code', 'sale')->first();

            $invoice->loadMissing('items.product');

            foreach ($invoice->items as $item) {
                if (!$item->product) {
                    continue;
                }

                $inventory->registerExit(
                    $item->product,
                    (int) $item->quantity,
                    (float) $item->price_usd,
                    $movementType?->id,
                    $invoice->number,
                    'Salida por confirmación de factura',
                    $invoice->warehouse_id
                );
            }

            if ($invoice->customer_id) {
                $customer = $invoice->customer;
                if ($customer) {
                    $pointsToAdd = (int) floor($invoice->total_usd ?? 0);
                    $customer->loyalty_points = (int) ($customer->loyalty_points ?? 0) + $pointsToAdd;
                    $customer->lifetime_spent_usd = (float) ($customer->lifetime_spent_usd ?? 0) + (float) ($invoice->total_usd ?? 0);
                    $customer->last_purchase_at = now();
                    $customer->save();
                }

                // Si la factura estaba ligada a crédito, registrar abono automático
                if ($invoice->credit_account_id) {
                    $account = $invoice->creditAccount;
                    if ($account) {
                        CreditMovement::create([
                            'credit_account_id' => $account->id,
                            'invoice_id' => $invoice->id,
                            'type' => 'payment',
                            'amount_usd' => $invoice->total_usd,
                            'amount_original' => (float) ($invoice->monetary_totals_json['original_amount'] ?? $invoice->total_usd),
                            'currency_code' => (string) ($invoice->currency_code ?: 'USD'),
                            'base_currency_code' => (string) ($invoice->base_currency_code ?: 'USD'),
                            'exchange_rate_snapshot' => (float) ($invoice->exchange_rate_snapshot ?? 1),
                            'exchange_rate_source' => $invoice->exchange_rate_source,
                            'monetary_totals_json' => is_array($invoice->monetary_totals_json) ? $invoice->monetary_totals_json : null,
                            'description' => 'Abono automático por factura '.$invoice->number,
                            'paid_at' => now(),
                        ]);

                        $account->balance_usd = (float) $account->balance_usd - (float) $invoice->total_usd;
                        $account->save();
                    }
                }
            }
        }

        Audit::log('invoice_updated', 'invoices', $invoice, [
            'old_status' => $oldStatus,
            'new_status' => $invoice->status,
        ]);

        if ($oldStatus !== $invoice->status) {
            $notificationService->notifyStaff(
                'invoice_status_changed',
                'Factura '.$invoice->number.' actualizada',
                'Estado: '.$oldStatus.' -> '.$invoice->status,
                [
                    'severity' => $invoice->status === 'cancelled' ? 'warning' : 'success',
                    'action_url' => route('admin.invoices.index'),
                    'action_label' => 'Ver facturas',
                    'dedupe_key' => 'invoice_status_changed:'.$invoice->id.':'.$invoice->status,
                    'data' => [
                        'invoice_id' => $invoice->id,
                        'old_status' => $oldStatus,
                        'new_status' => $invoice->status,
                    ],
                ]
            );
        }

        return redirect()->route('admin.invoices.index');
    }

    protected function buildInvoicePaymentPayload(
        array $payment,
        array $documentSnapshot,
        array $currencySettings,
        AdminMoneyService $adminMoneyService,
    ): array {
        $currencyCode = strtoupper((string) ($payment['currency_code'] ?? 'USD'));
        $originalAmount = round((float) ($payment['amount_usd'] ?? 0), 2);
        $baseAmount = $adminMoneyService->convertToBase($originalAmount, $currencyCode, $currencySettings, $documentSnapshot);
        $vesAmount = isset($documentSnapshot['rates']['VES'])
            ? $adminMoneyService->convertUsingSnapshot($baseAmount, 'VES', $documentSnapshot)
            : round((float) ($payment['amount_bs'] ?? 0), 2);

        return [
            'method' => $payment['method'],
            'amount_usd' => $baseAmount,
            'amount_bs' => $vesAmount,
            'payment_currency_code' => $currencyCode,
            'amount_original' => $originalAmount,
            'amount_base' => $baseAmount,
            'exchange_rate_snapshot' => $currencyCode === ($documentSnapshot['base_currency'] ?? 'USD')
                ? 1
                : (float) ($documentSnapshot['rates'][$currencyCode] ?? 0),
            'exchange_rate_source' => $currencyCode === 'USD'
                ? 'manual'
                : ($adminMoneyService->resolveCurrencyRateSource($currencyCode, $currencySettings) ?? 'manual'),
            'reference' => $payment['reference'] ?? null,
            'bank' => $payment['bank'] ?? null,
            'notes' => $payment['notes'] ?? null,
        ];
    }

    protected function buildInvoiceAdjustmentPayload(
        Invoice $invoice,
        array $adjustment,
        array $documentSnapshot,
        array $currencySettings,
        AdminMoneyService $adminMoneyService,
        mixed $createdBy,
    ): array {
        $currencyCode = strtoupper((string) ($adjustment['currency_code'] ?? 'USD'));
        $originalAmount = round((float) ($adjustment['amount_usd'] ?? 0), 2);
        $baseAmount = $adminMoneyService->convertToBase($originalAmount, $currencyCode, $currencySettings, $documentSnapshot);

        return [
            'invoice_id' => $invoice->id,
            'type' => $adjustment['type'],
            'amount_usd' => $baseAmount,
            'amount_original' => $originalAmount,
            'currency_code' => $currencyCode,
            'base_currency_code' => $documentSnapshot['base_currency'] ?? 'USD',
            'exchange_rate_snapshot' => $currencyCode === ($documentSnapshot['base_currency'] ?? 'USD')
                ? 1
                : (float) ($documentSnapshot['rates'][$currencyCode] ?? 0),
            'exchange_rate_source' => $currencyCode === 'USD'
                ? 'manual'
                : ($adminMoneyService->resolveCurrencyRateSource($currencyCode, $currencySettings) ?? 'manual'),
            'monetary_totals_json' => [
                'original_currency' => $currencyCode,
                'original_amount' => $originalAmount,
                ...$adminMoneyService->buildDocumentTotals($baseAmount, $currencySettings, $documentSnapshot),
            ],
            'description' => $adjustment['description'] ?? null,
            'created_by' => $createdBy,
        ];
    }

    protected function resolveLayawayDocumentTotals(Layaway $layaway, AdminMoneyService $adminMoneyService, array $currencySettings): array
    {
        if (is_array($layaway->monetary_totals_json['totals'] ?? null)) {
            return $layaway->monetary_totals_json['totals'];
        }

        $snapshot = is_array($layaway->monetary_totals_json['rates'] ?? null)
            ? [
                'base_currency' => (string) ($layaway->base_currency_code ?: 'USD'),
                'captured_at' => $layaway->monetary_totals_json['captured_at'] ?? null,
                'rates' => $layaway->monetary_totals_json['rates'],
            ]
            : null;

        return $adminMoneyService->buildDocumentTotals((float) ($layaway->total_usd ?? 0), $currencySettings, $snapshot)['totals'];
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

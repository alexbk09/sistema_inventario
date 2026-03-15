<?php

namespace App\Http\Controllers;

use App\Models\{Invoice, InvoiceItem, Product, Customer, MovementType, InvoiceStatus, Warehouse, InvoiceAdjustment, CreditAccount, CreditMovement, Layaway};
use App\Services\{CurrencyService, InventoryService};
use App\Support\{Settings, Audit};
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class InvoiceController extends Controller
{
    public function index(Request $request)
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
                'adjustments',
                'invoiceStatus',
            ])
            ->paginate(12)
            ->withQueryString();
        return Inertia::render('Admin/Invoice/Index', [
            'invoices' => $invoices,
            'filters' => ['search' => $search],
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Invoice/Create', [
            'products' => Product::select('id','name','price_usd','stock')->get(),
            'customers' => Customer::select('id','name')->get(),
            'warehouses' => Warehouse::select('id','name','code')->orderBy('name')->get(),
            'layaways' => Layaway::where('status', 'active')->with('customer:id,name')->orderByDesc('id')->get(['id','number','customer_id','total_usd']),
            'users' => \App\Models\User::select('id','name')->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request, CurrencyService $currency)
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
            'adjustments.*.description' => ['nullable','string','max:255'],
            'credit_sale' => ['sometimes','boolean'],
            'credit_due_date' => ['nullable','date'],
            'payments' => ['sometimes','array'],
            'payments.*.method' => ['required_with:payments','string','max:50'],
            'payments.*.amount_usd' => ['required_with:payments','numeric','min:0'],
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

        $invoice->total_usd = 0;
        $invoice->total_bs = 0;
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
            ]);
            $totalUsd += $subtotalUsd;
        }

        $taxUsd = $taxRate > 0 ? round($totalUsd * $taxRate, 2) : 0.0;
        $grandTotalUsd = $totalUsd + $taxUsd;

        $invoice->update([
            'total_usd' => $grandTotalUsd,
            'total_bs' => $currency->usdToBs($grandTotalUsd),
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
                InvoiceAdjustment::create([
                    'invoice_id' => $invoice->id,
                    'type' => $adj['type'],
                    'amount_usd' => $adj['amount_usd'],
                    'description' => $adj['description'] ?? null,
                    'created_by' => $request->user()?->id,
                ]);
            }
        }

        if (!empty($data['payments'])) {
            foreach ($data['payments'] as $pay) {
                $invoice->payments()->create([
                    'method' => $pay['method'],
                    'amount_usd' => $pay['amount_usd'],
                    'amount_bs' => $pay['amount_bs'] ?? 0,
                    'reference' => $pay['reference'] ?? null,
                    'bank' => $pay['bank'] ?? null,
                    'notes' => $pay['notes'] ?? null,
                ]);
            }
        }

        Audit::log('invoice_created', 'invoices', $invoice, [
            'number' => $invoice->number,
            'total_usd' => $invoice->total_usd,
            'customer_id' => $invoice->customer_id,
        ]);

        return redirect()->route('admin.invoices.index');
    }

    public function update(Request $request, Invoice $invoice, CurrencyService $currency, InventoryService $inventory)
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
            'payments.*.amount_bs' => ['nullable','numeric','min:0'],
            'payments.*.reference' => ['nullable','string','max:255'],
            'payments.*.bank' => ['nullable','string','max:255'],
            'payments.*.notes' => ['nullable','string','max:500'],
            'adjustments' => ['sometimes','array'],
            'adjustments.*.type' => ['required_with:adjustments','in:credit,debit'],
            'adjustments.*.amount_usd' => ['required_with:adjustments','numeric','min:0.01'],
            'adjustments.*.description' => ['nullable','string','max:255'],
        ]);

        $oldStatus = $invoice->status;

        $billing = Settings::get('billing', [
            'default_tax_percent' => 0,
        ]);

        $taxPercent = (float) ($billing['default_tax_percent'] ?? 0);
        $taxRate = max(0.0, min(100.0, $taxPercent)) / 100.0;

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
            ]);

            $itemsTotalUsd += $subtotalUsd;
        }

        // Recalculate invoice totals usando impuesto por defecto y sin envío fijo
        $taxUsd = $taxRate > 0 ? round($itemsTotalUsd * $taxRate, 2) : 0.0;
        $totalUsd = $itemsTotalUsd + $taxUsd;

        $invoice->total_usd = $totalUsd;
        $invoice->total_bs = $currency->usdToBs($totalUsd);
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
                $invoice->payments()->create([
                    'method' => $pay['method'],
                    'amount_usd' => $pay['amount_usd'],
                    'amount_bs' => $pay['amount_bs'] ?? 0,
                    'reference' => $pay['reference'] ?? null,
                    'bank' => $pay['bank'] ?? null,
                    'notes' => $pay['notes'] ?? null,
                ]);
            }
        }

        if (isset($data['adjustments'])) {
            $invoice->adjustments()->delete();
            foreach ($data['adjustments'] as $adj) {
                $invoice->adjustments()->create([
                    'type' => $adj['type'],
                    'amount_usd' => $adj['amount_usd'],
                    'description' => $adj['description'] ?? null,
                    'created_by' => $request->user()?->id,
                ]);
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

        return redirect()->route('admin.invoices.index');
    }
}

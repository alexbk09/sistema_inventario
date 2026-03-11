<?php

namespace App\Http\Controllers;

use App\Models\{Invoice, InvoiceItem, Product, Customer, MovementType, InvoiceStatus, Warehouse};
use App\Services\{CurrencyService, InventoryService};
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
                'items.product',
                'contact',
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
        ]);
    }

    public function store(Request $request, CurrencyService $currency)
    {
        $data = $request->validate([
            'customer_id' => ['nullable','exists:customers,id'],
            'warehouse_id' => ['nullable','exists:warehouses,id'],
            'items' => ['required','array','min:1'],
            'items.*.product_id' => ['required','exists:products,id'],
            'items.*.quantity' => ['required','integer','min:1'],
            'items.*.bs_subtotal' => ['nullable','numeric'],
        ]);

        $invoice = new Invoice();
        $invoice->number = 'INV-'.Str::upper(Str::random(8));
        $invoice->customer_id = $data['customer_id'] ?? null;
        $invoice->warehouse_id = $data['warehouse_id'] ?? null;
        $invoice->status = 'pending';

        // Asociar estado inicial usando la tabla invoice_statuses
        $pendingStatus = InvoiceStatus::where('code', 'pending')->first();
        if ($pendingStatus) {
            $invoice->invoice_status_id = $pendingStatus->id;
        }

        $invoice->total_usd = 0;
        $invoice->total_bs = 0;
        $invoice->save();

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

        $invoice->update([
            'total_usd' => $totalUsd,
            'total_bs' => $currency->usdToBs($totalUsd),
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
        ]);

        $oldStatus = $invoice->status;

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

        // Recalculate invoice totals (must match checkout logic)
        $shippingUsd = 200.0;
        $taxRate = 0.15;
        $taxUsd = round($itemsTotalUsd * $taxRate);
        $totalUsd = $itemsTotalUsd + $taxUsd + $shippingUsd;

        $invoice->total_usd = $totalUsd;
        $invoice->total_bs = $currency->usdToBs($totalUsd);
        $invoice->status = $data['status'];

        // Sincronizar invoice_status_id con el código recibido
        $newStatus = InvoiceStatus::where('code', $data['status'])->first();
        if ($newStatus) {
            $invoice->invoice_status_id = $newStatus->id;
        }

        $invoice->save();

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
            }
        }

        return redirect()->route('admin.invoices.index');
    }
}

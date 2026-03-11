<?php

namespace App\Http\Controllers;

use App\Models\{Rma, RmaItem, Invoice, InvoiceItem, Product, Customer, InvoiceStatus, MovementType};
use App\Services\{CurrencyService, InventoryService};
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class RmaController extends Controller
{
    public function index(Request $request)
    {
        if (!$request->user() || !$request->user()->can('view rmas')) {
            return redirect()->route('dashboard')->with('error', 'No tienes permiso para acceder al módulo de devoluciones.');
        }

        $search = trim((string) $request->input('search', ''));
        $status = (string) $request->input('status', '');

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

        return Inertia::render('Admin/Rma/Index', [
            'rmas' => $rmas,
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
        ]);
    }

    public function create(Request $request)
    {
        if (!$request->user() || !$request->user()->can('manage rmas')) {
            return redirect()->route('dashboard')->with('error', 'No tienes permiso para crear devoluciones.');
        }

        $invoices = Invoice::whereIn('status', ['paid','completed'])
            ->latest()
            ->take(50)
            ->get(['id','number','total_usd']);

        $customers = Customer::orderBy('name')->get(['id','name']);

        $products = Product::orderBy('name')->get(['id','name','price_usd','stock']);

        return Inertia::render('Admin/Rma/Create', [
            'invoices' => $invoices,
            'customers' => $customers,
            'products' => $products,
        ]);
    }

    public function store(Request $request, CurrencyService $currency)
    {
        if (!$request->user() || !$request->user()->can('manage rmas')) {
            return redirect()->route('dashboard')->with('error', 'No tienes permiso para crear devoluciones.');
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

        return DB::transaction(function () use ($data, $currency) {
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
                ]);

                $totalUsd += $subtotalUsd;
            }

            $rma->update([
                'total_usd' => $totalUsd,
                'total_bs' => $currency->usdToBs($totalUsd),
            ]);

            return redirect()->route('admin.rmas.index')->with('success', 'Devolución creada correctamente.');
        });
    }

    public function show(Request $request, Rma $rma)
    {
        if (!$request->user() || !$request->user()->can('view rmas')) {
            return redirect()->route('dashboard')->with('error', 'No tienes permiso para ver devoluciones.');
        }

        $rma->load(['invoice', 'customer', 'items.product']);

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
                'invoice' => $rma->invoice ? [
                    'id' => $rma->invoice->id,
                    'number' => $rma->invoice->number,
                    'status' => $rma->invoice->status,
                ] : null,
                'customer' => $rma->customer ? [
                    'id' => $rma->customer->id,
                    'name' => $rma->customer->name,
                ] : null,
                'items' => $rma->items->map(function (RmaItem $item) {
                    return [
                        'id' => $item->id,
                        'product' => $item->product ? [
                            'id' => $item->product->id,
                            'name' => $item->product->name,
                        ] : null,
                        'quantity' => $item->quantity,
                        'unit_price_usd' => $item->unit_price_usd,
                        'subtotal_usd' => $item->subtotal_usd,
                        'subtotal_bs' => $item->subtotal_bs,
                        'reason' => $item->reason,
                    ];
                }),
            ],
        ]);
    }

    public function update(Request $request, Rma $rma, InventoryService $inventory, CurrencyService $currency)
    {
        if (!$request->user() || !$request->user()->can('manage rmas')) {
            return redirect()->route('dashboard')->with('error', 'No tienes permiso para actualizar devoluciones.');
        }

        $data = $request->validate([
            'status' => ['required','in:pending,approved,rejected,completed'],
            'resolution_type' => ['nullable','string','max:100'],
        ]);

        $oldStatus = $rma->status;

        return DB::transaction(function () use ($rma, $data, $inventory, $currency, $oldStatus) {
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

            return redirect()->route('admin.rmas.show', $rma->id)->with('success', 'Devolución actualizada correctamente.');
        });
    }
}

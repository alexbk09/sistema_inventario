<?php

namespace App\Http\Controllers;

use App\Models\{StockTransfer, StockTransferItem, Warehouse, Product};
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class StockTransferController extends Controller
{
    public function index(Request $request)
    {
        if (!$request->user() || !$request->user()->can('view warehouses')) {
            return redirect()->route('dashboard')->with('error', 'No tienes permiso para ver transferencias de stock.');
        }

        $transfers = StockTransfer::with(['fromWarehouse','toWarehouse'])
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/Transfer/Index', [
            'transfers' => $transfers,
        ]);
    }

    public function create(Request $request)
    {
        if (!$request->user() || !$request->user()->can('manage warehouses')) {
            return redirect()->route('dashboard')->with('error', 'No tienes permiso para crear transferencias.');
        }

        $warehouses = Warehouse::orderBy('name')->get(['id','name','code']);
        $products = Product::orderBy('name')->get(['id','name','price_usd','stock']);

        return Inertia::render('Admin/Transfer/Create', [
            'warehouses' => $warehouses,
            'products' => $products,
        ]);
    }

    public function store(Request $request)
    {
        if (!$request->user() || !$request->user()->can('manage warehouses')) {
            return redirect()->route('dashboard')->with('error', 'No tienes permiso para crear transferencias.');
        }

        $data = $request->validate([
            'from_warehouse_id' => ['required','exists:warehouses,id'],
            'to_warehouse_id' => ['required','different:from_warehouse_id','exists:warehouses,id'],
            'notes' => ['nullable','string'],
            'items' => ['required','array','min:1'],
            'items.*.product_id' => ['required','exists:products,id'],
            'items.*.quantity' => ['required','integer','min:1'],
        ]);

        return DB::transaction(function () use ($data, $request) {
            $transfer = new StockTransfer();
            $transfer->number = 'TRF-'.Str::upper(Str::random(8));
            $transfer->from_warehouse_id = $data['from_warehouse_id'];
            $transfer->to_warehouse_id = $data['to_warehouse_id'];
            $transfer->status = 'draft';
            $transfer->notes = $data['notes'] ?? null;
            $transfer->user_id = $request->user()->id ?? null;
            $transfer->save();

            foreach ($data['items'] as $item) {
                StockTransferItem::create([
                    'stock_transfer_id' => $transfer->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                ]);
            }

            return redirect()->route('admin.transfers.show', $transfer->id)->with('success', 'Transferencia creada en borrador.');
        });
    }

    public function show(Request $request, StockTransfer $transfer)
    {
        if (!$request->user() || !$request->user()->can('view warehouses')) {
            return redirect()->route('dashboard')->with('error', 'No tienes permiso para ver transferencias.');
        }

        $transfer->load(['fromWarehouse','toWarehouse','items.product']);

        return Inertia::render('Admin/Transfer/Show', [
            'transfer' => $transfer,
        ]);
    }

    public function update(Request $request, StockTransfer $transfer)
    {
        if (!$request->user() || !$request->user()->can('manage warehouses')) {
            return redirect()->route('dashboard')->with('error', 'No tienes permiso para actualizar transferencias.');
        }

        $data = $request->validate([
            'status' => ['required','in:draft,completed,cancelled'],
        ]);

        $transfer->status = $data['status'];
        $transfer->save();

        // Nota: aquí se podría integrar con InventoryService para ajustar stock por sucursal

        return redirect()->route('admin.transfers.show', $transfer->id)->with('success', 'Transferencia actualizada.');
    }
}

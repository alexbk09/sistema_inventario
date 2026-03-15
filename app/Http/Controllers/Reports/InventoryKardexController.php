<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InventoryKardexController extends Controller
{
    public function index(Request $request)
    {
        $filters = [
            'product_id' => $request->input('product_id'),
            'warehouse_id' => $request->input('warehouse_id'),
            'date_from' => $request->input('date_from'),
            'date_to' => $request->input('date_to'),
        ];

        $query = InventoryMovement::query()
            ->with(['product:id,name,sku,barcode', 'warehouse:id,name,code', 'movementType:id,name,code'])
            ->when($filters['product_id'], function ($q, $pid) {
                $q->where('product_id', $pid);
            })
            ->when($filters['warehouse_id'], function ($q, $wid) {
                $q->where('warehouse_id', $wid);
            })
            ->when($filters['date_from'], function ($q, $from) {
                $q->whereDate('created_at', '>=', $from);
            })
            ->when($filters['date_to'], function ($q, $to) {
                $q->whereDate('created_at', '<=', $to);
            })
            ->orderBy('created_at')
            ->orderBy('id');

        $movements = $query->paginate(100)->withQueryString();

        $product = null;
        if ($filters['product_id']) {
            $product = Product::select('id', 'name', 'sku', 'barcode', 'stock')->find($filters['product_id']);
        }

        $products = Product::orderBy('name')->limit(200)->get(['id', 'name', 'sku']);
        $warehouses = Warehouse::orderBy('name')->get(['id', 'name', 'code']);

        return Inertia::render('Admin/Reports/Inventory/Kardex', [
            'movements' => $movements,
            'filters' => $filters,
            'product' => $product,
            'products' => $products,
            'warehouses' => $warehouses,
        ]);
    }
}

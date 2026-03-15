<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InventoryByWarehouseController extends Controller
{
    public function index(Request $request)
    {
        $filters = [
            'warehouse_id' => $request->input('warehouse_id'),
            'search' => $request->input('search'),
        ];

        $query = InventoryMovement::query()
            ->selectRaw('product_id, warehouse_id, SUM(CASE WHEN type = "entry" THEN quantity ELSE -quantity END) as stock_units')
            ->join('products', 'inventory_movements.product_id', '=', 'products.id')
            ->join('warehouses', 'inventory_movements.warehouse_id', '=', 'warehouses.id')
            ->when($filters['warehouse_id'], function ($q, $wid) {
                $q->where('inventory_movements.warehouse_id', $wid);
            })
            ->when($filters['search'], function ($q, $search) {
                $q->where(function ($qq) use ($search) {
                    $qq->where('products.name', 'like', "%{$search}%")
                        ->orWhere('products.sku', 'like', "%{$search}%")
                        ->orWhere('products.barcode', 'like', "%{$search}%");
                });
            })
            ->groupBy('product_id', 'warehouse_id');

        $rows = $query
            ->with(['product:id,name,sku,barcode,average_cost_usd,price_usd', 'warehouse:id,name,code'])
            ->orderBy('warehouses.name')
            ->orderBy('products.name')
            ->paginate(50)
            ->withQueryString();

        $warehouses = Warehouse::orderBy('name')->get(['id', 'name', 'code']);

        // Calcular valorización total sobre el page set
        $valuation = [
            'total_units' => (int) $rows->getCollection()->sum('stock_units'),
            'total_cost_usd' => (float) $rows->getCollection()->sum(function ($row) {
                $units = (int) ($row->stock_units ?? 0);
                $cost = (float) ($row->product->average_cost_usd ?? 0);
                return $units * $cost;
            }),
            'total_price_usd' => (float) $rows->getCollection()->sum(function ($row) {
                $units = (int) ($row->stock_units ?? 0);
                $price = (float) ($row->product->price_usd ?? 0);
                return $units * $price;
            }),
        ];

        return Inertia::render('Admin/Reports/Inventory/ByWarehouse', [
            'rows' => $rows,
            'filters' => $filters,
            'warehouses' => $warehouses,
            'valuation' => $valuation,
        ]);
    }
}

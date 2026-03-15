<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\Warehouse;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class InventoryRotationController extends Controller
{
    public function index(Request $request)
    {
        $filters = [
            'date_from' => $request->input('date_from'),
            'date_to' => $request->input('date_to'),
            'warehouse_id' => $request->input('warehouse_id'),
            'search' => $request->input('search'),
            'only_slow' => $request->boolean('only_slow'),
        ];

        $endDate = $filters['date_to'] ? Carbon::parse($filters['date_to'])->endOfDay() : now();
        $startDate = $filters['date_from'] ? Carbon::parse($filters['date_from'])->startOfDay() : (clone $endDate)->subDays(29)->startOfDay();

        if ($startDate->greaterThan($endDate)) {
            [$startDate, $endDate] = [$endDate->copy()->subDays(29)->startOfDay(), $endDate];
        }

        $periodDays = max(1, $startDate->diffInDays($endDate) + 1);

        $salesSub = InventoryMovement::query()
            ->join('movement_types', 'inventory_movements.movement_type_id', '=', 'movement_types.id')
            ->where('inventory_movements.type', 'exit')
            ->where('movement_types.code', 'sale')
            ->when($filters['warehouse_id'], function ($q, $wid) {
                $q->where('inventory_movements.warehouse_id', $wid);
            })
            ->whereBetween('inventory_movements.created_at', [$startDate, $endDate])
            ->groupBy('inventory_movements.product_id')
            ->selectRaw('inventory_movements.product_id, SUM(inventory_movements.quantity) as units_sold, MAX(inventory_movements.created_at) as last_sale_at');

        $daysExpr = "CASE WHEN COALESCE(sales.units_sold, 0) > 0 THEN (products.stock * {$periodDays}) / sales.units_sold ELSE NULL END";

        $query = Product::query()
            ->leftJoinSub($salesSub, 'sales', function ($join) {
                $join->on('products.id', '=', 'sales.product_id');
            })
            ->select('products.*',
                DB::raw('COALESCE(sales.units_sold, 0) as units_sold'),
                DB::raw('sales.last_sale_at as last_sale_at'),
                DB::raw("{$daysExpr} as days_of_inventory")
            )
            ->when($filters['search'], function ($q, $search) {
                $q->where(function ($qq) use ($search) {
                    $qq->where('products.name', 'like', "%{$search}%")
                        ->orWhere('products.sku', 'like', "%{$search}%")
                        ->orWhere('products.barcode', 'like', "%{$search}%");
                });
            })
            ->when($filters['only_slow'], function ($q) use ($daysExpr) {
                $threshold = 90; // días de inventario considerados como baja rotación
                $q->where(function ($qq) use ($daysExpr, $threshold) {
                    $qq->whereRaw('COALESCE(sales.units_sold, 0) = 0 AND products.stock > 0')
                        ->orWhereRaw("{$daysExpr} >= ?", [$threshold]);
                });
            })
            ->orderByDesc(DB::raw('COALESCE(days_of_inventory, 0)'));

        $products = $query
            ->with('categories:id,name')
            ->paginate(50)
            ->withQueryString();

        $collection = $products->getCollection();

        $metrics = [
            'period_days' => $periodDays,
            'total_products' => $collection->count(),
            'avg_days_inventory' => (float) round($collection->avg(function ($p) {
                return $p->days_of_inventory ?? 0;
            }) ?? 0, 1),
            'products_without_sales' => $collection->filter(function ($p) {
                return (int) ($p->units_sold ?? 0) === 0 && (int) ($p->stock ?? 0) > 0;
            })->count(),
        ];

        $warehouses = Warehouse::orderBy('name')->get(['id', 'name', 'code']);

        return Inertia::render('Admin/Reports/Inventory/Rotation', [
            'products' => $products,
            'filters' => array_merge($filters, [
                'computed_date_from' => $startDate->toDateString(),
                'computed_date_to' => $endDate->toDateString(),
            ]),
            'metrics' => $metrics,
            'warehouses' => $warehouses,
        ]);
    }
}

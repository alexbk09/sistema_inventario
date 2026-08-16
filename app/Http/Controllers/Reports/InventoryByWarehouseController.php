<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\Warehouse;
use App\Services\AdminMoneyService;
use App\Support\Settings;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InventoryByWarehouseController extends Controller
{
    public function index(Request $request, AdminMoneyService $adminMoneyService)
    {
        $filters = [
            'warehouse_id' => $request->input('warehouse_id'),
            'search' => $request->input('search'),
            'view_mode' => $request->input('view_mode', 'list'), // 'list' or 'matrix'
        ];

        $currencySettings = Settings::get('currency', []);
        $adminCurrencyContext = $adminMoneyService->getAdminCurrencyContext($currencySettings);
        $warehouses = Warehouse::orderBy('name')->get(['id', 'name', 'code']);

        if ($filters['view_mode'] === 'matrix') {
            // Vista matriz: productos como filas, bodegas como columnas
            $query = Product::query()
                ->with(['images'])
                ->when($filters['search'], function ($q, $search) {
                    $q->where(function ($qq) use ($search) {
                        $qq->where('name', 'like', "%{$search}%")
                            ->orWhere('sku', 'like', "%{$search}%")
                            ->orWhere('barcode', 'like', "%{$search}%");
                    });
                });

            $products = $query
                ->orderBy('name')
                ->paginate(50)
                ->withQueryString();

            // Obtener stock por producto y bodega
            $stockByWarehouse = InventoryMovement::query()
                ->selectRaw('product_id, warehouse_id, SUM(CASE WHEN type = "entry" THEN quantity ELSE -quantity END) as stock_units')
                ->whereIn('product_id', $products->pluck('id'))
                ->groupBy('product_id', 'warehouse_id')
                ->get()
                ->keyBy(function ($item) {
                    return $item->product_id . '-' . $item->warehouse_id;
                });

            $products->getCollection()->transform(function ($product) use ($stockByWarehouse, $warehouses, $adminMoneyService, $currencySettings) {
                $warehouseStock = [];
                $totalStock = 0;

                foreach ($warehouses as $warehouse) {
                    $key = $product->id . '-' . $warehouse->id;
                    $stock = $stockByWarehouse[$key] ?? null;
                    $units = (int) ($stock->stock_units ?? 0);
                    $totalStock += $units;

                    $warehouseStock[] = [
                        'warehouse_id' => $warehouse->id,
                        'warehouse_name' => $warehouse->name,
                        'warehouse_code' => $warehouse->code,
                        'stock_units' => $units,
                        'value_cost_usd' => $units * (float) ($product->average_cost_usd ?? 0),
                        'value_price_usd' => $units * (float) ($product->price_usd ?? 0),
                    ];
                }

                $product->warehouse_stock = $warehouseStock;
                $product->total_stock = $totalStock;
                $product->total_value_cost_usd = $totalStock * (float) ($product->average_cost_usd ?? 0);
                $product->total_value_price_usd = $totalStock * (float) ($product->price_usd ?? 0);

                // Agregar totales en monedas configuradas
                $product->total_value_cost_admin_totals = $adminMoneyService->buildAdminTotals($product->total_value_cost_usd, $currencySettings)['totals'];
                $product->total_value_price_admin_totals = $adminMoneyService->buildAdminTotals($product->total_value_price_usd, $currencySettings)['totals'];

                return $product;
            });

            $valuation = [
                'total_units' => (int) $products->getCollection()->sum('total_stock'),
                'total_cost_usd' => (float) $products->getCollection()->sum('total_value_cost_usd'),
                'total_price_usd' => (float) $products->getCollection()->sum('total_value_price_usd'),
            ];

            return Inertia::render('Admin/Reports/Inventory/ByWarehouse', [
                'rows' => $products,
                'filters' => $filters,
                'warehouses' => $warehouses,
                'valuation' => [
                    ...$valuation,
                    'total_cost_admin_totals' => $adminMoneyService->buildAdminTotals((float) ($valuation['total_cost_usd'] ?? 0), $currencySettings)['totals'],
                    'total_price_admin_totals' => $adminMoneyService->buildAdminTotals((float) ($valuation['total_price_usd'] ?? 0), $currencySettings)['totals'],
                ],
                'adminCurrencyContext' => $adminCurrencyContext,
            ]);
        }

        // Vista lista original
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

        $rows->getCollection()->transform(function ($row) use ($adminMoneyService, $currencySettings) {
            $units = (int) ($row->stock_units ?? 0);
            $averageCostUsd = (float) ($row->product->average_cost_usd ?? 0);
            $priceUsd = (float) ($row->product->price_usd ?? 0);
            $valueCostUsd = $units * $averageCostUsd;
            $valuePriceUsd = $units * $priceUsd;

            $row->average_cost_admin_totals = $adminMoneyService->buildAdminTotals($averageCostUsd, $currencySettings)['totals'];
            $row->price_admin_totals = $adminMoneyService->buildAdminTotals($priceUsd, $currencySettings)['totals'];
            $row->value_cost_admin_totals = $adminMoneyService->buildAdminTotals($valueCostUsd, $currencySettings)['totals'];
            $row->value_price_admin_totals = $adminMoneyService->buildAdminTotals($valuePriceUsd, $currencySettings)['totals'];

            return $row;
        });

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
            'valuation' => [
                ...$valuation,
                'total_cost_admin_totals' => $adminMoneyService->buildAdminTotals((float) ($valuation['total_cost_usd'] ?? 0), $currencySettings)['totals'],
                'total_price_admin_totals' => $adminMoneyService->buildAdminTotals((float) ($valuation['total_price_usd'] ?? 0), $currencySettings)['totals'],
            ],
            'adminCurrencyContext' => $adminCurrencyContext,
        ]);
    }
}

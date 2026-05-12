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

class InventoryKardexController extends Controller
{
    public function index(Request $request, AdminMoneyService $adminMoneyService)
    {
        $filters = [
            'product_id' => $request->input('product_id'),
            'warehouse_id' => $request->input('warehouse_id'),
            'date_from' => $request->input('date_from'),
            'date_to' => $request->input('date_to'),
        ];

        $currencySettings = Settings::get('currency', []);
        $adminCurrencyContext = $adminMoneyService->getAdminCurrencyContext($currencySettings);

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

        $movements->getCollection()->transform(function (InventoryMovement $movement) use ($adminMoneyService, $currencySettings) {
            $unitAmountUsd = (float) ($movement->unit_price_usd ?? $movement->cost_usd ?? 0);
            $totalValueUsd = (float) ($movement->total_value_usd ?? (($movement->quantity ?? 0) * $unitAmountUsd));

            $movement->unit_price_admin_totals = $adminMoneyService->buildAdminTotals($unitAmountUsd, $currencySettings)['totals'];
            $movement->total_value_admin_totals = $adminMoneyService->buildAdminTotals($totalValueUsd, $currencySettings)['totals'];

            return $movement;
        });

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
            'adminCurrencyContext' => $adminCurrencyContext,
        ]);
    }
}

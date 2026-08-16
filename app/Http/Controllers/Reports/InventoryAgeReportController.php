<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\InvoiceItem;
use App\Services\AdminMoneyService;
use App\Support\Settings;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class InventoryAgeReportController extends Controller
{
    public function index(Request $request, AdminMoneyService $adminMoneyService)
    {
        $filters = [
            'days_threshold' => $request->input('days_threshold', 90),
            'category_id' => $request->input('category_id'),
        ];

        $currencySettings = Settings::get('currency', []);
        $adminCurrencyContext = $adminMoneyService->getAdminCurrencyContext($currencySettings);

        // Encontrar productos sin movimiento en los últimos X días
        $cutoffDate = now()->subDays($filters['days_threshold']);

        $query = Product::query()
            ->leftJoin('invoice_items', 'products.id', '=', 'invoice_items.product_id')
            ->leftJoin('invoices', function ($join) use ($cutoffDate) {
                $join->on('invoice_items.invoice_id', '=', 'invoices.id')
                     ->where('invoices.status', 'paid')
                     ->where('invoices.created_at', '>=', $cutoffDate);
            })
            ->select([
                'products.id',
                'products.name',
                'products.sku',
                'products.barcode',
                'products.stock',
                'products.cost_usd',
                'products.price_usd',
                'products.category_id',
                DB::raw('MAX(invoices.created_at) as last_sale_date'),
                DB::raw('COUNT(DISTINCT invoices.id) as sales_count'),
            ])
            ->groupBy('products.id', 'products.name', 'products.sku', 'products.barcode', 'products.stock', 'products.cost_usd', 'products.price_usd', 'products.category_id')
            ->havingRaw('MAX(invoices.created_at) IS NULL OR MAX(invoices.created_at) < ?', [$cutoffDate]);

        if ($filters['category_id']) {
            $query->where('products.category_id', $filters['category_id']);
        }

        $products = $query->with('category:id,name')
            ->orderByDesc('stock')
            ->orderBy('last_sale_date')
            ->get();

        // Calcular valor de inventario y días sin movimiento
        $products->transform(function ($product) use ($filters, $adminMoneyService, $currencySettings) {
            $lastSale = $product->last_sale_date ? \Carbon\Carbon::parse($product->last_sale_date) : null;
            $daysSinceSale = $lastSale ? $lastSale->diffInDays(now()) : 999;
            $inventoryValue = ($product->stock ?? 0) * ($product->cost_usd ?? 0);

            $product->days_since_sale = $daysSinceSale;
            $product->inventory_value = $inventoryValue;
            $product->inventory_value_admin_totals = $adminMoneyService->buildAdminTotals($inventoryValue, $currencySettings)['totals'];

            return $product;
        });

        // Totales
        $totalProducts = $products->count();
        $totalStock = $products->sum('stock');
        $totalValue = $products->sum('inventory_value');

        $categories = \App\Models\Category::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Admin/Reports/InventoryAge/Index', [
            'products' => $products,
            'filters' => $filters,
            'categories' => $categories,
            'totals' => [
                'total_products' => $totalProducts,
                'total_stock' => $totalStock,
                'total_value' => $totalValue,
                'total_value_admin_totals' => $adminMoneyService->buildAdminTotals($totalValue, $currencySettings)['totals'],
            ],
            'adminCurrencyContext' => $adminCurrencyContext,
        ]);
    }
}

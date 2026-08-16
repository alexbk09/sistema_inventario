<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Product;
use App\Models\Category;
use App\Services\AdminMoneyService;
use App\Support\Settings;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ProfitabilityReportController extends Controller
{
    public function index(Request $request, AdminMoneyService $adminMoneyService)
    {
        $filters = [
            'date_from' => $request->input('date_from', now()->subDays(30)->format('Y-m-d')),
            'date_to' => $request->input('date_to', now()->format('Y-m-d')),
            'category_id' => $request->input('category_id'),
            'group_by' => $request->input('group_by', 'product'), // product, category
        ];

        $currencySettings = Settings::get('currency', []);
        $adminCurrencyContext = $adminMoneyService->getAdminCurrencyContext($currencySettings);

        $query = InvoiceItem::query()
            ->join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')
            ->join('products', 'invoice_items.product_id', '=', 'products.id')
            ->where('invoices.status', 'paid')
            ->whereBetween('invoices.created_at', [$filters['date_from'], $filters['date_to']]);

        if ($filters['category_id']) {
            $query->where('products.category_id', $filters['category_id']);
        }

        if ($filters['group_by'] === 'category') {
            $results = $query->select([
                    'products.category_id',
                    DB::raw('SUM(invoice_items.quantity) as total_quantity'),
                    DB::raw('SUM(invoice_items.total_usd) as total_revenue'),
                    DB::raw('SUM(invoice_items.quantity * products.cost_usd) as total_cost'),
                ])
                ->groupBy('products.category_id')
                ->with('category:id,name')
                ->get();
        } else {
            $results = $query->select([
                    'products.id',
                    'products.name',
                    'products.sku',
                    'products.category_id',
                    DB::raw('SUM(invoice_items.quantity) as total_quantity'),
                    DB::raw('SUM(invoice_items.total_usd) as total_revenue'),
                    DB::raw('SUM(invoice_items.quantity * products.cost_usd) as total_cost'),
                ])
                ->groupBy('products.id', 'products.name', 'products.sku', 'products.category_id')
                ->with('category:id,name')
                ->orderByDesc('total_revenue')
                ->limit(100)
                ->get();
        }

        // Calcular margen bruto
        $results->transform(function ($item) use ($adminMoneyService, $currencySettings) {
            $totalRevenue = (float) ($item->total_revenue ?? 0);
            $totalCost = (float) ($item->total_cost ?? 0);
            $grossProfit = $totalRevenue - $totalCost;
            $marginPercent = $totalRevenue > 0 ? ($grossProfit / $totalRevenue) * 100 : 0;

            $item->gross_profit = $grossProfit;
            $item->margin_percent = $marginPercent;
            $item->total_revenue_admin_totals = $adminMoneyService->buildAdminTotals($totalRevenue, $currencySettings)['totals'];
            $item->total_cost_admin_totals = $adminMoneyService->buildAdminTotals($totalCost, $currencySettings)['totals'];
            $item->gross_profit_admin_totals = $adminMoneyService->buildAdminTotals($grossProfit, $currencySettings)['totals'];

            return $item;
        });

        // Totales globales
        $globalTotals = [
            'total_revenue' => $results->sum('total_revenue'),
            'total_cost' => $results->sum('total_cost'),
            'gross_profit' => $results->sum('gross_profit'),
            'margin_percent' => $results->sum('total_revenue') > 0 
                ? ($results->sum('gross_profit') / $results->sum('total_revenue')) * 100 
                : 0,
        ];

        $categories = Category::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Admin/Reports/Profitability/Index', [
            'results' => $results,
            'filters' => $filters,
            'categories' => $categories,
            'globalTotals' => $globalTotals,
            'adminCurrencyContext' => $adminCurrencyContext,
        ]);
    }
}

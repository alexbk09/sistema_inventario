<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Category;
use App\Exports\InventoryReportExport;
use App\Services\AdminMoneyService;
use App\Support\Settings;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;

class InventoryReportController extends Controller
{
    public function index(Request $request, AdminMoneyService $adminMoneyService)
    {
        $filters = [
            'category_id' => $request->input('category_id'),
            'search' => $request->input('search'),
            'low_stock_only' => $request->boolean('low_stock_only'),
        ];

        $query = Product::query()
            ->with(['categories:id,name'])
            ->when($filters['category_id'], function ($q, $cid) {
                $q->whereHas('categories', function ($cq) use ($cid) {
                    $cq->where('categories.id', $cid);
                });
            })
            ->when($filters['search'], function ($q, $search) {
                $q->where(function ($qq) use ($search) {
                    $qq->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%")
                        ->orWhere('barcode', 'like', "%{$search}%");
                });
            })
            ->when($filters['low_stock_only'], function ($q) {
                $q->where(function ($qq) {
                    $qq->whereNotNull('min_stock')
                        ->whereColumn('stock', '<=', 'min_stock');
                })->orWhere('stock', '<=', 0);
            });

        $currencySettings = Settings::get('currency', []);
        $adminCurrencyContext = $adminMoneyService->getAdminCurrencyContext($currencySettings);

        $valuation = (clone $query)
            ->selectRaw('COALESCE(SUM(stock), 0) as total_units, COALESCE(SUM(stock * average_cost_usd), 0) as total_cost_usd, COALESCE(SUM(stock * price_usd), 0) as total_price_usd')
            ->first();

        $products = $query
            ->orderBy('name')
            ->paginate(50)
            ->withQueryString();

        $products->getCollection()->transform(function (Product $product) use ($adminMoneyService, $currencySettings) {
            $stock = (int) ($product->stock ?? 0);
            $averageCostUsd = (float) ($product->average_cost_usd ?? 0);
            $priceUsd = (float) ($product->price_usd ?? 0);
            $valueCostUsd = $stock * $averageCostUsd;
            $valuePriceUsd = $stock * $priceUsd;

            $product->average_cost_admin_totals = $adminMoneyService->buildAdminTotals($averageCostUsd, $currencySettings)['totals'];
            $product->price_admin_totals = $adminMoneyService->buildAdminTotals($priceUsd, $currencySettings)['totals'];
            $product->value_cost_admin_totals = $adminMoneyService->buildAdminTotals($valueCostUsd, $currencySettings)['totals'];
            $product->value_price_admin_totals = $adminMoneyService->buildAdminTotals($valuePriceUsd, $currencySettings)['totals'];

            return $product;
        });

        $categories = Category::orderBy('name')->get(['id', 'name']);

        return inertia('Admin/Reports/Inventory/Index', [
            'products' => $products,
            'filters' => $filters,
            'adminCurrencyContext' => $adminCurrencyContext,
            'valuation' => [
                'total_units' => (int) ($valuation->total_units ?? 0),
                'total_cost_usd' => (float) ($valuation->total_cost_usd ?? 0),
                'total_price_usd' => (float) ($valuation->total_price_usd ?? 0),
                'total_cost_admin_totals' => $adminMoneyService->buildAdminTotals((float) ($valuation->total_cost_usd ?? 0), $currencySettings)['totals'],
                'total_price_admin_totals' => $adminMoneyService->buildAdminTotals((float) ($valuation->total_price_usd ?? 0), $currencySettings)['totals'],
            ],
            'categories' => $categories,
        ]);
    }

    public function export(Request $request, AdminMoneyService $adminMoneyService)
    {
        $filters = [
            'category_id' => $request->input('category_id'),
            'search' => $request->input('search'),
            'low_stock_only' => $request->boolean('low_stock_only'),
        ];

        $currencySettings = Settings::get('currency', []);
        $adminCurrencyContext = $adminMoneyService->getAdminCurrencyContext($currencySettings);
        $defaultDisplayCurrency = (string) ($adminCurrencyContext['default_display_currency'] ?? 'USD');

        $query = Product::query()
            ->with(['categories:id,name'])
            ->when($filters['category_id'], function ($q, $cid) {
                $q->whereHas('categories', function ($cq) use ($cid) {
                    $cq->where('categories.id', $cid);
                });
            })
            ->when($filters['search'], function ($q, $search) {
                $q->where(function ($qq) use ($search) {
                    $qq->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%")
                        ->orWhere('barcode', 'like', "%{$search}%");
                });
            })
            ->when($filters['low_stock_only'], function ($q) {
                $q->where(function ($qq) {
                    $qq->whereNotNull('min_stock')
                        ->whereColumn('stock', '<=', 'min_stock');
                })->orWhere('stock', '<=', 0);
            })
            ->orderBy('name');

        $fileName = __('app.report_exports.inventory.file_prefix').'_'.now()->format('Ymd_His').'.csv';

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="'.$fileName.'"',
            'Cache-Control' => 'no-store, no-cache, must-revalidate',
        ];

        $callback = function () use ($query, $adminMoneyService, $adminCurrencyContext, $defaultDisplayCurrency, $currencySettings) {
            $handle = fopen('php://output', 'w');

            fwrite($handle, "\xEF\xBB\xBF");

            $headings = [
                __('app.report_exports.inventory.columns.product'),
                __('app.report_exports.inventory.columns.sku'),
                __('app.report_exports.inventory.columns.categories'),
                __('app.report_exports.inventory.columns.stock'),
                __('app.report_exports.inventory.columns.avg_cost_usd').' '.$defaultDisplayCurrency,
                __('app.report_exports.inventory.columns.price_usd').' '.$defaultDisplayCurrency,
            ];

            foreach ($adminCurrencyContext['codes'] ?? [] as $code) {
                $headings[] = __('app.report_exports.inventory.columns.value_cost_usd').' '.$code;
                $headings[] = __('app.report_exports.inventory.columns.value_price_usd').' '.$code;
            }

            fputcsv($handle, $headings);

            $query->chunk(2000, function ($chunk) use ($handle, $adminMoneyService, $adminCurrencyContext, $defaultDisplayCurrency, $currencySettings) {
                foreach ($chunk as $product) {
                    $categoriesNames = $product->categories->pluck('name')->implode(', ');
                    $stock = (int) ($product->stock ?? 0);
                    $cost = (float) ($product->average_cost_usd ?? 0);
                    $price = (float) ($product->price_usd ?? 0);
                    $valueCost = $stock * $cost;
                    $valuePrice = $stock * $price;
                    $costTotals = $adminMoneyService->buildAdminTotals($cost, $currencySettings)['totals'];
                    $priceTotals = $adminMoneyService->buildAdminTotals($price, $currencySettings)['totals'];
                    $valueCostTotals = $adminMoneyService->buildAdminTotals($valueCost, $currencySettings)['totals'];
                    $valuePriceTotals = $adminMoneyService->buildAdminTotals($valuePrice, $currencySettings)['totals'];

                    $row = [
                        $product->name,
                        $product->sku,
                        $categoriesNames,
                        $stock,
                        number_format((float) ($costTotals[$defaultDisplayCurrency] ?? 0), 2, '.', ''),
                        number_format((float) ($priceTotals[$defaultDisplayCurrency] ?? 0), 2, '.', ''),
                    ];

                    foreach ($adminCurrencyContext['codes'] ?? [] as $code) {
                        $row[] = number_format((float) ($valueCostTotals[$code] ?? 0), 2, '.', '');
                        $row[] = number_format((float) ($valuePriceTotals[$code] ?? 0), 2, '.', '');
                    }

                    fputcsv($handle, $row);
                }
            });

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function exportExcel(Request $request, AdminMoneyService $adminMoneyService)
    {
        $filters = [
            'category_id' => $request->input('category_id'),
            'search' => $request->input('search'),
            'low_stock_only' => $request->boolean('low_stock_only'),
        ];

        $fileName = __('app.report_exports.inventory.file_prefix').'_'.now()->format('Ymd_His').'.xlsx';

        return Excel::download(new InventoryReportExport($filters, $adminMoneyService->getAdminCurrencyContext()), $fileName);
    }

    public function exportPdf(Request $request, AdminMoneyService $adminMoneyService)
    {
        $filters = [
            'category_id' => $request->input('category_id'),
            'search' => $request->input('search'),
            'low_stock_only' => $request->boolean('low_stock_only'),
        ];

        $currencySettings = Settings::get('currency', []);
        $adminCurrencyContext = $adminMoneyService->getAdminCurrencyContext($currencySettings);

        $query = Product::query()
            ->with(['categories:id,name'])
            ->when($filters['category_id'], function ($q, $cid) {
                $q->whereHas('categories', function ($cq) use ($cid) {
                    $cq->where('categories.id', $cid);
                });
            })
            ->when($filters['search'], function ($q, $search) {
                $q->where(function ($qq) use ($search) {
                    $qq->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%")
                        ->orWhere('barcode', 'like', "%{$search}%");
                });
            })
            ->when($filters['low_stock_only'], function ($q) {
                $q->where(function ($qq) {
                    $qq->whereNotNull('min_stock')
                        ->whereColumn('stock', '<=', 'min_stock');
                })->orWhere('stock', '<=', 0);
            })
            ->orderBy('name');

        $maxRows = 5000;
        $products = $query->limit($maxRows)->get();

        $products->transform(function (Product $product) use ($adminMoneyService, $currencySettings) {
            $stock = (int) ($product->stock ?? 0);
            $averageCostUsd = (float) ($product->average_cost_usd ?? 0);
            $priceUsd = (float) ($product->price_usd ?? 0);
            $valueCostUsd = $stock * $averageCostUsd;
            $valuePriceUsd = $stock * $priceUsd;

            $product->average_cost_admin_totals = $adminMoneyService->buildAdminTotals($averageCostUsd, $currencySettings)['totals'];
            $product->price_admin_totals = $adminMoneyService->buildAdminTotals($priceUsd, $currencySettings)['totals'];
            $product->value_cost_admin_totals = $adminMoneyService->buildAdminTotals($valueCostUsd, $currencySettings)['totals'];
            $product->value_price_admin_totals = $adminMoneyService->buildAdminTotals($valuePriceUsd, $currencySettings)['totals'];

            return $product;
        });

        $valuation = [
            'total_units' => (int) $products->sum('stock'),
            'total_cost_usd' => (float) $products->sum(fn ($p) => (int) ($p->stock ?? 0) * (float) ($p->average_cost_usd ?? 0)),
            'total_price_usd' => (float) $products->sum(fn ($p) => (int) ($p->stock ?? 0) * (float) ($p->price_usd ?? 0)),
            'total_cost_admin_totals' => $adminMoneyService->buildAdminTotals((float) $products->sum(fn ($p) => (int) ($p->stock ?? 0) * (float) ($p->average_cost_usd ?? 0)), $currencySettings)['totals'],
            'total_price_admin_totals' => $adminMoneyService->buildAdminTotals((float) $products->sum(fn ($p) => (int) ($p->stock ?? 0) * (float) ($p->price_usd ?? 0)), $currencySettings)['totals'],
        ];

        $pdf = Pdf::loadView('reports.inventory_pdf', [
            'products' => $products,
            'valuation' => $valuation,
            'filters' => $filters,
            'maxRows' => $maxRows,
            'adminCurrencyContext' => $adminCurrencyContext,
        ])->setPaper('a4', 'landscape');

        $fileName = __('app.report_exports.inventory.file_prefix').'_'.now()->format('Ymd_His').'.pdf';

        return $pdf->download($fileName);
    }
}

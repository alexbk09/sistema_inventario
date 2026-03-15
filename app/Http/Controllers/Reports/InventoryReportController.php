<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Category;
use App\Exports\InventoryReportExport;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;

class InventoryReportController extends Controller
{
    public function index(Request $request)
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

        $valuation = (clone $query)
            ->selectRaw('COALESCE(SUM(stock), 0) as total_units, COALESCE(SUM(stock * average_cost_usd), 0) as total_cost_usd, COALESCE(SUM(stock * price_usd), 0) as total_price_usd')
            ->first();

        $products = $query
            ->orderBy('name')
            ->paginate(50)
            ->withQueryString();

        $categories = Category::orderBy('name')->get(['id', 'name']);

        return inertia('Admin/Reports/Inventory/Index', [
            'products' => $products,
            'filters' => $filters,
            'valuation' => [
                'total_units' => (int) ($valuation->total_units ?? 0),
                'total_cost_usd' => (float) ($valuation->total_cost_usd ?? 0),
                'total_price_usd' => (float) ($valuation->total_price_usd ?? 0),
            ],
            'categories' => $categories,
        ]);
    }

    public function export(Request $request)
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
            })
            ->orderBy('name');

        $fileName = 'reporte_inventario_'.now()->format('Ymd_His').'.csv';

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="'.$fileName.'"',
            'Cache-Control' => 'no-store, no-cache, must-revalidate',
        ];

        $callback = function () use ($query) {
            $handle = fopen('php://output', 'w');

            fwrite($handle, "\xEF\xBB\xBF");

            fputcsv($handle, [
                'Producto',
                'SKU',
                'Categorías',
                'Stock',
                'Costo prom. USD',
                'Precio USD',
                'Valor costo (USD)',
                'Valor venta (USD)',
            ]);

            $query->chunk(2000, function ($chunk) use ($handle) {
                foreach ($chunk as $product) {
                    $categoriesNames = $product->categories->pluck('name')->implode(', ');
                    $stock = (int) ($product->stock ?? 0);
                    $cost = (float) ($product->average_cost_usd ?? 0);
                    $price = (float) ($product->price_usd ?? 0);
                    $valueCost = $stock * $cost;
                    $valuePrice = $stock * $price;

                    fputcsv($handle, [
                        $product->name,
                        $product->sku,
                        $categoriesNames,
                        $stock,
                        number_format($cost, 2, '.', ''),
                        number_format($price, 2, '.', ''),
                        number_format($valueCost, 2, '.', ''),
                        number_format($valuePrice, 2, '.', ''),
                    ]);
                }
            });

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function exportExcel(Request $request)
    {
        $filters = [
            'category_id' => $request->input('category_id'),
            'search' => $request->input('search'),
            'low_stock_only' => $request->boolean('low_stock_only'),
        ];

        $fileName = 'reporte_inventario_'.now()->format('Ymd_His').'.xlsx';

        return Excel::download(new InventoryReportExport($filters), $fileName);
    }

    public function exportPdf(Request $request)
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
            })
            ->orderBy('name');

        $maxRows = 5000;
        $products = $query->limit($maxRows)->get();

        $valuation = [
            'total_units' => (int) $products->sum('stock'),
            'total_cost_usd' => (float) $products->sum(fn ($p) => (int) ($p->stock ?? 0) * (float) ($p->average_cost_usd ?? 0)),
            'total_price_usd' => (float) $products->sum(fn ($p) => (int) ($p->stock ?? 0) * (float) ($p->price_usd ?? 0)),
        ];

        $pdf = Pdf::loadView('reports.inventory_pdf', [
            'products' => $products,
            'valuation' => $valuation,
            'filters' => $filters,
            'maxRows' => $maxRows,
        ])->setPaper('a4', 'landscape');

        $fileName = 'reporte_inventario_'.now()->format('Ymd_His').'.pdf';

        return $pdf->download($fileName);
    }
}

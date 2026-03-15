<?php

namespace App\Http\Controllers;

use App\Models\{Invoice, InvoiceItem, Warehouse, Product, Category, Provider, Customer, User, Rma, Layaway, CreditAccount};
use App\Services\CurrencyService;
use App\Support\Settings;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $mode = $request->input('mode', 'daily'); // daily|monthly (por ahora solo daily)
        $warehouseId = $request->input('warehouse_id');

        $today = Carbon::today();
        $startCurrent = $today->copy()->subDays(29);
        $startPrevious = $startCurrent->copy()->subDays(30);
        $endPrevious = $startCurrent->copy()->subDay();

        $baseInvoiceScope = Invoice::query()
            ->whereNull('cancelled_at')
            ->when($warehouseId, function ($q, $wid) {
                $q->where('warehouse_id', $wid);
            });

        // Ventas por día – período actual
        $currentSalesRaw = (clone $baseInvoiceScope)
            ->whereBetween('created_at', [$startCurrent->copy()->startOfDay(), $today->copy()->endOfDay()])
            ->selectRaw('DATE(created_at) as date, SUM(total_usd) as total_usd')
            ->groupBy('date')
            ->orderBy('date')
            ->pluck('total_usd', 'date');

        // Ventas por día – período anterior
        $previousSalesRaw = (clone $baseInvoiceScope)
            ->whereBetween('created_at', [$startPrevious->copy()->startOfDay(), $endPrevious->copy()->endOfDay()])
            ->selectRaw('DATE(created_at) as date, SUM(total_usd) as total_usd')
            ->groupBy('date')
            ->orderBy('date')
            ->pluck('total_usd', 'date');

        $labels = [];
        $currentSeries = [];
        $previousSeries = [];

        $periodCurrent = CarbonPeriod::create($startCurrent, $today);
        foreach ($periodCurrent as $index => $date) {
            $key = $date->toDateString();
            $labels[] = $date->format('d/m');
            $currentSeries[] = (float) ($currentSalesRaw[$key] ?? 0);

            // mismo índice relativo en el período anterior
            $prevDate = $startPrevious->copy()->addDays($index);
            $prevKey = $prevDate->toDateString();
            $previousSeries[] = (float) ($previousSalesRaw[$prevKey] ?? 0);
        }

        // KPIs básicos período actual
        $metricsRow = (clone $baseInvoiceScope)
            ->whereBetween('created_at', [$startCurrent->copy()->startOfDay(), $today->copy()->endOfDay()])
            ->selectRaw('COUNT(*) as total_invoices, COALESCE(SUM(total_usd),0) as total_usd')
            ->first();

        $totalInvoices = (int) ($metricsRow->total_invoices ?? 0);
        $totalUsd = (float) ($metricsRow->total_usd ?? 0);

        $avgTicket = $totalInvoices > 0 ? $totalUsd / $totalInvoices : 0.0;

        // Estimación de margen: ventas - costo promedio
        $marginUsd = 0.0;
        $costUsd = 0.0;

        $items = InvoiceItem::query()
            ->selectRaw('invoice_items.product_id, SUM(invoice_items.quantity) as qty, SUM(invoice_items.subtotal_usd) as sales_usd')
            ->join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')
            ->join('products', 'invoice_items.product_id', '=', 'products.id')
            ->whereNull('invoices.cancelled_at')
            ->when($warehouseId, function ($q, $wid) {
                $q->where('invoices.warehouse_id', $wid);
            })
            ->whereBetween('invoices.created_at', [$startCurrent->copy()->startOfDay(), $today->copy()->endOfDay()])
            ->groupBy('invoice_items.product_id', 'products.average_cost_usd')
            ->get();

        foreach ($items as $row) {
            $sales = (float) ($row->sales_usd ?? 0);
            $cost = (float) ($row->qty ?? 0) * (float) ($row->average_cost_usd ?? 0);
            $costUsd += $cost;
            $marginUsd += max($sales - $cost, 0);
        }

        // % crédito vs contado (por facturas con cuenta de crédito asociada)
        $creditSales = (clone $baseInvoiceScope)
            ->whereBetween('created_at', [$startCurrent->copy()->startOfDay(), $today->copy()->endOfDay()])
            ->whereNotNull('credit_account_id')
            ->sum('total_usd');

        $creditSales = (float) $creditSales;
        $cashSales = max($totalUsd - $creditSales, 0.0);

        $creditShare = $totalUsd > 0 ? ($creditSales / $totalUsd) * 100 : 0.0;
        $cashShare = $totalUsd > 0 ? ($cashSales / $totalUsd) * 100 : 0.0;

        // Top productos (por cantidad vendida)
        $topProducts = InvoiceItem::query()
            ->selectRaw('invoice_items.product_id, SUM(invoice_items.quantity) as total_quantity, SUM(invoice_items.subtotal_usd) as total_sales_usd')
            ->join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')
            ->join('products', 'invoice_items.product_id', '=', 'products.id')
            ->whereNull('invoices.cancelled_at')
            ->when($warehouseId, function ($q, $wid) {
                $q->where('invoices.warehouse_id', $wid);
            })
            ->whereBetween('invoices.created_at', [$startCurrent->copy()->startOfDay(), $today->copy()->endOfDay()])
            ->groupBy('invoice_items.product_id', 'products.name')
            ->orderByDesc('total_quantity')
            ->limit(5)
            ->get()
            ->map(function ($row) {
                return [
                    'label' => $row->name,
                    'quantity' => (float) $row->total_quantity,
                    'total_sales_usd' => (float) $row->total_sales_usd,
                ];
            })
            ->values();

        // Top clientes (por monto vendido)
        $topCustomers = Invoice::query()
            ->selectRaw('customer_id, SUM(total_usd) as total_sales_usd, COUNT(*) as total_invoices')
            ->with('customer:id,name')
            ->whereNull('cancelled_at')
            ->when($warehouseId, function ($q, $wid) {
                $q->where('warehouse_id', $wid);
            })
            ->whereBetween('created_at', [$startCurrent->copy()->startOfDay(), $today->copy()->endOfDay()])
            ->groupBy('customer_id')
            ->orderByDesc('total_sales_usd')
            ->limit(5)
            ->get()
            ->map(function ($row) {
                return [
                    'label' => optional($row->customer)->name ?? 'Sin cliente',
                    'total_sales_usd' => (float) $row->total_sales_usd,
                    'total_invoices' => (int) $row->total_invoices,
                ];
            })
            ->values();

        $warehouses = Warehouse::orderBy('name')->get(['id', 'name', 'code']);

        // --- Métricas clásicas del dashboard (ventas del día/mes, stock, estados, etc.) ---
        $todayStart = now()->startOfDay();
        $monthStart = now()->startOfMonth();

        $currency = app(CurrencyService::class);
        $rate = $currency->getPromedio('oficial') ?? (float) config('currency.bs_rate', 0);

        // Configuración de inventario para umbral de stock bajo
        $inventorySettings = Settings::get('inventory', [
            'default_min_stock' => 0,
        ]);
        $defaultMinStock = (int) ($inventorySettings['default_min_stock'] ?? 0);

        // Query base para productos con stock bajo
        $lowStockQuery = Product::query()
            ->where(function ($q) {
                // Productos con min_stock definido: stock <= min_stock
                $q->whereNotNull('min_stock')
                  ->whereColumn('stock', '<=', 'min_stock');
            })
            ->orWhere(function ($q) use ($defaultMinStock) {
                // Productos sin min_stock pero con umbral global definido
                if ($defaultMinStock > 0) {
                    $q->whereNull('min_stock')
                      ->where('stock', '<=', $defaultMinStock);
                }
            })
            ->orWhere('stock', '<=', 0); // Siempre alertar productos en cero o negativos

        $todayCompleted = Invoice::where('status', 'paid')
            ->when($warehouseId, fn($q) => $q->where('warehouse_id', $warehouseId))
            ->where('created_at', '>=', $todayStart);

        $monthCompleted = Invoice::where('status', 'paid')
            ->when($warehouseId, fn($q) => $q->where('warehouse_id', $warehouseId))
            ->where('created_at', '>=', $monthStart);

        $legacyMetrics = [
            'today_sales_usd' => (float) $todayCompleted->sum('total_usd'),
            'today_sales_count' => (int) $todayCompleted->count(),
            'month_sales_usd' => (float) $monthCompleted->sum('total_usd'),
            'month_sales_count' => (int) $monthCompleted->count(),
            'low_stock_products' => (int) (clone $lowStockQuery)->count(),
            'total_stock' => (int) Product::sum('stock'),
            'invoice_pending' => (int) Invoice::where('status', 'pending')->when($warehouseId, fn($q) => $q->where('warehouse_id', $warehouseId))->count(),
            'invoice_paid' => (int) Invoice::where('status', 'paid')->when($warehouseId, fn($q) => $q->where('warehouse_id', $warehouseId))->count(),
            'invoice_cancelled' => (int) Invoice::where('status', 'cancelled')->count(),
            'rma_pending' => (int) Rma::whereIn('status', ['pending', 'approved'])->count(),
            'layaway_active' => (int) Layaway::where('status', 'active')->count(),
            'credit_open' => (int) CreditAccount::where('status', 'active')->count(),
        ];

        $counts = [
            'products' => (int) Product::count(),
            'categories' => (int) Category::count(),
            'providers' => (int) Provider::count(),
            'invoices' => (int) Invoice::count(),
            'customers' => (int) Customer::count(),
            'users' => (int) User::count(),
            'rmas' => (int) Rma::count(),
            'warehouses' => (int) Warehouse::count(),
            'credits' => (int) CreditAccount::count(),
        ];

        $lowStockProducts = (clone $lowStockQuery)
            ->orderBy('stock')
            ->take(10)
            ->get(['id', 'name', 'sku', 'stock', 'min_stock']);

        $expiredLayaways = Layaway::whereIn('status', ['active', 'pending'])
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now())
            ->with('customer:id,name')
            ->orderBy('expires_at')
            ->take(10)
            ->get(['id', 'number', 'customer_id', 'total_usd', 'expires_at', 'status']);

        return inertia('Admin/Dashboard', [
            'filters' => [
                'mode' => $mode,
                'warehouse_id' => $warehouseId,
            ],
            'charts' => [
                'sales' => [
                    'labels' => $labels,
                    'current' => $currentSeries,
                    'previous' => $previousSeries,
                ],
            ],
            'metrics' => [
                'total_invoices' => $totalInvoices,
                'total_usd' => $totalUsd,
                'avg_ticket_usd' => $avgTicket,
                'margin_usd' => $marginUsd,
                'cost_usd' => $costUsd,
                'credit_sales_usd' => $creditSales,
                'cash_sales_usd' => $cashSales,
                'credit_share' => $creditShare,
                'cash_share' => $cashShare,
            ],
            'legacyMetrics' => $legacyMetrics,
            'counts' => $counts,
            'lowStockProducts' => $lowStockProducts,
            'expiredLayaways' => $expiredLayaways,
            'topProducts' => $topProducts,
            'topCustomers' => $topCustomers,
            'warehouses' => $warehouses,
            'selected_warehouse' => $warehouseId,
            'rate' => $rate,
        ]);
    }
}

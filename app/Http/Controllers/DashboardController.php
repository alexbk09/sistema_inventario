<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Warehouse;
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
            'topProducts' => $topProducts,
            'topCustomers' => $topCustomers,
            'warehouses' => $warehouses,
        ]);
    }
}

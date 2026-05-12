<?php

namespace App\Http\Controllers;

use App\Models\{Invoice, InvoiceItem, Warehouse, Product, Category, Provider, Customer, User, Rma, Layaway, CreditAccount};
use App\Services\AdminMoneyService;
use App\Services\CurrencyService;
use App\Support\Settings;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request, AdminMoneyService $adminMoneyService)
    {
        $mode = $request->input('mode', 'daily'); // daily|monthly (por ahora solo daily)
        $warehouseId = $request->input('warehouse_id');
        $currencySettings = Settings::get('currency', []);
        $adminCurrencyContext = $adminMoneyService->getAdminCurrencyContext($currencySettings);
        $currencyCodes = $adminCurrencyContext['codes'] ?? [];

        $today = Carbon::today();
        $startCurrent = $today->copy()->subDays(29);
        $startPrevious = $startCurrent->copy()->subDays(30);
        $endPrevious = $startCurrent->copy()->subDay();

        $baseInvoiceScope = Invoice::query()
            ->whereNull('cancelled_at')
            ->when($warehouseId, function ($q, $wid) {
                $q->where('warehouse_id', $wid);
            });

        $currentInvoices = (clone $baseInvoiceScope)
            ->whereBetween('created_at', [$startCurrent->copy()->startOfDay(), $today->copy()->endOfDay()])
            ->with('customer:id,name')
            ->get(['id', 'customer_id', 'credit_account_id', 'total_usd', 'created_at', 'currency_code', 'base_currency_code', 'monetary_totals_json']);

        $previousInvoices = (clone $baseInvoiceScope)
            ->whereBetween('created_at', [$startPrevious->copy()->startOfDay(), $endPrevious->copy()->endOfDay()])
            ->get(['id', 'customer_id', 'credit_account_id', 'total_usd', 'created_at', 'currency_code', 'base_currency_code', 'monetary_totals_json']);

        $zeroTotals = $this->buildZeroTotals($currencyCodes);
        $currentSalesByDate = $this->aggregateInvoicesByDate($currentInvoices, $adminMoneyService, $currencySettings, $zeroTotals);
        $previousSalesByDate = $this->aggregateInvoicesByDate($previousInvoices, $adminMoneyService, $currencySettings, $zeroTotals);

        $labels = [];
        $currentSeries = [];
        $previousSeries = [];
        $currentSeriesByCurrency = [];
        $previousSeriesByCurrency = [];

        foreach ($currencyCodes as $code) {
            $currentSeriesByCurrency[$code] = [];
            $previousSeriesByCurrency[$code] = [];
        }

        $periodCurrent = CarbonPeriod::create($startCurrent, $today);
        foreach ($periodCurrent as $index => $date) {
            $key = $date->toDateString();
            $labels[] = $date->format('d/m');
            $currentSeries[] = (float) ($currentSalesByDate[$key]['USD'] ?? 0);

            foreach ($currencyCodes as $code) {
                $currentSeriesByCurrency[$code][] = (float) ($currentSalesByDate[$key][$code] ?? 0);
            }

            // mismo índice relativo en el período anterior
            $prevDate = $startPrevious->copy()->addDays($index);
            $prevKey = $prevDate->toDateString();
            $previousSeries[] = (float) ($previousSalesByDate[$prevKey]['USD'] ?? 0);

            foreach ($currencyCodes as $code) {
                $previousSeriesByCurrency[$code][] = (float) ($previousSalesByDate[$prevKey][$code] ?? 0);
            }
        }

        // KPIs básicos período actual
        $totalInvoices = (int) $currentInvoices->count();
        $totalUsd = (float) $currentInvoices->sum('total_usd');
        $totalSalesTotals = $this->sumInvoiceDocumentTotals($currentInvoices, $adminMoneyService, $currencySettings, $zeroTotals);

        $avgTicket = $totalInvoices > 0 ? $totalUsd / $totalInvoices : 0.0;
        $avgTicketTotals = $this->divideTotals($totalSalesTotals, $totalInvoices, $zeroTotals);

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
        $creditInvoices = $currentInvoices->filter(fn (Invoice $invoice) => $invoice->credit_account_id !== null)->values();
        $creditSales = (float) $creditInvoices->sum('total_usd');
        $cashSales = max($totalUsd - $creditSales, 0.0);
        $creditSalesTotals = $this->sumInvoiceDocumentTotals($creditInvoices, $adminMoneyService, $currencySettings, $zeroTotals);
        $cashSalesTotals = $this->subtractTotals($totalSalesTotals, $creditSalesTotals, $zeroTotals);

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
        $topCustomers = $currentInvoices
            ->groupBy(fn (Invoice $invoice) => $invoice->customer_id ?: 'guest')
            ->map(function ($customerInvoices) use ($adminMoneyService, $currencySettings, $zeroTotals) {
                /** @var \Illuminate\Support\Collection $customerInvoices */
                $firstInvoice = $customerInvoices->first();

                return [
                    'label' => $firstInvoice?->customer?->name ?? 'Sin cliente',
                    'total_sales_usd' => (float) $customerInvoices->sum('total_usd'),
                    'total_invoices' => (int) $customerInvoices->count(),
                    'admin_totals' => $this->sumInvoiceDocumentTotals($customerInvoices, $adminMoneyService, $currencySettings, $zeroTotals),
                ];
            })
            ->sortByDesc('total_sales_usd')
            ->take(5)
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

        $todayCompletedInvoices = (clone $todayCompleted)
            ->get(['id', 'total_usd', 'currency_code', 'base_currency_code', 'monetary_totals_json']);
        $monthCompletedInvoices = (clone $monthCompleted)
            ->get(['id', 'total_usd', 'currency_code', 'base_currency_code', 'monetary_totals_json']);

        $todaySalesTotals = $this->sumInvoiceDocumentTotals($todayCompletedInvoices, $adminMoneyService, $currencySettings, $zeroTotals);
        $monthSalesTotals = $this->sumInvoiceDocumentTotals($monthCompletedInvoices, $adminMoneyService, $currencySettings, $zeroTotals);

        $legacyMetrics = [
            'today_sales_usd' => (float) $todayCompletedInvoices->sum('total_usd'),
            'today_sales_count' => (int) $todayCompletedInvoices->count(),
            'month_sales_usd' => (float) $monthCompletedInvoices->sum('total_usd'),
            'month_sales_count' => (int) $monthCompletedInvoices->count(),
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
            ->get(['id', 'number', 'customer_id', 'total_usd', 'currency_code', 'base_currency_code', 'monetary_totals_json', 'expires_at', 'status']);

        $dashboardMoney = [
            'total_sales' => ['totals' => $totalSalesTotals],
            'avg_ticket' => ['totals' => $avgTicketTotals],
            'margin' => $adminMoneyService->buildAdminTotals($marginUsd),
            'credit_sales' => ['totals' => $creditSalesTotals],
            'cash_sales' => ['totals' => $cashSalesTotals],
            'today_sales' => ['totals' => $todaySalesTotals],
            'month_sales' => ['totals' => $monthSalesTotals],
        ];

        $expiredLayaways = $expiredLayaways->map(function (Layaway $layaway) use ($adminMoneyService, $currencySettings) {
            $layaway->document_totals = $this->resolveLayawayDocumentTotals($layaway, $adminMoneyService, $currencySettings);

            return $layaway;
        })->values();

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
                    'currentByCurrency' => $currentSeriesByCurrency,
                    'previousByCurrency' => $previousSeriesByCurrency,
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
            'adminCurrencyContext' => $adminCurrencyContext,
            'dashboardMoney' => $dashboardMoney,
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

    protected function buildZeroTotals(array $currencyCodes): array
    {
        $totals = [];

        foreach ($currencyCodes as $code) {
            $totals[$code] = 0.0;
        }

        return $totals;
    }

    protected function aggregateInvoicesByDate($invoices, AdminMoneyService $adminMoneyService, array $currencySettings, array $zeroTotals): array
    {
        $totalsByDate = [];

        foreach ($invoices as $invoice) {
            $dateKey = optional($invoice->created_at)->toDateString();
            if (! $dateKey) {
                continue;
            }

            if (! array_key_exists($dateKey, $totalsByDate)) {
                $totalsByDate[$dateKey] = $zeroTotals;
            }

            $documentTotals = $this->resolveInvoiceDocumentTotals($invoice, $adminMoneyService, $currencySettings);
            foreach ($totalsByDate[$dateKey] as $code => $amount) {
                $totalsByDate[$dateKey][$code] = round($amount + (float) ($documentTotals[$code] ?? 0), 2);
            }
        }

        return $totalsByDate;
    }

    protected function sumInvoiceDocumentTotals($invoices, AdminMoneyService $adminMoneyService, array $currencySettings, array $zeroTotals): array
    {
        $totals = $zeroTotals;

        foreach ($invoices as $invoice) {
            $documentTotals = $this->resolveInvoiceDocumentTotals($invoice, $adminMoneyService, $currencySettings);
            foreach ($totals as $code => $amount) {
                $totals[$code] = round($amount + (float) ($documentTotals[$code] ?? 0), 2);
            }
        }

        return $totals;
    }

    protected function divideTotals(array $totals, int $divisor, array $zeroTotals): array
    {
        if ($divisor <= 0) {
            return $zeroTotals;
        }

        $result = $zeroTotals;
        foreach ($totals as $code => $amount) {
            $result[$code] = round((float) $amount / $divisor, 2);
        }

        return $result;
    }

    protected function subtractTotals(array $totals, array $subtract, array $zeroTotals): array
    {
        $result = $zeroTotals;
        foreach ($result as $code => $amount) {
            $result[$code] = round(max(((float) ($totals[$code] ?? 0)) - ((float) ($subtract[$code] ?? 0)), 0), 2);
        }

        return $result;
    }

    protected function resolveInvoiceDocumentTotals(Invoice $invoice, AdminMoneyService $adminMoneyService, array $currencySettings): array
    {
        if (is_array($invoice->monetary_totals_json['totals'] ?? null)) {
            return $invoice->monetary_totals_json['totals'];
        }

        $snapshot = is_array($invoice->monetary_totals_json['rates'] ?? null)
            ? [
                'base_currency' => (string) ($invoice->base_currency_code ?: 'USD'),
                'captured_at' => $invoice->monetary_totals_json['captured_at'] ?? null,
                'rates' => $invoice->monetary_totals_json['rates'],
            ]
            : null;

        return $adminMoneyService->buildDocumentTotals((float) ($invoice->total_usd ?? 0), $currencySettings, $snapshot)['totals'];
    }

    protected function resolveLayawayDocumentTotals(Layaway $layaway, AdminMoneyService $adminMoneyService, array $currencySettings): array
    {
        if (is_array($layaway->monetary_totals_json['totals'] ?? null)) {
            return $layaway->monetary_totals_json['totals'];
        }

        $snapshot = is_array($layaway->monetary_totals_json['rates'] ?? null)
            ? [
                'base_currency' => (string) ($layaway->base_currency_code ?: 'USD'),
                'captured_at' => $layaway->monetary_totals_json['captured_at'] ?? null,
                'rates' => $layaway->monetary_totals_json['rates'],
            ]
            : null;

        return $adminMoneyService->buildDocumentTotals((float) ($layaway->total_usd ?? 0), $currencySettings, $snapshot)['totals'];
    }
}

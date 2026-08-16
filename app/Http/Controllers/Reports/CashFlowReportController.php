<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\InventoryMovement;
use App\Models\Provider;
use App\Services\AdminMoneyService;
use App\Support\Settings;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CashFlowReportController extends Controller
{
    public function index(Request $request, AdminMoneyService $adminMoneyService)
    {
        $filters = [
            'date_from' => $request->input('date_from', now()->subDays(30)->format('Y-m-d')),
            'date_to' => $request->input('date_to', now()->format('Y-m-d')),
            'period' => $request->input('period', 'daily'), // daily, weekly, monthly
        ];

        $currencySettings = Settings::get('currency', []);
        $adminCurrencyContext = $adminMoneyService->getAdminCurrencyContext($currencySettings);

        // Determinar agrupación por período
        $dateFormat = match($filters['period']) {
            'daily' => '%Y-%m-%d',
            'weekly' => '%Y-%u',
            'monthly' => '%Y-%m',
            default => '%Y-%m-%d',
        };

        // Ingresos por período (facturas pagadas)
        $incomeQuery = Invoice::query()
            ->where('status', 'paid')
            ->whereBetween('created_at', [$filters['date_from'], $filters['date_to']])
            ->select([
                DB::raw("DATE_FORMAT(created_at, '{$dateFormat}') as period"),
                DB::raw('SUM(total_usd) as total_income'),
                DB::raw('COUNT(*) as invoice_count'),
            ])
            ->groupBy('period')
            ->orderBy('period');

        $incomeData = $incomeQuery->get()->keyBy('period');

        // Egresos por período (compras de inventario - entradas)
        $expenseQuery = InventoryMovement::query()
            ->where('type', 'entry')
            ->whereBetween('created_at', [$filters['date_from'], $filters['date_to']])
            ->select([
                DB::raw("DATE_FORMAT(created_at, '{$dateFormat}') as period"),
                DB::raw('SUM(quantity * unit_price_usd) as total_expense'),
                DB::raw('COUNT(*) as movement_count'),
            ])
            ->groupBy('period')
            ->orderBy('period');

        $expenseData = $expenseQuery->get()->keyBy('period');

        // Combinar datos de ingresos y egresos
        $allPeriods = $incomeData->keys()->merge($expenseData->keys())->sort()->unique();
        
        $cashFlow = collect($allPeriods)->map(function ($period) use ($incomeData, $expenseData, $adminMoneyService, $currencySettings) {
            $income = $incomeData->get($period, (object)['total_income' => 0]);
            $expense = $expenseData->get($period, (object)['total_expense' => 0]);
            
            $totalIncome = (float) ($income->total_income ?? 0);
            $totalExpense = (float) ($expense->total_expense ?? 0);
            $netCashFlow = $totalIncome - $totalExpense;

            return [
                'period' => $period,
                'total_income' => $totalIncome,
                'total_expense' => $totalExpense,
                'net_cash_flow' => $netCashFlow,
                'invoice_count' => $income->invoice_count ?? 0,
                'movement_count' => $expense->movement_count ?? 0,
                'total_income_admin_totals' => $adminMoneyService->buildAdminTotals($totalIncome, $currencySettings)['totals'],
                'total_expense_admin_totals' => $adminMoneyService->buildAdminTotals($totalExpense, $currencySettings)['totals'],
                'net_cash_flow_admin_totals' => $adminMoneyService->buildAdminTotals($netCashFlow, $currencySettings)['totals'],
            ];
        })->values();

        // Totales globales
        $globalTotals = [
            'total_income' => $cashFlow->sum('total_income'),
            'total_expense' => $cashFlow->sum('total_expense'),
            'net_cash_flow' => $cashFlow->sum('net_cash_flow'),
        ];

        // Datos para el gráfico
        $chartData = [
            'labels' => $cashFlow->pluck('period')->toArray(),
            'income' => $cashFlow->pluck('total_income')->toArray(),
            'expense' => $cashFlow->pluck('total_expense')->toArray(),
            'net' => $cashFlow->pluck('net_cash_flow')->toArray(),
        ];

        return Inertia::render('Admin/Reports/CashFlow/Index', [
            'cashFlow' => $cashFlow,
            'filters' => $filters,
            'globalTotals' => $globalTotals,
            'chartData' => $chartData,
            'adminCurrencyContext' => $adminCurrencyContext,
        ]);
    }
}

<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\CreditAccount;
use App\Models\Customer;
use App\Services\AdminMoneyService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CreditReportController extends Controller
{
    public function index(Request $request, AdminMoneyService $adminMoneyService)
    {
        $filters = [
            'customer_id' => $request->input('customer_id'),
            'status' => $request->input('status'),
            'search' => $request->input('search'),
            'overdue_only' => $request->boolean('overdue_only'),
        ];

        $today = now()->toDateString();

        $query = CreditAccount::query()
            ->with(['customer:id,name,email'])
            ->withCount([
                'movements as overdue_charges_count' => function ($q) use ($today) {
                    $q->where('type', 'charge')
                        ->whereNotNull('due_date')
                        ->whereDate('due_date', '<', $today)
                        ->whereNull('paid_at');
                },
            ])
            ->when($filters['customer_id'], function ($q, $customerId) {
                $q->where('customer_id', $customerId);
            })
            ->when($filters['status'], function ($q, $status) {
                $q->where('status', $status);
            })
            ->when($filters['search'], function ($q, $search) {
                $q->whereHas('customer', function ($cq) use ($search) {
                    $cq->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($filters['overdue_only'], function ($q) use ($today) {
                $q->whereHas('movements', function ($mq) use ($today) {
                    $mq->where('type', 'charge')
                        ->whereNotNull('due_date')
                        ->whereDate('due_date', '<', $today)
                        ->whereNull('paid_at');
                });
            });

        $accounts = $query
            ->orderByDesc('balance_usd')
            ->paginate(50)
            ->withQueryString();

        $adminCurrencyContext = $adminMoneyService->getAdminCurrencyContext();
        $pageCollection = $accounts->getCollection();
        $totalBalanceUsd = (float) $pageCollection->sum('balance_usd');
        $averageBalanceUsd = (float) ($pageCollection->count() > 0 ? $pageCollection->avg('balance_usd') : 0);

        $metrics = [
            'total_accounts' => $accounts->total(),
            'page_accounts' => $pageCollection->count(),
            'total_balance_usd' => $totalBalanceUsd,
            'avg_balance_usd' => $averageBalanceUsd,
            'total_balance_admin_totals' => $adminMoneyService->buildAdminTotals($totalBalanceUsd)['totals'],
            'avg_balance_admin_totals' => $adminMoneyService->buildAdminTotals($averageBalanceUsd)['totals'],
            'overdue_accounts' => $pageCollection->filter(function ($account) {
                return ($account->overdue_charges_count ?? 0) > 0;
            })->count(),
        ];

        $accounts->setCollection(
            $pageCollection->map(function (CreditAccount $account) use ($adminMoneyService) {
                $creditLimit = (float) ($account->credit_limit_usd ?? 0);
                $balance = (float) ($account->balance_usd ?? 0);
                $available = max($creditLimit - $balance, 0);

                $account->credit_limit_admin_totals = $adminMoneyService->buildAdminTotals($creditLimit)['totals'];
                $account->balance_admin_totals = $adminMoneyService->buildAdminTotals($balance)['totals'];
                $account->available_admin_totals = $adminMoneyService->buildAdminTotals($available)['totals'];

                return $account;
            })
        );

        $customers = Customer::orderBy('name')->limit(200)->get(['id', 'name', 'email']);

        $statuses = [
            ['value' => 'active', 'label' => 'Activa'],
            ['value' => 'suspended', 'label' => 'Suspendida'],
            ['value' => 'closed', 'label' => 'Cerrada'],
        ];

        return Inertia::render('Admin/Reports/Credit/Index', [
            'accounts' => $accounts,
            'filters' => $filters,
            'metrics' => $metrics,
            'customers' => $customers,
            'statuses' => $statuses,
            'adminCurrencyContext' => $adminCurrencyContext,
        ]);
    }
}

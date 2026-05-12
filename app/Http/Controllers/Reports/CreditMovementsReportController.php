<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\CreditAccount;
use App\Models\CreditMovement;
use App\Models\Customer;
use App\Services\AdminMoneyService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CreditMovementsReportController extends Controller
{
    public function index(Request $request, AdminMoneyService $adminMoneyService)
    {
        $filters = [
            'customer_id' => $request->input('customer_id'),
            'account_id' => $request->input('account_id'),
            'type' => $request->input('type'),
            'status' => $request->input('status'),
            'date_from' => $request->input('date_from'),
            'date_to' => $request->input('date_to'),
        ];

        $query = CreditMovement::query()
            ->with(['account.customer:id,name,email', 'invoice:id,number,document_type'])
            ->when($filters['customer_id'], function ($q, $customerId) {
                $q->whereHas('account', function ($aq) use ($customerId) {
                    $aq->where('customer_id', $customerId);
                });
            })
            ->when($filters['account_id'], function ($q, $accountId) {
                $q->where('credit_account_id', $accountId);
            })
            ->when($filters['type'], function ($q, $type) {
                $q->where('type', $type);
            })
            ->when($filters['status'], function ($q, $status) {
                if ($status === 'pending') {
                    $q->whereNull('paid_at');
                } elseif ($status === 'paid') {
                    $q->whereNotNull('paid_at');
                }
            })
            ->when($filters['date_from'], function ($q, $from) {
                $q->whereDate('created_at', '>=', $from);
            })
            ->when($filters['date_to'], function ($q, $to) {
                $q->whereDate('created_at', '<=', $to);
            })
            ->orderByDesc('created_at')
            ->orderByDesc('id');

        $movements = $query->paginate(50)->withQueryString();

        $adminCurrencyContext = $adminMoneyService->getAdminCurrencyContext();

        $collection = $movements->getCollection()->map(function (CreditMovement $movement) use ($adminMoneyService) {
            $snapshot = is_array($movement->monetary_totals_json['rates'] ?? null)
                ? [
                    'base_currency' => (string) ($movement->base_currency_code ?: 'USD'),
                    'captured_at' => $movement->monetary_totals_json['captured_at'] ?? null,
                    'rates' => $movement->monetary_totals_json['rates'],
                ]
                : null;

            $movement->admin_totals = $adminMoneyService->buildAdminTotals((float) ($movement->amount_usd ?? 0), null, $snapshot)['totals'];
            $movement->display_currency_code = (string) ($movement->currency_code ?: ($movement->monetary_totals_json['currency_code'] ?? 'USD'));
            $movement->display_original_amount = (float) ($movement->amount_original ?? ($movement->monetary_totals_json['original_amount'] ?? ($movement->amount_usd ?? 0)));

            return $movement;
        });

        $movements->setCollection($collection);

        $zeroTotals = [];
        foreach ($adminCurrencyContext['codes'] as $code) {
            $zeroTotals[$code] = 0.0;
        }

        $chargeTotals = $zeroTotals;
        $paymentTotals = $zeroTotals;

        foreach ($collection as $movement) {
            foreach ($movement->admin_totals ?? [] as $code => $amount) {
                if (! array_key_exists($code, $zeroTotals)) {
                    continue;
                }

                if ($movement->type === 'charge') {
                    $chargeTotals[$code] += (float) $amount;
                } else {
                    $paymentTotals[$code] += (float) $amount;
                }
            }
        }

        $netTotals = [];
        foreach ($zeroTotals as $code => $amount) {
            $netTotals[$code] = round(($chargeTotals[$code] ?? 0) - ($paymentTotals[$code] ?? 0), 2);
            $chargeTotals[$code] = round((float) ($chargeTotals[$code] ?? 0), 2);
            $paymentTotals[$code] = round((float) ($paymentTotals[$code] ?? 0), 2);
        }

        $metrics = [
            'total_movements' => $movements->total(),
            'page_movements' => $collection->count(),
            'total_charges_usd' => (float) $collection->where('type', 'charge')->sum('amount_usd'),
            'total_payments_usd' => (float) $collection->where('type', 'payment')->sum('amount_usd'),
            'total_charges_admin_totals' => $chargeTotals,
            'total_payments_admin_totals' => $paymentTotals,
            'net_balance_admin_totals' => $netTotals,
            'net_balance_usd' => 0,
        ];
        $metrics['net_balance_usd'] = $metrics['total_charges_usd'] - $metrics['total_payments_usd'];

        $customers = Customer::orderBy('name')->limit(200)->get(['id', 'name', 'email']);
        $accounts = CreditAccount::with('customer:id,name')
            ->orderBy('id', 'desc')
            ->limit(200)
            ->get(['id', 'customer_id']);

        $types = [
            ['value' => 'charge', 'label' => 'Cargo'],
            ['value' => 'payment', 'label' => 'Pago'],
        ];

        $statuses = [
            ['value' => 'pending', 'label' => 'Pendiente'],
            ['value' => 'paid', 'label' => 'Pagado'],
        ];

        return Inertia::render('Admin/Reports/Credit/Movements', [
            'movements' => $movements,
            'filters' => $filters,
            'metrics' => $metrics,
            'customers' => $customers,
            'accounts' => $accounts,
            'types' => $types,
            'statuses' => $statuses,
            'adminCurrencyContext' => $adminCurrencyContext,
        ]);
    }
}

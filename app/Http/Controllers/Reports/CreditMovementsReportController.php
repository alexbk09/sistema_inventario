<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\CreditAccount;
use App\Models\CreditMovement;
use App\Models\Customer;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CreditMovementsReportController extends Controller
{
    public function index(Request $request)
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

        $collection = $movements->getCollection();

        $metrics = [
            'total_movements' => $movements->total(),
            'page_movements' => $collection->count(),
            'total_charges_usd' => (float) $collection->where('type', 'charge')->sum('amount_usd'),
            'total_payments_usd' => (float) $collection->where('type', 'payment')->sum('amount_usd'),
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
        ]);
    }
}

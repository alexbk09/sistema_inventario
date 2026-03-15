<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Layaway;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LayawayReportController extends Controller
{
    public function index(Request $request)
    {
        $filters = [
            'customer_id' => $request->input('customer_id'),
            'status' => $request->input('status'),
            'date_from' => $request->input('date_from'),
            'date_to' => $request->input('date_to'),
            'only_expired' => $request->boolean('only_expired'),
        ];

        $query = Layaway::query()
            ->with('customer:id,name,email')
            ->when($filters['customer_id'], function ($q, $customerId) {
                $q->where('customer_id', $customerId);
            })
            ->when($filters['status'], function ($q, $status) {
                $q->where('status', $status);
            })
            ->when($filters['date_from'], function ($q, $from) {
                $q->whereDate('created_at', '>=', $from);
            })
            ->when($filters['date_to'], function ($q, $to) {
                $q->whereDate('created_at', '<=', $to);
            })
            ->when($filters['only_expired'], function ($q) {
                $q->whereIn('status', ['active', 'pending'])
                    ->whereNotNull('expires_at')
                    ->where('expires_at', '<', now());
            })
            ->orderByDesc('created_at')
            ->orderByDesc('id');

        $layaways = $query->paginate(50)->withQueryString();

        $collection = $layaways->getCollection();

        $metrics = [
            'total_layaways' => $layaways->total(),
            'page_layaways' => $collection->count(),
            'active' => $collection->where('status', 'active')->count(),
            'pending' => $collection->where('status', 'pending')->count(),
            'completed' => $collection->where('status', 'completed')->count(),
            'cancelled' => $collection->where('status', 'cancelled')->count(),
            'expired' => $collection->filter(function ($l) {
                return in_array($l->status, ['active', 'pending'], true)
                    && $l->expires_at
                    && $l->expires_at->isPast();
            })->count(),
            'total_usd' => (float) $collection->sum('total_usd'),
            'pending_usd' => (float) $collection->sum(function ($l) {
                $total = (float) ($l->total_usd ?? 0);
                $paid = (float) ($l->paid_usd ?? 0);
                return max($total - $paid, 0);
            }),
        ];

        $customers = Customer::orderBy('name')->limit(200)->get(['id', 'name', 'email']);

        $statuses = [
            ['value' => 'active', 'label' => 'Activo'],
            ['value' => 'pending', 'label' => 'Pendiente'],
            ['value' => 'completed', 'label' => 'Completado'],
            ['value' => 'cancelled', 'label' => 'Cancelado'],
            ['value' => 'expired', 'label' => 'Vencido'],
        ];

        return Inertia::render('Admin/Reports/Layaway/Index', [
            'layaways' => $layaways,
            'filters' => $filters,
            'metrics' => $metrics,
            'customers' => $customers,
            'statuses' => $statuses,
        ]);
    }
}

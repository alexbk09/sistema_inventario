<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Layaway;
use App\Services\AdminMoneyService;
use App\Support\Settings;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LayawayReportController extends Controller
{
    public function index(Request $request, AdminMoneyService $adminMoneyService)
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
        $currencySettings = Settings::get('currency', []);
        $adminCurrencyContext = $adminMoneyService->getAdminCurrencyContext($currencySettings);
        $currencyCodes = $adminCurrencyContext['codes'] ?? [];

        $zeroTotals = [];
        foreach ($currencyCodes as $code) {
            $zeroTotals[$code] = 0.0;
        }

        $statusCounts = [
            'active' => $collection->where('status', 'active')->count(),
            'pending' => $collection->where('status', 'pending')->count(),
            'completed' => $collection->where('status', 'completed')->count(),
            'cancelled' => $collection->where('status', 'cancelled')->count(),
            'expired' => $collection->filter(function ($l) {
                return in_array($l->status, ['active', 'pending'], true)
                    && $l->expires_at
                    && $l->expires_at->isPast();
            })->count(),
        ];

        $totalDocumentTotals = $zeroTotals;
        $pendingAdminTotals = $zeroTotals;

        $collection = $collection->map(function (Layaway $layaway) use ($adminMoneyService, $currencySettings, &$totalDocumentTotals, &$pendingAdminTotals) {
            $documentTotals = $this->resolveLayawayDocumentTotals($layaway, $adminMoneyService, $currencySettings);
            $paidAdminTotals = $adminMoneyService->buildAdminTotals((float) ($layaway->paid_usd ?? 0), $currencySettings)['totals'];
            $pendingUsd = max((float) ($layaway->total_usd ?? 0) - (float) ($layaway->paid_usd ?? 0), 0);
            $pendingTotals = $adminMoneyService->buildAdminTotals($pendingUsd, $currencySettings)['totals'];

            foreach (array_keys($documentTotals) as $code) {
                $totalDocumentTotals[$code] = round(($totalDocumentTotals[$code] ?? 0) + (float) ($documentTotals[$code] ?? 0), 2);
            }

            foreach (array_keys($pendingTotals) as $code) {
                $pendingAdminTotals[$code] = round(($pendingAdminTotals[$code] ?? 0) + (float) ($pendingTotals[$code] ?? 0), 2);
            }

            $layaway->document_totals = $documentTotals;
            $layaway->paid_admin_totals = $paidAdminTotals;
            $layaway->pending_admin_totals = $pendingTotals;
            $layaway->pending_usd = $pendingUsd;

            return $layaway;
        });

        $layaways->setCollection($collection);

        $metrics = [
            'total_layaways' => $layaways->total(),
            'page_layaways' => $collection->count(),
            'active' => $statusCounts['active'],
            'pending' => $statusCounts['pending'],
            'completed' => $statusCounts['completed'],
            'cancelled' => $statusCounts['cancelled'],
            'expired' => $statusCounts['expired'],
            'status_counts' => $statusCounts,
            'total_usd' => (float) $collection->sum('total_usd'),
            'total_document_totals' => $totalDocumentTotals,
            'pending_usd' => (float) $collection->sum(function ($l) {
                $total = (float) ($l->total_usd ?? 0);
                $paid = (float) ($l->paid_usd ?? 0);
                return max($total - $paid, 0);
            }),
            'pending_admin_totals' => $pendingAdminTotals,
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
            'adminCurrencyContext' => $adminCurrencyContext,
            'customers' => $customers,
            'statuses' => $statuses,
        ]);
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

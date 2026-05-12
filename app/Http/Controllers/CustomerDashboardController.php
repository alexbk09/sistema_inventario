<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Services\AdminMoneyService;
use App\Support\Settings;

class CustomerDashboardController extends Controller
{
    public function index(Request $request, AdminMoneyService $adminMoneyService)
    {
        $user = Auth::user();
        $customer = Customer::firstOrCreate(
            ['user_id' => $user->id],
            [
                'name' => $user->name,
                'email' => $user->email,
                'phone' => '',
                'address' => '',
            ]
        );

        $currencySettings = Settings::get('currency', []);
        $enabledCurrencyContext = $adminMoneyService->getEnabledCurrencyContext($currencySettings);

        $allInvoices = Invoice::where('customer_id', $customer->id)
            ->orderByDesc('created_at')
            ->get(['id', 'number', 'total_usd', 'currency_code', 'base_currency_code', 'monetary_totals_json', 'created_at', 'status']);

        $zeroTotals = [];
        foreach (($enabledCurrencyContext['codes'] ?? []) as $code) {
            $zeroTotals[$code] = 0.0;
        }

        $totalSpent = (float) $allInvoices->sum('total_usd');
        $summaryTotals = $zeroTotals;

        foreach ($allInvoices as $invoice) {
            $invoiceTotals = $this->resolveInvoiceDocumentTotals($invoice, $adminMoneyService, $currencySettings);

            foreach ($summaryTotals as $code => $amount) {
                $summaryTotals[$code] = round($amount + (float) ($invoiceTotals[$code] ?? 0), 2);
            }
        }

        $totalPurchases = $allInvoices->count();
        $lastPurchase = $allInvoices->first();

        // Historial de compras
        $invoices = $allInvoices
            ->take(10)
            ->values()
            ->map(function (Invoice $invoice) use ($adminMoneyService, $currencySettings) {
                $invoice->document_totals = $this->resolveInvoiceDocumentTotals($invoice, $adminMoneyService, $currencySettings);

                return $invoice;
            });

        // Top productos
        $topProducts = InvoiceItem::query()
            ->selectRaw('product_id, SUM(quantity) as total_quantity')
            ->whereHas('invoice', function($q) use ($customer) {
                $q->where('customer_id', $customer->id);
            })
            ->groupBy('product_id')
            ->orderByDesc('total_quantity')
            ->with('product:id,name')
            ->take(5)
            ->get()
            ->map(function($row) {
                return [
                    'name' => optional($row->product)->name,
                    'quantity' => (float) $row->total_quantity,
                ];
            });

        return inertia('Customer/Dashboard', [
            'summary' => [
                'totalSpent' => $totalSpent,
                'documentTotals' => $summaryTotals,
                'totalPurchases' => $totalPurchases,
                'lastPurchase' => $lastPurchase?->created_at?->toIso8601String(),
            ],
            'invoices' => $invoices,
            'topProducts' => $topProducts,
            'currencyContext' => $enabledCurrencyContext,
            'profile' => [
                'name' => $customer->name,
                'email' => $customer->email,
                'phone' => $customer->phone,
                'address' => $customer->address,
                'city' => $customer->city,
                'postal_code' => $customer->postal_code,
                'identification' => $customer->identification,
                'identification_type_id' => $customer->identification_type_id,
            ],
        ]);
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
}

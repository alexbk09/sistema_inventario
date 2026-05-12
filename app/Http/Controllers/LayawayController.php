<?php

namespace App\Http\Controllers;

use App\Models\{Layaway, LayawayItem, Customer, Product};
use App\Services\AdminMoneyService;
use App\Services\AdminNotificationService;
use App\Services\CurrencyService;
use App\Support\Settings;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class LayawayController extends Controller
{
    public function index(Request $request, AdminMoneyService $adminMoneyService)
    {
        if (!$request->user() || !$request->user()->can('view credits')) {
            return redirect()->route('dashboard')->with('error', __('app.admin.layaways.permissions.view_denied'));
        }

        $status = (string) $request->input('status', '');
        $currencySettings = Settings::get('currency', []);

        $layaways = Layaway::with('customer')
            ->when($status !== '', function ($q) use ($status) {
                $q->where('status', $status);
            })
            ->latest()
            ->paginate(20)
            ->withQueryString();

        $adminCurrencyContext = $adminMoneyService->getAdminCurrencyContext($currencySettings);

        $layaways->setCollection(
            $layaways->getCollection()->map(function (Layaway $layaway) use ($adminMoneyService, $currencySettings) {
                $layaway->document_totals = $this->resolveLayawayDocumentTotals($layaway, $adminMoneyService, $currencySettings);
                $layaway->paid_admin_totals = $adminMoneyService->buildAdminTotals((float) ($layaway->paid_usd ?? 0), $currencySettings)['totals'];

                return $layaway;
            })
        );

        return Inertia::render('Admin/Layaway/Index', [
            'layaways' => $layaways,
            'filters' => [
                'status' => $status,
            ],
            'adminCurrencyContext' => $adminCurrencyContext,
        ]);
    }

    public function create(Request $request, AdminMoneyService $adminMoneyService)
    {
        if (!$request->user() || !$request->user()->can('manage credits')) {
            return redirect()->route('dashboard')->with('error', __('app.admin.layaways.permissions.create_denied'));
        }

        $currencySettings = Settings::get('currency', []);
        $adminCurrencyContext = $adminMoneyService->getAdminCurrencyContext($currencySettings);
        $customers = Customer::orderBy('name')->get(['id','name']);
        $products = Product::orderBy('name')->get(['id','name','price_usd','stock'])
            ->map(function (Product $product) use ($adminMoneyService, $currencySettings) {
                $product->price_admin_totals = $adminMoneyService->buildAdminTotals((float) ($product->price_usd ?? 0), $currencySettings)['totals'];

                return $product;
            });

        return Inertia::render('Admin/Layaway/Create', [
            'customers' => $customers,
            'products' => $products,
            'adminCurrencyContext' => $adminCurrencyContext,
        ]);
    }

    public function store(Request $request, CurrencyService $currency, AdminNotificationService $notificationService, AdminMoneyService $adminMoneyService)
    {
        if (!$request->user() || !$request->user()->can('manage credits')) {
            return redirect()->route('dashboard')->with('error', __('app.admin.layaways.permissions.create_denied'));
        }

        $data = $request->validate([
            'customer_id' => ['nullable','exists:customers,id'],
            'expires_at' => ['nullable','date'],
            'notes' => ['nullable','string'],
            'items' => ['required','array','min:1'],
            'items.*.product_id' => ['required','exists:products,id'],
            'items.*.quantity' => ['required','integer','min:1'],
        ]);

        return DB::transaction(function () use ($data, $currency, $notificationService, $adminMoneyService) {
            $currencySettings = \App\Support\Settings::get('currency', []);
            $enabledCurrencyContext = $adminMoneyService->getEnabledCurrencyContext($currencySettings);
            $documentSnapshot = $adminMoneyService->buildSnapshot(
                $enabledCurrencyContext['rates'] ?? [],
                $enabledCurrencyContext['base_currency'] ?? 'USD',
                now()->toIso8601String(),
            );

            $layaway = new Layaway();
            $layaway->number = 'LAY-'.Str::upper(Str::random(8));
            $layaway->customer_id = $data['customer_id'] ?? null;
            $layaway->status = 'active';
            $layaway->expires_at = $data['expires_at'] ?? null;
            $layaway->notes = $data['notes'] ?? null;
            $layaway->total_usd = 0;
            $layaway->total_bs = 0;
            $layaway->paid_usd = 0;
            $layaway->currency_code = 'USD';
            $layaway->base_currency_code = $documentSnapshot['base_currency'] ?? 'USD';
            $layaway->exchange_rate_snapshot = 1;
            $layaway->exchange_rate_source = 'manual';
            $layaway->save();

            $totalUsd = 0.0;

            foreach ($data['items'] as $item) {
                $product = Product::findOrFail($item['product_id']);
                $qty = (int) $item['quantity'];
                $unitPrice = (float) ($product->price_usd ?? 0);
                $subtotalUsd = $unitPrice * $qty;
                $subtotalBs = $currency->usdToBs($subtotalUsd);

                LayawayItem::create([
                    'layaway_id' => $layaway->id,
                    'product_id' => $product->id,
                    'quantity' => $qty,
                    'unit_price_usd' => $unitPrice,
                    'subtotal_usd' => $subtotalUsd,
                    'subtotal_bs' => $subtotalBs,
                    'unit_currency_code' => 'USD',
                    'unit_price_original' => $unitPrice,
                    'subtotal_original' => $subtotalUsd,
                    'exchange_rate_snapshot' => 1,
                    'monetary_breakdown_json' => $adminMoneyService->buildDocumentTotals($subtotalUsd, $currencySettings, $documentSnapshot),
                ]);

                $totalUsd += $subtotalUsd;
            }

            $layaway->update([
                'total_usd' => $totalUsd,
                'total_bs' => $currency->usdToBs($totalUsd),
                'currency_code' => 'USD',
                'base_currency_code' => $documentSnapshot['base_currency'] ?? 'USD',
                'exchange_rate_snapshot' => 1,
                'exchange_rate_source' => 'manual',
                'monetary_totals_json' => [
                    'original_currency' => 'USD',
                    'original_amount' => round($totalUsd, 2),
                    ...$adminMoneyService->buildDocumentTotals($totalUsd, $currencySettings, $documentSnapshot),
                ],
            ]);

            $notificationMessage = $notificationService->formatDocumentAmount(
                'Total',
                $layaway->currency_code,
                $layaway->total_usd,
                is_array($layaway->monetary_totals_json) ? $layaway->monetary_totals_json : null,
            );
            if ($layaway->expires_at) {
                $notificationMessage .= ' / Vence: '.$layaway->expires_at->format('d/m/Y H:i');
            }

            $notificationService->notifyStaff(
                'layaway_created',
                'Nuevo apartado '.$layaway->number,
                $notificationMessage,
                [
                    'severity' => 'info',
                    'action_url' => route('admin.layaways.show', $layaway->id),
                    'action_label' => 'Ver apartado',
                    'dedupe_key' => 'layaway_created:'.$layaway->id,
                    'data' => [
                        'layaway_id' => $layaway->id,
                        'status' => $layaway->status,
                    ],
                ]
            );

            return redirect()->route('admin.layaways.index')->with('success', __('app.admin.layaways.notifications.created'));
        });
    }

    public function show(Request $request, Layaway $layaway, AdminMoneyService $adminMoneyService)
    {
        if (!$request->user() || !$request->user()->can('view credits')) {
            return redirect()->route('dashboard')->with('error', __('app.admin.layaways.permissions.view_denied'));
        }

        $layaway->load(['customer','items.product']);
        $currencySettings = Settings::get('currency', []);
        $adminCurrencyContext = $adminMoneyService->getAdminCurrencyContext($currencySettings);

        $layaway->document_totals = $this->resolveLayawayDocumentTotals($layaway, $adminMoneyService, $currencySettings);
        $layaway->paid_admin_totals = $adminMoneyService->buildAdminTotals((float) ($layaway->paid_usd ?? 0), $currencySettings)['totals'];
        $layaway->items->transform(function (LayawayItem $item) use ($adminMoneyService, $currencySettings, $layaway) {
            $item->unit_price_admin_totals = $adminMoneyService->buildAdminTotals((float) ($item->unit_price_usd ?? 0), $currencySettings)['totals'];

            if (is_array($item->monetary_breakdown_json['totals'] ?? null)) {
                $item->document_totals = $item->monetary_breakdown_json['totals'];

                return $item;
            }

            $snapshot = is_array($layaway->monetary_totals_json['rates'] ?? null)
                ? [
                    'base_currency' => (string) ($layaway->base_currency_code ?: 'USD'),
                    'captured_at' => $layaway->monetary_totals_json['captured_at'] ?? null,
                    'rates' => $layaway->monetary_totals_json['rates'],
                ]
                : null;

            $item->document_totals = $adminMoneyService->buildDocumentTotals((float) ($item->subtotal_usd ?? 0), $currencySettings, $snapshot)['totals'];

            return $item;
        });

        return Inertia::render('Admin/Layaway/Show', [
            'layaway' => $layaway,
            'adminCurrencyContext' => $adminCurrencyContext,
        ]);
    }

    public function update(Request $request, Layaway $layaway, AdminNotificationService $notificationService)
    {
        if (!$request->user() || !$request->user()->can('manage credits')) {
            return redirect()->route('dashboard')->with('error', __('app.admin.layaways.permissions.update_denied'));
        }

        $data = $request->validate([
            'status' => ['required','in:active,completed,cancelled,expired'],
        ]);

        $oldStatus = $layaway->status;
        $layaway->status = $data['status'];
        $layaway->save();

        if ($oldStatus !== $layaway->status) {
            $notificationService->notifyStaff(
                'layaway_status_changed',
                'Apartado '.$layaway->number.' actualizado',
                'Estado: '.$oldStatus.' -> '.$layaway->status,
                [
                    'severity' => $layaway->status === 'completed' ? 'success' : 'warning',
                    'action_url' => route('admin.layaways.show', $layaway->id),
                    'action_label' => 'Ver apartado',
                    'dedupe_key' => 'layaway_status_changed:'.$layaway->id.':'.$layaway->status,
                    'data' => [
                        'layaway_id' => $layaway->id,
                        'old_status' => $oldStatus,
                        'new_status' => $layaway->status,
                    ],
                ]
            );
        }

        return redirect()->route('admin.layaways.show', $layaway->id)->with('success', __('app.admin.layaways.notifications.updated'));
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

<?php

namespace App\Http\Controllers;

use App\Models\{CreditAccount, CreditMovement, Customer};
use App\Services\AdminMoneyService;
use App\Services\AdminNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CreditAccountController extends Controller
{
    public function index(Request $request, AdminMoneyService $adminMoneyService)
    {
        if (!$request->user() || !$request->user()->can('view credits')) {
            return redirect()->route('dashboard')->with('error', __('app.admin.credits.permissions.view_denied'));
        }

        $accounts = CreditAccount::with('customer')
            ->orderByDesc('balance_usd')
            ->paginate(20)
            ->withQueryString();

        $adminCurrencyContext = $adminMoneyService->getAdminCurrencyContext();

        $accounts->setCollection(
            $accounts->getCollection()->map(function (CreditAccount $account) use ($adminMoneyService) {
                $creditLimit = (float) ($account->credit_limit_usd ?? 0);
                $balance = (float) ($account->balance_usd ?? 0);
                $available = max($creditLimit - $balance, 0);

                $account->credit_limit_admin_totals = $adminMoneyService->buildAdminTotals($creditLimit)['totals'];
                $account->balance_admin_totals = $adminMoneyService->buildAdminTotals($balance)['totals'];
                $account->available_admin_totals = $adminMoneyService->buildAdminTotals($available)['totals'];

                return $account;
            })
        );

        return Inertia::render('Admin/Credit/Index', [
            'accounts' => $accounts,
            'customers' => Customer::orderBy('name')->get(['id','name','email']),
            'adminCurrencyContext' => $adminCurrencyContext,
        ]);
    }

    public function store(Request $request, AdminNotificationService $notificationService, AdminMoneyService $adminMoneyService)
    {
        if (!$request->user() || !$request->user()->can('manage credits')) {
            return redirect()->route('dashboard')->with('error', __('app.admin.credits.permissions.manage_account_denied'));
        }

        $data = $request->validate([
            'customer_id' => ['required','exists:customers,id'],
            'credit_limit_usd' => ['nullable','numeric','min:0'],
            'currency_code' => ['nullable','string','max:10'],
            'status' => ['nullable','in:active,suspended,closed'],
        ]);

        $creditLimitUsd = null;
        if ($data['credit_limit_usd'] !== null && $data['credit_limit_usd'] !== '') {
            $currencyCode = strtoupper((string) ($data['currency_code'] ?? 'USD'));
            $creditLimitUsd = $adminMoneyService->convertToBase((float) $data['credit_limit_usd'], $currencyCode);
        }

        $account = CreditAccount::firstOrCreate(
            ['customer_id' => $data['customer_id']],
            [
                'balance_usd' => 0,
                'credit_limit_usd' => $creditLimitUsd,
                'status' => $data['status'] ?? 'active',
            ]
        );

        // Si ya existía, actualizamos límite y estado opcionalmente
        if (!$account->wasRecentlyCreated) {
            $account->credit_limit_usd = $creditLimitUsd ?? $account->credit_limit_usd;
            if (!empty($data['status'])) {
                $account->status = $data['status'];
            }
            $account->save();
        } else {
            $notificationService->notifyStaff(
                'credit_account_created',
                'Nueva cuenta de credito #'.$account->id,
                'Estado: '.$account->status,
                [
                    'severity' => 'info',
                    'action_url' => route('admin.credits.show', $account->id),
                    'action_label' => 'Ver cuenta',
                    'dedupe_key' => 'credit_account_created:'.$account->id,
                    'data' => [
                        'credit_account_id' => $account->id,
                    ],
                ]
            );
        }

        return redirect()->route('admin.credits.show', $account->id)->with('success', __('app.admin.credits.notifications.account_saved'));
    }

    public function show(Request $request, CreditAccount $account, AdminMoneyService $adminMoneyService)
    {
        if (!$request->user() || !$request->user()->can('view credits')) {
            return redirect()->route('dashboard')->with('error', __('app.admin.credits.permissions.view_denied'));
        }

        $account->load(['customer','movements' => function ($q) {
            $q->latest();
        }]);

        $adminCurrencyContext = $adminMoneyService->getAdminCurrencyContext();
        $creditLimit = (float) ($account->credit_limit_usd ?? 0);
        $balance = (float) ($account->balance_usd ?? 0);
        $available = max($creditLimit - $balance, 0);

        $account->credit_limit_admin_totals = $adminMoneyService->buildAdminTotals($creditLimit)['totals'];
        $account->balance_admin_totals = $adminMoneyService->buildAdminTotals($balance)['totals'];
        $account->available_admin_totals = $adminMoneyService->buildAdminTotals($available)['totals'];

        $account->setRelation('movements', $account->movements->map(function (CreditMovement $movement) use ($adminMoneyService) {
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
        }));

        return Inertia::render('Admin/Credit/Show', [
            'account' => $account,
            'adminCurrencyContext' => $adminCurrencyContext,
        ]);
    }

    public function storeMovement(Request $request, CreditAccount $account, AdminNotificationService $notificationService, AdminMoneyService $adminMoneyService)
    {
        if (!$request->user() || !$request->user()->can('manage credits')) {
            return redirect()->route('dashboard')->with('error', __('app.admin.credits.permissions.manage_movement_denied'));
        }

        $data = $request->validate([
            'type' => ['required','in:charge,payment'],
            'amount_usd' => ['required','numeric','min:0.01'],
            'currency_code' => ['required','string','max:10'],
            'description' => ['nullable','string','max:255'],
            'due_date' => ['nullable','date'],
        ]);

        $currencyContext = $adminMoneyService->getEnabledCurrencyContext();
        $currencyCode = strtoupper((string) $data['currency_code']);

        if (! in_array($currencyCode, $currencyContext['codes'] ?? [], true)) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'currency_code' => __('app.validation.invalid'),
            ]);
        }

        $snapshot = $adminMoneyService->buildSnapshot(
            $currencyContext['rates'] ?? [],
            $currencyContext['base_currency'] ?? 'USD',
            now()->toIso8601String(),
        );

        $originalAmount = (float) $data['amount_usd'];
        $baseAmount = $adminMoneyService->convertToBase($originalAmount, $currencyCode, null, $snapshot);
        $exchangeRateSnapshot = $currencyCode === ($snapshot['base_currency'] ?? 'USD')
            ? 1.0
            : (float) ($snapshot['rates'][$currencyCode] ?? 0);
        $exchangeRateSource = $adminMoneyService->resolveCurrencyRateSource($currencyCode);

        return DB::transaction(function () use ($data, $account, $notificationService, $currencyCode, $originalAmount, $baseAmount, $snapshot, $exchangeRateSnapshot, $exchangeRateSource, $adminMoneyService) {
            $movement = new CreditMovement();
            $movement->credit_account_id = $account->id;
            $movement->type = $data['type'];
            $movement->amount_usd = $baseAmount;
            $movement->amount_original = $originalAmount;
            $movement->currency_code = $currencyCode;
            $movement->base_currency_code = $snapshot['base_currency'] ?? 'USD';
            $movement->exchange_rate_snapshot = $exchangeRateSnapshot;
            $movement->exchange_rate_source = $exchangeRateSource;
            $movement->monetary_totals_json = [
                'currency_code' => $currencyCode,
                'original_amount' => round($originalAmount, 2),
                ...$adminMoneyService->buildDocumentTotals($baseAmount, null, $snapshot),
            ];
            $movement->description = $data['description'] ?? null;
            $movement->due_date = $data['due_date'] ?? null;
            if ($data['type'] === 'payment') {
                $movement->paid_at = now();
            }
            $movement->save();

            if ($data['type'] === 'charge') {
                $account->balance_usd = (float) $account->balance_usd + $baseAmount;
            } else {
                $account->balance_usd = (float) $account->balance_usd - $baseAmount;
            }
            $account->save();

            $notificationService->notifyStaff(
                'credit_movement_created',
                'Movimiento de credito registrado',
                ucfirst($movement->type).' por '.$movement->currency_code.' '.number_format((float) ($movement->amount_original ?? 0), 2),
                [
                    'severity' => $movement->type === 'payment' ? 'success' : 'warning',
                    'action_url' => route('admin.credits.show', $account->id),
                    'action_label' => 'Ver credito',
                    'dedupe_key' => 'credit_movement_created:'.$movement->id,
                    'data' => [
                        'credit_account_id' => $account->id,
                        'movement_id' => $movement->id,
                        'type' => $movement->type,
                    ],
                ]
            );

            return redirect()->route('admin.credits.show', $account->id)->with('success', __('app.admin.credits.notifications.movement_created'));
        });
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\{CreditAccount, CreditMovement, Customer};
use App\Services\AdminNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CreditAccountController extends Controller
{
    public function index(Request $request)
    {
        if (!$request->user() || !$request->user()->can('view credits')) {
            return redirect()->route('dashboard')->with('error', __('app.admin.credits.permissions.view_denied'));
        }

        $accounts = CreditAccount::with('customer')
            ->orderByDesc('balance_usd')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/Credit/Index', [
            'accounts' => $accounts,
            'customers' => Customer::orderBy('name')->get(['id','name','email']),
        ]);
    }

    public function store(Request $request, AdminNotificationService $notificationService)
    {
        if (!$request->user() || !$request->user()->can('manage credits')) {
            return redirect()->route('dashboard')->with('error', __('app.admin.credits.permissions.manage_account_denied'));
        }

        $data = $request->validate([
            'customer_id' => ['required','exists:customers,id'],
            'credit_limit_usd' => ['nullable','numeric','min:0'],
            'status' => ['nullable','in:active,suspended,closed'],
        ]);

        $account = CreditAccount::firstOrCreate(
            ['customer_id' => $data['customer_id']],
            [
                'balance_usd' => 0,
                'credit_limit_usd' => $data['credit_limit_usd'] ?? null,
                'status' => $data['status'] ?? 'active',
            ]
        );

        // Si ya existía, actualizamos límite y estado opcionalmente
        if (!$account->wasRecentlyCreated) {
            $account->credit_limit_usd = $data['credit_limit_usd'] ?? $account->credit_limit_usd;
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

    public function show(Request $request, CreditAccount $account)
    {
        if (!$request->user() || !$request->user()->can('view credits')) {
            return redirect()->route('dashboard')->with('error', __('app.admin.credits.permissions.view_denied'));
        }

        $account->load(['customer','movements' => function ($q) {
            $q->latest();
        }]);

        return Inertia::render('Admin/Credit/Show', [
            'account' => $account,
        ]);
    }

    public function storeMovement(Request $request, CreditAccount $account, AdminNotificationService $notificationService)
    {
        if (!$request->user() || !$request->user()->can('manage credits')) {
            return redirect()->route('dashboard')->with('error', __('app.admin.credits.permissions.manage_movement_denied'));
        }

        $data = $request->validate([
            'type' => ['required','in:charge,payment'],
            'amount_usd' => ['required','numeric','min:0.01'],
            'description' => ['nullable','string','max:255'],
            'due_date' => ['nullable','date'],
        ]);

        return DB::transaction(function () use ($data, $account, $notificationService) {
            $movement = new CreditMovement();
            $movement->credit_account_id = $account->id;
            $movement->type = $data['type'];
            $movement->amount_usd = $data['amount_usd'];
            $movement->description = $data['description'] ?? null;
            $movement->due_date = $data['due_date'] ?? null;
            if ($data['type'] === 'payment') {
                $movement->paid_at = now();
            }
            $movement->save();

            if ($data['type'] === 'charge') {
                $account->balance_usd = (float) $account->balance_usd + (float) $data['amount_usd'];
            } else {
                $account->balance_usd = (float) $account->balance_usd - (float) $data['amount_usd'];
            }
            $account->save();

            $notificationService->notifyStaff(
                'credit_movement_created',
                'Movimiento de credito registrado',
                ucfirst($movement->type).' por $'.number_format((float) $movement->amount_usd, 2),
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

<?php

namespace App\Http\Controllers;

use App\Models\{CreditAccount, CreditMovement, Customer};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CreditAccountController extends Controller
{
    public function index(Request $request)
    {
        if (!$request->user() || !$request->user()->can('view credits')) {
            return redirect()->route('dashboard')->with('error', 'No tienes permiso para ver créditos.');
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

    public function store(Request $request)
    {
        if (!$request->user() || !$request->user()->can('manage credits')) {
            return redirect()->route('dashboard')->with('error', 'No tienes permiso para crear cuentas de crédito.');
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
        }

        return redirect()->route('admin.credits.show', $account->id)->with('success', 'Cuenta de crédito creada/actualizada.');
    }

    public function show(Request $request, CreditAccount $account)
    {
        if (!$request->user() || !$request->user()->can('view credits')) {
            return redirect()->route('dashboard')->with('error', 'No tienes permiso para ver créditos.');
        }

        $account->load(['customer','movements' => function ($q) {
            $q->latest();
        }]);

        return Inertia::render('Admin/Credit/Show', [
            'account' => $account,
        ]);
    }

    public function storeMovement(Request $request, CreditAccount $account)
    {
        if (!$request->user() || !$request->user()->can('manage credits')) {
            return redirect()->route('dashboard')->with('error', 'No tienes permiso para registrar movimientos de crédito.');
        }

        $data = $request->validate([
            'type' => ['required','in:charge,payment'],
            'amount_usd' => ['required','numeric','min:0.01'],
            'description' => ['nullable','string','max:255'],
            'due_date' => ['nullable','date'],
        ]);

        return DB::transaction(function () use ($data, $account) {
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

            return redirect()->route('admin.credits.show', $account->id)->with('success', 'Movimiento registrado.');
        });
    }
}

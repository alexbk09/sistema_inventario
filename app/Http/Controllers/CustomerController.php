<?php

namespace App\Http\Controllers;

use App\Models\{Customer, IdentificationType};
use Illuminate\Http\Request;
use Inertia\Inertia;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        if (!$request->user() || !$request->user()->can('view customers')) {
            return redirect()->route('dashboard')->with('error', 'No tienes permiso para acceder al módulo de clientes.');
        }

        $search = trim((string) $request->input('search', ''));

        $customers = Customer::query()
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($qq) use ($search) {
                    $qq->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('address', 'like', "%{$search}%");
                });
            })
            ->withCount('invoices')
            ->withSum('invoices as invoices_total_usd', 'total_usd')
            ->orderBy('name')
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('Admin/Customer/Index', [
            'customers' => $customers,
            'filters' => [
                'search' => $search,
            ],
            'identificationTypes' => IdentificationType::orderBy('code')->get(['id','code','name']),
        ]);
    }

    public function store(Request $request)
    {
        if (!$request->user() || !$request->user()->can('manage customers')) {
            return redirect()->route('dashboard')->with('error', 'No tienes permiso para crear clientes.');
        }

        $data = $request->validate([
            'identification_type_id' => ['required','exists:identification_types,id'],
            'identification' => ['required','string','max:50'],
            'name' => ['required','string','max:255'],
            'email' => ['nullable','email','max:255','unique:customers,email'],
            'phone' => ['nullable','string','max:50'],
            'address' => ['nullable','string','max:500'],
        ]);

        Customer::create($data);

        return redirect()->route('admin.customers.index')->with('success', 'Cliente creado correctamente.');
    }

    public function show(Request $request, Customer $customer)
    {
        if (!$request->user() || !$request->user()->can('view customers')) {
            return redirect()->route('dashboard')->with('error', 'No tienes permiso para acceder al módulo de clientes.');
        }

        $customer->load(['invoices' => function ($q) {
            $q->latest()->with('invoiceStatus');
        }]);

        $invoices = $customer->invoices->map(function ($inv) {
            return [
                'id' => $inv->id,
                'number' => $inv->number,
                'status' => $inv->status,
                'status_name' => optional($inv->invoiceStatus)->name,
                'total_usd' => (float) $inv->total_usd,
                'total_bs' => (float) $inv->total_bs,
                'created_at' => $inv->created_at,
                'points_earned' => (int) floor((float) $inv->total_usd),
            ];
        });

        return Inertia::render('Admin/Customer/Show', [
            'customer' => [
                'id' => $customer->id,
                'name' => $customer->name,
                'email' => $customer->email,
                'phone' => $customer->phone,
                'address' => $customer->address,
                'loyalty_points' => (int) ($customer->loyalty_points ?? 0),
                'lifetime_spent_usd' => (float) ($customer->lifetime_spent_usd ?? 0),
                'last_purchase_at' => $customer->last_purchase_at,
                'invoices_count' => $customer->invoices_count ?? $customer->invoices()->count(),
            ],
            'invoices' => $invoices,
        ]);
    }
}

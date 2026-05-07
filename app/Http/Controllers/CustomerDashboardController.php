<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\InvoiceItem;

class CustomerDashboardController extends Controller
{
    public function index(Request $request)
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

        // Resumen
        $totalSpent = (float) Invoice::where('customer_id', $customer->id)->sum('total_usd');
        $totalPurchases = Invoice::where('customer_id', $customer->id)->count();
        $lastPurchase = Invoice::where('customer_id', $customer->id)->orderByDesc('created_at')->first();

        // Historial de compras
        $invoices = Invoice::where('customer_id', $customer->id)
            ->orderByDesc('created_at')
            ->take(10)
            ->get(['id', 'number', 'total_usd', 'created_at', 'status']);

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
                'totalPurchases' => $totalPurchases,
                'lastPurchase' => $lastPurchase ? $lastPurchase->created_at->format('d/m/Y') : null,
            ],
            'invoices' => $invoices,
            'topProducts' => $topProducts,
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
}

<?php

namespace App\Http\Controllers;

use App\Models\{Layaway, LayawayItem, Customer, Product};
use App\Services\CurrencyService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class LayawayController extends Controller
{
    public function index(Request $request)
    {
        if (!$request->user() || !$request->user()->can('view credits')) {
            return redirect()->route('dashboard')->with('error', 'No tienes permiso para ver apartados.');
        }

        $status = (string) $request->input('status', '');

        $layaways = Layaway::with('customer')
            ->when($status !== '', function ($q) use ($status) {
                $q->where('status', $status);
            })
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/Layaway/Index', [
            'layaways' => $layaways,
            'filters' => [
                'status' => $status,
            ],
        ]);
    }

    public function create(Request $request)
    {
        if (!$request->user() || !$request->user()->can('manage credits')) {
            return redirect()->route('dashboard')->with('error', 'No tienes permiso para crear apartados.');
        }

        $customers = Customer::orderBy('name')->get(['id','name']);
        $products = Product::orderBy('name')->get(['id','name','price_usd','stock']);

        return Inertia::render('Admin/Layaway/Create', [
            'customers' => $customers,
            'products' => $products,
        ]);
    }

    public function store(Request $request, CurrencyService $currency)
    {
        if (!$request->user() || !$request->user()->can('manage credits')) {
            return redirect()->route('dashboard')->with('error', 'No tienes permiso para crear apartados.');
        }

        $data = $request->validate([
            'customer_id' => ['nullable','exists:customers,id'],
            'expires_at' => ['nullable','date'],
            'notes' => ['nullable','string'],
            'items' => ['required','array','min:1'],
            'items.*.product_id' => ['required','exists:products,id'],
            'items.*.quantity' => ['required','integer','min:1'],
        ]);

        return DB::transaction(function () use ($data, $currency) {
            $layaway = new Layaway();
            $layaway->number = 'LAY-'.Str::upper(Str::random(8));
            $layaway->customer_id = $data['customer_id'] ?? null;
            $layaway->status = 'active';
            $layaway->expires_at = $data['expires_at'] ?? null;
            $layaway->notes = $data['notes'] ?? null;
            $layaway->total_usd = 0;
            $layaway->total_bs = 0;
            $layaway->paid_usd = 0;
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
                ]);

                $totalUsd += $subtotalUsd;
            }

            $layaway->update([
                'total_usd' => $totalUsd,
                'total_bs' => $currency->usdToBs($totalUsd),
            ]);

            return redirect()->route('admin.layaways.index')->with('success', 'Apartado creado correctamente.');
        });
    }

    public function show(Request $request, Layaway $layaway)
    {
        if (!$request->user() || !$request->user()->can('view credits')) {
            return redirect()->route('dashboard')->with('error', 'No tienes permiso para ver apartados.');
        }

        $layaway->load(['customer','items.product']);

        return Inertia::render('Admin/Layaway/Show', [
            'layaway' => $layaway,
        ]);
    }

    public function update(Request $request, Layaway $layaway)
    {
        if (!$request->user() || !$request->user()->can('manage credits')) {
            return redirect()->route('dashboard')->with('error', 'No tienes permiso para actualizar apartados.');
        }

        $data = $request->validate([
            'status' => ['required','in:active,completed,cancelled,expired'],
        ]);

        $layaway->status = $data['status'];
        $layaway->save();

        return redirect()->route('admin.layaways.show', $layaway->id)->with('success', 'Apartado actualizado.');
    }
}

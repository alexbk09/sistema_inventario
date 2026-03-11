<?php

namespace App\Http\Controllers;

use App\Models\{Product, MovementType, Provider, Warehouse};
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductInventoryController extends Controller
{
    public function index(Request $request, Product $product, InventoryService $inventory)
    {
        $product->load(['movements.warehouse']);

        // Recoger filtros desde la query
        $filters = $request->only(['warehouse_id', 'type', 'date_from', 'date_to']);

        $summary = $inventory->summaryForProduct($product);

        $movementsQuery = $product->movements()->with('warehouse');

        if ($request->filled('warehouse_id')) {
            $movementsQuery->where('warehouse_id', $request->query('warehouse_id'));
        }
        if ($request->filled('type')) {
            $movementsQuery->where('type', $request->query('type'));
        }
        if ($request->filled('date_from')) {
            $movementsQuery->whereDate('created_at', '>=', $request->query('date_from'));
        }
        if ($request->filled('date_to')) {
            $movementsQuery->whereDate('created_at', '<=', $request->query('date_to'));
        }

        $perPage = (int) $request->query('per_page', 20);
        $movements = $movementsQuery->latest()->paginate($perPage)->withQueryString();

        $movementTypes = MovementType::orderBy('name')->get();
        $providers = Provider::orderBy('name')->get(['id','name']);
        $warehouses = Warehouse::orderBy('name')->get(['id','name','code']);

        return Inertia::render('Admin/Product/Inventory', [
            'product' => $product,
            'movements' => $movements,
            'filters' => $filters,
            'summary' => $summary,
            'movementTypes' => $movementTypes,
            'providers' => $providers,
            'warehouses' => $warehouses,
        ]);
    }

    public function store(Product $product, Request $request, InventoryService $inventory)
    {
        $data = $request->validate([
            'type' => ['required','in:entry,exit'],
            'quantity' => ['required','integer','min:1'],
            'unit_price_usd' => ['required','numeric','min:0'],
            'movement_type_id' => ['required','exists:movement_types,id'],
            'provider_id' => ['nullable','exists:providers,id'],
            'warehouse_id' => ['required','exists:warehouses,id'],
            'reference' => ['nullable','string','max:255'],
            'notes' => ['nullable','string','max:500'],
        ]);

        if ($data['type'] === 'entry') {
            $inventory->registerEntry(
                $product,
                $data['quantity'],
                $data['unit_price_usd'],
                $data['movement_type_id'],
                $data['reference'] ?? null,
                $data['notes'] ?? null,
                $data['provider_id'] ?? null,
                $data['warehouse_id'],
            );
        } else {
            $inventory->registerExit(
                $product,
                $data['quantity'],
                $data['unit_price_usd'],
                $data['movement_type_id'],
                $data['reference'] ?? null,
                $data['notes'] ?? null,
                $data['warehouse_id'],
            );
        }

        return redirect()->back();
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\{Product, MovementType, Provider, Warehouse};
use App\Services\AdminMoneyService;
use App\Services\InventoryService;
use App\Support\Settings;
use Illuminate\Http\Request;
use Inertia\Inertia;
use InvalidArgumentException;

class ProductInventoryController extends Controller
{
    public function index(Request $request, Product $product, InventoryService $inventory, AdminMoneyService $adminMoneyService)
    {
        $product->load(['movements.warehouse']);
        $currencySettings = Settings::get('currency', []);
        $adminCurrencyContext = $adminMoneyService->getAdminCurrencyContext($currencySettings);

        // Recoger filtros desde la query
        $filters = $request->only(['warehouse_id', 'type', 'date_from', 'date_to']);

        $summary = $inventory->summaryForProduct($product);
        $summary['entries_total_value_admin_totals'] = $adminMoneyService->buildAdminTotals((float) ($summary['entries_total_value_usd'] ?? 0), $currencySettings)['totals'];
        $summary['exits_total_value_admin_totals'] = $adminMoneyService->buildAdminTotals((float) ($summary['exits_total_value_usd'] ?? 0), $currencySettings)['totals'];
        $product->price_admin_totals = $adminMoneyService->buildAdminTotals((float) ($product->price_usd ?? 0), $currencySettings)['totals'];

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
        $movements->getCollection()->transform(function ($movement) use ($adminMoneyService, $currencySettings) {
            $movement->unit_price_admin_totals = $adminMoneyService->buildAdminTotals((float) ($movement->unit_price_usd ?? 0), $currencySettings)['totals'];
            $movement->total_value_admin_totals = $adminMoneyService->buildAdminTotals((float) ($movement->total_value_usd ?? 0), $currencySettings)['totals'];

            return $movement;
        });

        $movementTypes = MovementType::orderBy('name')->get();
        $providers = Provider::orderBy('name')->get(['id','name']);
        $warehouses = Warehouse::orderBy('name')->get(['id','name','code']);

        return Inertia::render('Admin/Product/Inventory', [
            'product' => $product,
            'movements' => $movements,
            'filters' => $filters,
            'summary' => $summary,
            'adminCurrencyContext' => $adminCurrencyContext,
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
        try {
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
        } catch (InvalidArgumentException $e) {
            return redirect()->back()->withInput()->with('error', $e->getMessage());
        }

        return redirect()->back()->with('success', __('app.admin.products.inventory.notifications.movement_registered'));
    }
}

<?php

namespace App\Http\Controllers\Reports;

use App\Http\Controllers\Controller;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\Warehouse;
use App\Services\AdminMoneyService;
use App\Support\Settings;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class InventoryKardexController extends Controller
{
    public function index(Request $request, AdminMoneyService $adminMoneyService)
    {
        $filters = [
            'product_id' => $request->input('product_id'),
            'warehouse_id' => $request->input('warehouse_id'),
            'date_from' => $request->input('date_from'),
            'date_to' => $request->input('date_to'),
        ];

        $currencySettings = Settings::get('currency', []);
        $adminCurrencyContext = $adminMoneyService->getAdminCurrencyContext($currencySettings);

        $query = InventoryMovement::query()
            ->with(['product:id,name,sku,barcode', 'warehouse:id,name,code', 'movementType:id,name,code'])
            ->when($filters['product_id'], function ($q, $pid) {
                $q->where('product_id', $pid);
            })
            ->when($filters['warehouse_id'], function ($q, $wid) {
                $q->where('warehouse_id', $wid);
            })
            ->when($filters['date_from'], function ($q, $from) {
                $q->whereDate('created_at', '>=', $from);
            })
            ->when($filters['date_to'], function ($q, $to) {
                $q->whereDate('created_at', '<=', $to);
            })
            ->orderBy('created_at')
            ->orderBy('id');

        $movements = $query->paginate(100)->withQueryString();

        // Calcular saldo acumulado (running balance)
        $runningBalance = 0;
        $movements->getCollection()->transform(function (InventoryMovement $movement) use (&$runningBalance, $adminMoneyService, $currencySettings) {
            $unitAmountUsd = (float) ($movement->unit_price_usd ?? $movement->cost_usd ?? 0);
            $totalValueUsd = (float) ($movement->total_value_usd ?? (($movement->quantity ?? 0) * $unitAmountUsd));

            // Calcular saldo acumulado
            if ($movement->type === 'entry') {
                $runningBalance += $movement->quantity;
            } else {
                $runningBalance -= $movement->quantity;
            }

            $movement->unit_price_admin_totals = $adminMoneyService->buildAdminTotals($unitAmountUsd, $currencySettings)['totals'];
            $movement->total_value_admin_totals = $adminMoneyService->buildAdminTotals($totalValueUsd, $currencySettings)['totals'];
            $movement->running_balance = $runningBalance;

            return $movement;
        });

        $product = null;
        if ($filters['product_id']) {
            $product = Product::select('id', 'name', 'sku', 'barcode', 'stock')->find($filters['product_id']);
        }

        $products = Product::orderBy('name')->limit(200)->get(['id', 'name', 'sku']);
        $warehouses = Warehouse::orderBy('name')->get(['id', 'name', 'code']);

        return Inertia::render('Admin/Reports/Inventory/Kardex', [
            'movements' => $movements,
            'filters' => $filters,
            'product' => $product,
            'products' => $products,
            'warehouses' => $warehouses,
            'adminCurrencyContext' => $adminCurrencyContext,
        ]);
    }

    public function export(Request $request, AdminMoneyService $adminMoneyService)
    {
        $filters = [
            'product_id' => $request->input('product_id'),
            'warehouse_id' => $request->input('warehouse_id'),
            'date_from' => $request->input('date_from'),
            'date_to' => $request->input('date_to'),
        ];

        $currencySettings = Settings::get('currency', []);

        $query = InventoryMovement::query()
            ->with(['product:id,name,sku,barcode', 'warehouse:id,name,code', 'movementType:id,name,code'])
            ->when($filters['product_id'], function ($q, $pid) {
                $q->where('product_id', $pid);
            })
            ->when($filters['warehouse_id'], function ($q, $wid) {
                $q->where('warehouse_id', $wid);
            })
            ->when($filters['date_from'], function ($q, $from) {
                $q->whereDate('created_at', '>=', $from);
            })
            ->when($filters['date_to'], function ($q, $to) {
                $q->whereDate('created_at', '<=', $to);
            })
            ->orderBy('created_at')
            ->orderBy('id');

        $movements = $query->get();

        // Calcular saldo acumulado
        $runningBalance = 0;
        $movements->transform(function ($movement) use (&$runningBalance, $adminMoneyService, $currencySettings) {
            if ($movement->type === 'entry') {
                $runningBalance += $movement->quantity;
            } else {
                $runningBalance -= $movement->quantity;
            }
            $movement->running_balance = $runningBalance;
            return $movement;
        });

        $filename = 'kardex_inventario_' . date('Y-m-d_His') . '.csv';

        return new StreamedResponse(function () use ($movements) {
            $handle = fopen('php://output', 'w');
            
            // BOM para UTF-8 en Excel
            fprintf($handle, "\xEF\xBB\xBF");
            
            // Cabeceras
            fputcsv($handle, [
                'Fecha',
                'Tipo',
                'Sucursal',
                'Cantidad',
                'Costo Unitario USD',
                'Total USD',
                'Saldo Acumulado',
                'Referencia',
                'Notas'
            ], ';');
            
            // Datos
            foreach ($movements as $mov) {
                fputcsv($handle, [
                    $mov->created_at->format('Y-m-d H:i:s'),
                    $mov->movementType->name ?? ($mov->type === 'entry' ? 'Entrada' : 'Salida'),
                    $mov->warehouse->name ?? $mov->warehouse->code ?? '—',
                    $mov->quantity,
                    number_format($mov->unit_price_usd ?? $mov->cost_usd ?? 0, 2, ',', '.'),
                    number_format($mov->total_value_usd ?? 0, 2, ',', '.'),
                    $mov->running_balance,
                    $mov->reference ?? '—',
                    $mov->notes ?? '—'
                ], ';');
            }
            
            fclose($handle);
        }, 200, [
            'Content-Type' => 'text/csv; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }
}

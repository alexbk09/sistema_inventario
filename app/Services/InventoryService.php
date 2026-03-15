<?php

namespace App\Services;

use App\Models\{Product, InventoryMovement, MovementType};
use App\Support\Settings;
use App\Support\Audit;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class InventoryService
{
    public function registerEntry(Product $product, int $quantity, float $unitPriceUsd = 0, int $movementTypeId = null, ?string $reference = null, ?string $notes = null, ?int $providerId = null, ?int $warehouseId = null): InventoryMovement
    {
        if ($quantity <= 0) {
            throw new InvalidArgumentException('La cantidad debe ser mayor a 0.');
        }
        $userId = Auth::id();
        if (! $userId) {
            throw new InvalidArgumentException('Debe haber un usuario autenticado para registrar un movimiento de inventario.');
        }

        $cleanNotes = is_null($notes) ? '' : trim($notes);
        if ($cleanNotes === '') {
            throw new InvalidArgumentException('Debes indicar un motivo para el movimiento de inventario.');
        }

        return DB::transaction(function () use ($product, $quantity, $unitPriceUsd, $movementTypeId, $reference, $cleanNotes, $providerId, $warehouseId, $userId) {
            $totalValue = $quantity * $unitPriceUsd;

            $movementType = $movementTypeId ? MovementType::findOrFail($movementTypeId) : null;

            $source = $movementType?->code;
            $allowedSources = ['purchase', 'sale', 'adjustment', 'return'];
            if (!in_array($source, $allowedSources, true)) {
                $source = 'adjustment';
            }

            $movement = InventoryMovement::create([
                'product_id' => $product->id,
                'provider_id' => $providerId,
                'warehouse_id' => $warehouseId,
                'type' => 'entry',
                'source' => $source,
                'movement_type_id' => $movementType?->id,
                'quantity' => $quantity,
                'unit_price_usd' => $unitPriceUsd,
                'total_value_usd' => $totalValue,
                'cost_usd' => $totalValue,
                'user_id' => $userId,
                'reference' => $reference,
                'notes' => $cleanNotes,
            ]);

            // Recalcular costo promedio ponderado del producto
            $currentStock = (int) $product->stock;
            $currentAvg = (float) ($product->average_cost_usd ?? 0.0);

            $newStock = $currentStock + $quantity;
            if ($newStock > 0) {
                $newAvg = (($currentStock * $currentAvg) + $totalValue) / $newStock;
                $product->stock = $newStock;
                $product->average_cost_usd = round($newAvg, 4);
                $product->save();
            } else {
                // Caso extremo: sin stock, reiniciar costo promedio
                $product->stock = $newStock;
                $product->average_cost_usd = null;
                $product->save();
            }

            Audit::log('inventory_entry_created', 'inventory', $movement, [
                'product_id' => $product->id,
                'quantity' => $quantity,
                'warehouse_id' => $warehouseId,
                'movement_type_id' => $movementType?->id,
            ]);

            return $movement;
        });
    }

    public function registerExit(Product $product, int $quantity, float $unitPriceUsd = 0, int $movementTypeId = null, ?string $reference = null, ?string $notes = null, ?int $warehouseId = null): InventoryMovement
    {
        if ($quantity <= 0) {
            throw new InvalidArgumentException('La cantidad debe ser mayor a 0.');
        }

        $userId = Auth::id();
        if (! $userId) {
            throw new InvalidArgumentException('Debe haber un usuario autenticado para registrar un movimiento de inventario.');
        }

        $cleanNotes = is_null($notes) ? '' : trim($notes);
        if ($cleanNotes === '') {
            throw new InvalidArgumentException('Debes indicar un motivo para el movimiento de inventario.');
        }

        $inventorySettings = Settings::get('inventory', [
            'allow_negative_stock' => false,
        ]);

        $allowNegativeStock = (bool) ($inventorySettings['allow_negative_stock'] ?? false);

        return DB::transaction(function () use ($product, $quantity, $unitPriceUsd, $movementTypeId, $reference, $cleanNotes, $warehouseId, $allowNegativeStock, $userId) {
            if (! $allowNegativeStock && $product->stock < $quantity) {
                throw new InvalidArgumentException('No hay stock suficiente para esta salida.');
            }

            $totalValue = $quantity * $unitPriceUsd;

            $movementType = $movementTypeId ? MovementType::findOrFail($movementTypeId) : null;

            $source = $movementType?->code;
            $allowedSources = ['purchase', 'sale', 'adjustment', 'return'];
            if (!in_array($source, $allowedSources, true)) {
                $source = 'adjustment';
            }

            $movement = InventoryMovement::create([
                'product_id' => $product->id,
                'warehouse_id' => $warehouseId,
                'type' => 'exit',
                'source' => $source,
                'movement_type_id' => $movementType?->id,
                'quantity' => $quantity,
                'unit_price_usd' => $unitPriceUsd,
                'total_value_usd' => $totalValue,
                'cost_usd' => $totalValue,
                'user_id' => $userId,
                'reference' => $reference,
                'notes' => $cleanNotes,
            ]);

            $product->decrement('stock', $quantity);

            Audit::log('inventory_exit_created', 'inventory', $movement, [
                'product_id' => $product->id,
                'quantity' => $quantity,
                'warehouse_id' => $warehouseId,
                'movement_type_id' => $movementType?->id,
            ]);

            return $movement;
        });
    }

    public function summaryForProduct(Product $product): array
    {
        $base = $product->movements();

        $entries = (clone $base)->where('type', 'entry');
        $exits = (clone $base)->where('type', 'exit');

        return [
            'entries_quantity' => (int) $entries->sum('quantity'),
            'entries_total_value_usd' => (float) $entries->sum('total_value_usd'),
            'exits_quantity' => (int) $exits->sum('quantity'),
            'exits_total_value_usd' => (float) $exits->sum('total_value_usd'),
        ];
    }
}

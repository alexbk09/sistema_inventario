<?php

namespace App\Services;

use App\Models\{Product, InventoryMovement, MovementType};
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

        return DB::transaction(function () use ($product, $quantity, $unitPriceUsd, $movementTypeId, $reference, $notes, $providerId, $warehouseId) {
            $totalValue = $quantity * $unitPriceUsd;

            $movementType = $movementTypeId ? MovementType::findOrFail($movementTypeId) : null;

            $movement = InventoryMovement::create([
                'product_id' => $product->id,
                'provider_id' => $providerId,
                'warehouse_id' => $warehouseId,
                'type' => 'entry',
                'source' => $movementType?->code,
                'movement_type_id' => $movementType?->id,
                'quantity' => $quantity,
                'unit_price_usd' => $unitPriceUsd,
                'total_value_usd' => $totalValue,
                'cost_usd' => $totalValue,
                'user_id' => Auth::id(),
                'reference' => $reference,
                'notes' => $notes,
            ]);

            $product->increment('stock', $quantity);

            return $movement;
        });
    }

    public function registerExit(Product $product, int $quantity, float $unitPriceUsd = 0, int $movementTypeId = null, ?string $reference = null, ?string $notes = null, ?int $warehouseId = null): InventoryMovement
    {
        if ($quantity <= 0) {
            throw new InvalidArgumentException('La cantidad debe ser mayor a 0.');
        }

        return DB::transaction(function () use ($product, $quantity, $unitPriceUsd, $movementTypeId, $reference, $notes, $warehouseId) {
            if ($product->stock < $quantity) {
                throw new InvalidArgumentException('No hay stock suficiente para esta salida.');
            }

            $totalValue = $quantity * $unitPriceUsd;

            $movementType = $movementTypeId ? MovementType::findOrFail($movementTypeId) : null;

            $movement = InventoryMovement::create([
                'product_id' => $product->id,
                'warehouse_id' => $warehouseId,
                'type' => 'exit',
                'source' => $movementType?->code,
                'movement_type_id' => $movementType?->id,
                'quantity' => $quantity,
                'unit_price_usd' => $unitPriceUsd,
                'total_value_usd' => $totalValue,
                'cost_usd' => $totalValue,
                'user_id' => Auth::id(),
                'reference' => $reference,
                'notes' => $notes,
            ]);

            $product->decrement('stock', $quantity);

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

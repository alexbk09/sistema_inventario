<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryMovement extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'provider_id',
        'warehouse_id',
        'type',
        'source',
        'movement_type_id',
        'quantity',
        'unit_price_usd',
        'total_value_usd',
        'cost_usd',
        'user_id',
        'reference',
        'notes',
    ];

    protected $casts = [
        'quantity' => 'int',
        'unit_price_usd' => 'float',
        'total_value_usd' => 'float',
        'cost_usd' => 'float',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function movementType(): BelongsTo
    {
        return $this->belongsTo(MovementType::class);
    }

    public function provider(): BelongsTo
    {
        return $this->belongsTo(Provider::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }
}

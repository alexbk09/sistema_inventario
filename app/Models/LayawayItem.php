<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LayawayItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'layaway_id',
        'product_id',
        'quantity',
        'unit_price_usd',
        'subtotal_usd',
        'subtotal_bs',
        'unit_currency_code',
        'unit_price_original',
        'subtotal_original',
        'exchange_rate_snapshot',
        'monetary_breakdown_json',
    ];

    protected $casts = [
        'quantity' => 'int',
        'unit_price_usd' => 'float',
        'subtotal_usd' => 'float',
        'subtotal_bs' => 'float',
        'unit_price_original' => 'float',
        'subtotal_original' => 'float',
        'exchange_rate_snapshot' => 'float',
        'monetary_breakdown_json' => 'array',
    ];

    public function layaway(): BelongsTo
    {
        return $this->belongsTo(Layaway::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}

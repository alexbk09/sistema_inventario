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

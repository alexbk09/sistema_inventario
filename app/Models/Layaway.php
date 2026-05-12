<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Layaway extends Model
{
    use HasFactory;

    protected $fillable = [
        'number',
        'customer_id',
        'status',
        'total_usd',
        'total_bs',
        'paid_usd',
        'currency_code',
        'base_currency_code',
        'exchange_rate_snapshot',
        'exchange_rate_source',
        'monetary_totals_json',
        'expires_at',
        'notes',
    ];

    protected $casts = [
        'total_usd' => 'float',
        'total_bs' => 'float',
        'paid_usd' => 'float',
        'exchange_rate_snapshot' => 'float',
        'monetary_totals_json' => 'array',
        'expires_at' => 'datetime',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(LayawayItem::class);
    }
}

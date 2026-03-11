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
        'expires_at',
        'notes',
    ];

    protected $casts = [
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

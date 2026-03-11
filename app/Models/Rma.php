<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Rma extends Model
{
    use HasFactory;

    protected $fillable = [
        'number',
        'invoice_id',
        'customer_id',
        'status',
        'reason_type',
        'reason',
        'resolution_type',
        'total_usd',
        'total_bs',
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(RmaItem::class);
    }
}

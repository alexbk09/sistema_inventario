<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentGatewayTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_id',
        'provider',
        'payment_method',
        'event_type',
        'status',
        'external_order_id',
        'external_capture_id',
        'external_transaction_id',
        'currency',
        'amount',
        'payload',
        'verified_at',
        'consumed_at',
    ];

    protected $casts = [
        'amount' => 'float',
        'payload' => 'array',
        'verified_at' => 'datetime',
        'consumed_at' => 'datetime',
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }
}
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvoicePayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_id',
        'method',
        'amount_usd',
        'amount_bs',
        'payment_currency_code',
        'amount_original',
        'amount_base',
        'exchange_rate_snapshot',
        'exchange_rate_source',
        'reference',
        'bank',
        'payer',
        'notes',
    ];

    protected $casts = [
        'amount_usd' => 'float',
        'amount_bs' => 'float',
        'amount_original' => 'float',
        'amount_base' => 'float',
        'exchange_rate_snapshot' => 'float',
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }
}

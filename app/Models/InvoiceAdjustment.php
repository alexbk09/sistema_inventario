<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvoiceAdjustment extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_id',
        'type',
        'amount_usd',
        'amount_original',
        'currency_code',
        'base_currency_code',
        'exchange_rate_snapshot',
        'exchange_rate_source',
        'monetary_totals_json',
        'description',
        'created_by',
    ];

    protected $casts = [
        'amount_usd' => 'float',
        'amount_original' => 'float',
        'exchange_rate_snapshot' => 'float',
        'monetary_totals_json' => 'array',
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

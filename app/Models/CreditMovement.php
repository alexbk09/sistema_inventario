<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CreditMovement extends Model
{
    use HasFactory;

    protected $fillable = [
        'credit_account_id',
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
        'due_date',
        'paid_at',
    ];

    protected $casts = [
        'amount_usd' => 'float',
        'amount_original' => 'float',
        'exchange_rate_snapshot' => 'float',
        'monetary_totals_json' => 'array',
        'due_date' => 'datetime',
        'paid_at' => 'datetime',
    ];

    public function account(): BelongsTo
    {
        return $this->belongsTo(CreditAccount::class, 'credit_account_id');
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }
}

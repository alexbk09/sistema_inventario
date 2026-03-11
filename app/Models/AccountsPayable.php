<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AccountsPayable extends Model
{
    use HasFactory;

    protected $fillable = [
        'provider_id', 'amount_usd', 'amount_bs', 'status', 'due_date', 'notes'
    ];

    protected $casts = [
        'amount_usd' => 'float',
        'amount_bs' => 'float',
        'due_date' => 'date',
    ];

    public function provider(): BelongsTo
    {
        return $this->belongsTo(Provider::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvoiceContact extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_id',
        'full_name', 'email', 'phone', 'address', 'city', 'zip_code',
        'payment_method', 'bank', 'origin_bank', 'reference', 'payment_date',
    ];

    protected $casts = [
        'payment_date' => 'date',
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }
}

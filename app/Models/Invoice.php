<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\InvoiceStatus;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'number', 'document_type', 'customer_id', 'credit_account_id', 'layaway_id', 'status', 'internal_notes', 'public_notes', 'invoice_status_id', 'total_usd', 'total_bs', 'warehouse_id', 'cancelled_at', 'cancelled_by', 'cancellation_reason'
    ];

    protected $casts = [
        'total_usd' => 'float',
        'total_bs' => 'float',
        'cancelled_at' => 'datetime',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function contact()
    {
        return $this->hasOne(InvoiceContact::class);
    }

    public function invoiceStatus(): BelongsTo
    {
        return $this->belongsTo(InvoiceStatus::class, 'invoice_status_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(InvoicePayment::class);
    }

    public function adjustments(): HasMany
    {
        return $this->hasMany(InvoiceAdjustment::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Warehouse::class, 'warehouse_id');
    }

    public function creditAccount(): BelongsTo
    {
        return $this->belongsTo(\App\Models\CreditAccount::class, 'credit_account_id');
    }

    public function layaway(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Layaway::class, 'layaway_id');
    }
}

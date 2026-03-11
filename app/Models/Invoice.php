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
        'number', 'customer_id', 'status', 'invoice_status_id', 'total_usd', 'total_bs', 'warehouse_id'
    ];

    protected $casts = [
        'total_usd' => 'float',
        'total_bs' => 'float',
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

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Warehouse::class, 'warehouse_id');
    }
}

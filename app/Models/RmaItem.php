<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RmaItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'rma_id',
        'product_id',
        'invoice_item_id',
        'quantity',
        'unit_price_usd',
        'subtotal_usd',
        'subtotal_bs',
        'reason',
        'unit_currency_code',
        'unit_price_original',
        'subtotal_original',
        'exchange_rate_snapshot',
        'monetary_breakdown_json',
    ];

    protected $casts = [
        'quantity' => 'int',
        'unit_price_usd' => 'float',
        'subtotal_usd' => 'float',
        'subtotal_bs' => 'float',
        'unit_price_original' => 'float',
        'subtotal_original' => 'float',
        'exchange_rate_snapshot' => 'float',
        'monetary_breakdown_json' => 'array',
    ];

    public function rma(): BelongsTo
    {
        return $this->belongsTo(Rma::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function invoiceItem(): BelongsTo
    {
        return $this->belongsTo(InvoiceItem::class);
    }
}

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

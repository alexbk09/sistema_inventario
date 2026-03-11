<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductImage extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'path',
        'is_primary',
        'sort_order',
        'caption',
        'tags',
        'ai_processed',
    ];

    protected $casts = [
        'is_primary' => 'bool',
        'sort_order' => 'int',
        'tags' => 'array',
        'ai_processed' => 'bool',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}

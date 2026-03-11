<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'sku',
        'barcode',
        'description',
        'price_usd',
        'image_url',
        'category_id',
        'stock',
        'is_featured',
    ];

    protected $casts = [
        'price_usd' => 'float',
        'stock' => 'int',
        'is_featured' => 'bool',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class)->withTimestamps();
    }

    public function movements(): HasMany
    {
        return $this->hasMany(InventoryMovement::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class);
    }

    public function getPriceBsAttribute(): float
    {
        $rate = (float) config('currency.bs_rate', (float) env('BS_RATE', 0));
        return round($this->price_usd * ($rate ?: 0), 2);
    }
}

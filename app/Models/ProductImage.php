<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

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

    protected $appends = [
        'url',
    ];

    public function getUrlAttribute(): ?string
    {
        if (! $this->path) {
            return null;
        }

        if (Str::startsWith($this->path, ['http://', 'https://', '//'])) {
            return $this->path;
        }

        return app(\App\Services\ImageStorageService::class)->getUrl($this->path);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}

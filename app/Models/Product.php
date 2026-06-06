<?php
    
    /**
     * Devuelve la URL absoluta de la imagen principal del producto.
     * Si hay imágenes asociadas, retorna la primera; si no, usa image_url como fallback.
     * Siempre usa asset() para asegurar compatibilidad con cambios de storage o servidor.
     */
    /*public function getMainImageUrl(): string
    {
        $img = $this->images()->orderBy('sort_order')->first();
        if ($img && $img->path) {
            return asset('storage/' . $img->path);
        }
        if ($this->image_url) {
            // Si image_url ya es absoluta, la retorna; si es relativa, la convierte
            return str_starts_with($this->image_url, ['http://', 'https://', '//'])
                ? $this->image_url
                : asset('storage/' . ltrim($this->image_url, '/'));
        }
        // Fallback global (puedes cambiarlo por un placeholder genérico)
        return asset('images/placeholder.svg');
    }*/


namespace App\Models;

use App\Services\ImageStorageService;
use App\Support\Settings;
use Illuminate\Support\Str;
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
        'average_cost_usd',
        'image_url',
        'category_id',
        'stock',
        'min_stock',
        'is_featured',
    ];
    protected $casts = [
        'price_usd' => 'float',
        'average_cost_usd' => 'float',
        'stock' => 'int',
        'min_stock' => 'int',
        'is_featured' => 'bool',
    ];

    protected $appends = [
        'effective_min_stock',
        'is_low_stock',
        'image',
    ];

    public function getImageUrlAttribute(?string $value): ?string
    {
        if (! $value) {
            return null;
        }

        if (Str::startsWith($value, ['http://', 'https://', '//'])) {
            return $value;
        }

        return app(ImageStorageService::class)->getUrl($value);
    }

    public function getImageAttribute(): ?string
    {
        $primaryImage = null;

        if ($this->relationLoaded('images')) {
            $primaryImage = $this->images->sortBy('sort_order')->first();
        } else {
            $primaryImage = $this->images()->orderBy('sort_order')->first();
        }

        if ($primaryImage?->url) {
            return $primaryImage->url;
        }

        return $this->image_url;
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function getEffectiveMinStockAttribute(): int
    {
        if ($this->min_stock !== null) {
            return (int) $this->min_stock;
        }

        $inventory = Settings::get('inventory', ['default_min_stock' => 0]);

        return (int) ($inventory['default_min_stock'] ?? 0);
    }

    public function getIsLowStockAttribute(): bool
    {
        $min = $this->effective_min_stock;

        if ($min <= 0) {
            return false;
        }

        return $this->stock < $min;
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

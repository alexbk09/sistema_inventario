<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\InvoiceItem;
use App\Models\Product;
use App\Services\CurrencyService;
use App\Support\Settings;
use Inertia\Inertia;

class ShopController extends Controller
{
    public function index()
    {
        $currency = app(CurrencyService::class);
        $rate = $currency->getPromedio('oficial') ?? (float) config('currency.bs_rate', 0);
        $store = Settings::get('store', null);
        $general = Settings::get('general', null);

        $salesByProduct = InvoiceItem::selectRaw('product_id, SUM(quantity) as total_sold')
            ->whereHas('invoice', function ($q) {
                $q->where('status', 'paid');
            })
            ->groupBy('product_id')
            ->pluck('total_sold', 'product_id');

        $products = Product::with([
                'categories:id,name',
                'images' => function ($q) {
                    $q->orderBy('sort_order');
                },
            ])
            ->latest()
            ->take(48)
            ->get()
            ->map(function ($p) use ($rate, $salesByProduct) {
                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'sku' => $p->sku,
                    'barcode' => $p->barcode,
                    'price' => (float) $p->price_usd,
                    'price_bs' => round((float) $p->price_usd * ($rate ?: 0), 2),
                    'images' => $p->images->map(fn ($img) => [
                        'id' => $img->id,
                        'url' => asset('storage/'.$img->path),
                    ]),
                    'image' => $p->image_url,
                    'category' => optional($p->categories->first())->name ?? null,
                    'categories' => $p->categories->pluck('name'),
                    'stock' => (int) $p->stock,
                    'description' => $p->description,
                    'is_featured' => (bool) $p->is_featured,
                    'created_at' => $p->created_at?->toIso8601String(),
                    'sold_quantity' => (int) ($salesByProduct[$p->id] ?? 0),
                    'rating' => 5,
                    'reviews' => 0,
                ];
            });

        $categories = Category::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Shop/Index', [
            'products' => $products,
            'categories' => $categories,
            'rate' => $rate,
            'store' => $store,
            'company' => $general,
        ]);
    }

    public function show(Product $product)
    {
        $currency = app(CurrencyService::class);
        $rate = $currency->getPromedio('oficial') ?? (float) config('currency.bs_rate', 0);

        $product->load([
            'categories:id,name',
            'images' => function ($q) {
                $q->orderBy('sort_order');
            },
        ]);

        $data = [
            'id' => $product->id,
            'name' => $product->name,
            'sku' => $product->sku,
            'barcode' => $product->barcode,
            'description' => $product->description,
            'price' => (float) $product->price_usd,
            'price_bs' => round((float) $product->price_usd * ($rate ?: 0), 2),
            'images' => $product->images->map(fn ($img) => [
                'id' => $img->id,
                'url' => asset('storage/'.$img->path),
            ]),
            'image' => $product->image_url,
            'category' => optional($product->categories->first())->name ?? null,
            'categories' => $product->categories->pluck('name'),
            'stock' => (int) $product->stock,
            'rating' => 5,
            'reviews' => 0,
        ];

        $relatedQuery = Product::where('id', '!=', $product->id)
            ->when($product->categories->isNotEmpty(), function ($q) use ($product) {
                $q->whereHas('categories', function ($q2) use ($product) {
                    $q2->whereIn('categories.id', $product->categories->pluck('id'));
                });
            })
            ->with(['categories:id,name']);

        $related = $relatedQuery->take(8)->get()->map(function ($p) use ($rate) {
            return [
                'id' => $p->id,
                'name' => $p->name,
                'price' => (float) $p->price_usd,
                'image' => $p->image_url,
                'category' => optional($p->categories->first())->name ?? null,
            ];
        });

        return Inertia::render('Product/Show', [
            'product' => $data,
            'related' => $related,
            'rate' => $rate,
        ]);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\InvoiceItem;
use App\Services\CurrencyService;

class RecommendationController extends Controller
{
    public function forCart(CurrencyService $currency)
    {
        $rate = $currency->getPromedio('oficial') ?? (float) config('currency.bs_rate', 0);

        // Preferir productos destacados, completando con más vendidos si hace falta
        $featured = Product::where('is_featured', true)
            ->with(['categories:id,name', 'images' => function ($q) {
                $q->orderBy('sort_order');
            }])
            ->take(8)
            ->get();

        $products = $featured;

        if ($products->count() < 8) {
            $excludeIds = $products->pluck('id')->all();

            $bestSellerIds = InvoiceItem::selectRaw('product_id, SUM(quantity) as total_sold')
                ->whereHas('invoice', function ($q) {
                    $q->where('status', 'paid');
                })
                ->when(!empty($excludeIds), function ($q) use ($excludeIds) {
                    $q->whereNotIn('product_id', $excludeIds);
                })
                ->groupBy('product_id')
                ->orderByDesc('total_sold')
                ->limit(8 - $products->count())
                ->pluck('product_id');

            if ($bestSellerIds->isNotEmpty()) {
                $bestSellers = Product::whereIn('id', $bestSellerIds)
                    ->with(['categories:id,name', 'images' => function ($q) {
                        $q->orderBy('sort_order');
                    }])
                    ->get();
                $products = $products->merge($bestSellers);
            }
        }

        $items = $products->take(8)->map(function ($p) use ($rate) {
            return [
                'id' => $p->id,
                'name' => $p->name,
                'price' => (float) $p->price_usd,
                'price_bs' => round((float) $p->price_usd * ($rate ?: 0), 2),
                'image' => $p->image_url,
                'category' => optional($p->categories->first())->name ?? null,
                'stock' => (int) $p->stock,
            ];
        });

        return response()->json([
            'ok' => true,
            'items' => $items,
        ]);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Wishlist;
use App\Models\Product;
use App\Services\CurrencyService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WishlistController extends Controller
{
    public function index(Request $request)
    {
        $currency = app(CurrencyService::class);
        $rate = $currency->getPromedio('oficial') ?? (float) config('currency.bs_rate', 0);

        $wishlistItems = Wishlist::where('user_id', $request->user()->id)
            ->with(['product' => function ($q) {
                $q->with('category:id,name');
            }])
            ->get()
            ->map(function ($item) use ($rate) {
                $product = $item->product;
                return [
                    'id' => $item->id,
                    'product_id' => $item->product_id,
                    'product' => [
                        'id' => $product->id,
                        'name' => $product->name,
                        'sku' => $product->sku,
                        'price_usd' => (float) $product->price_usd,
                        'price_bs' => round((float) $product->price_usd * ($rate ?: 0), 2),
                        'image_url' => $product->image_url,
                        'stock' => (int) $product->stock,
                        'category' => $product->category,
                    ],
                    'added_at' => $item->created_at->toIso8601String(),
                ];
            });

        return Inertia::render('Wishlist/Index', [
            'wishlistItems' => $wishlistItems,
            'rate' => $rate,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
        ]);

        $wishlist = Wishlist::firstOrCreate([
            'user_id' => $request->user()->id,
            'product_id' => $request->product_id,
        ]);

        return back()->with('success', 'Producto agregado a tu lista de deseos');
    }

    public function destroy(Request $request, Wishlist $wishlist)
    {
        if ($wishlist->user_id !== $request->user()->id) {
            abort(403);
        }

        $wishlist->delete();

        return back()->with('success', 'Producto eliminado de tu lista de deseos');
    }
}

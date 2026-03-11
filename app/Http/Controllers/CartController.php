<?php

namespace App\Http\Controllers;

use App\Models\{Cart, CartItem, Product};
use Illuminate\Http\Request;
use App\Services\CurrencyService;

class CartController extends Controller
{
    public function add(Request $request)
    {
        $data = $request->validate([
            'product_id' => ['required','exists:products,id'],
            'quantity' => ['nullable','integer','min:1'],
            'price_usd' => ['nullable','numeric']
        ]);
        $user = $request->user();
        $qty = (int)($data['quantity'] ?? 1);

        $product = Product::findOrFail($data['product_id']);

        $cart = Cart::firstOrCreate([
            'user_id' => $user->id,
            'status' => 'open',
        ]);

        $item = CartItem::firstOrCreate([
            'cart_id' => $cart->id,
            'product_id' => $data['product_id'],
        ], [
            'quantity' => 0,
            'price_usd' => $data['price_usd'] ?? $product->price_usd,
        ]);
        // Verificar stock disponible
        $available = max(0, $product->stock - (int)$item->quantity);
        $toAdd = min($qty, $available);
        if ($toAdd > 0) {
            $item->increment('quantity', $toAdd);
        }
        // Si envían precio, actualizarlo
        if (isset($data['price_usd'])) {
            $item->price_usd = (float)$data['price_usd'];
            $item->save();
        }

        return back();
    }

    public function remove(Request $request)
    {
        $data = $request->validate([
            'product_id' => ['required','exists:products,id'],
        ]);
        $user = $request->user();
        $cart = Cart::firstOrCreate([
            'user_id' => $user->id,
            'status' => 'open',
        ]);
        CartItem::where('cart_id', $cart->id)->where('product_id', $data['product_id'])->delete();
        return back();
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'product_id' => ['required','exists:products,id'],
            'quantity' => ['required','integer','min:0'],
            'price_usd' => ['nullable','numeric'],
        ]);
        $user = $request->user();
        $cart = Cart::firstOrCreate([
            'user_id' => $user->id,
            'status' => 'open',
        ]);
        $item = CartItem::where('cart_id', $cart->id)->where('product_id', $data['product_id'])->first();
        if (!$item) {
            return back();
        }
        $product = Product::findOrFail($data['product_id']);
        if ($data['quantity'] <= 0) {
            $item->delete();
        } else {
            // No permitir más que el stock
            $qty = min($data['quantity'], $product->stock);
            $item->update(['quantity' => $qty]);
        }
        if (isset($data['price_usd'])) {
            $item->price_usd = (float)$data['price_usd'];
            $item->save();
        }
        return back();
    }

    public function clear(Request $request)
    {
        $user = $request->user();
        $cart = Cart::firstOrCreate([
            'user_id' => $user->id,
            'status' => 'open',
        ]);
        CartItem::where('cart_id', $cart->id)->delete();
        return back();
    }

    public function summary(Request $request, CurrencyService $currency)
    {
        $user = $request->user();
        $cart = Cart::firstOrCreate([
            'user_id' => $user->id,
            'status' => 'open',
        ]);
        $rate = $currency->getPromedio('paralelo') ?? (float) config('currency.bs_rate', 0);
        $items = CartItem::with('product:id,name')
            ->where('cart_id', $cart->id)
            ->get()
            ->map(function ($item) use ($rate) {
                $priceUsd = (float) $item->price_usd;
                $priceBs = round($priceUsd * ($rate ?: 0), 2);
                return [
                    'product_id' => $item->product_id,
                    'name' => optional($item->product)->name,
                    'quantity' => (int) $item->quantity,
                    'price_usd' => $priceUsd,
                    'price_bs' => $priceBs,
                    'subtotal_usd' => round($priceUsd * (int) $item->quantity, 2),
                    'subtotal_bs' => round($priceBs * (int) $item->quantity, 2),
                ];
            });
        $totalUsd = $items->sum('subtotal_usd');
        $totalBs = $items->sum('subtotal_bs');
        return response()->json([
            'ok' => true,
            'rate' => $rate,
            'items' => $items,
            'total_usd' => round($totalUsd, 2),
            'total_bs' => round($totalBs, 2),
        ]);
    }
}

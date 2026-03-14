<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Support\Settings;
use App\Services\CurrencyService;
use Illuminate\Support\Facades\Route as RouteFacade;
use Inertia\Inertia;

class HomeController extends Controller
{
    public function index()
    {
        $currency = app(CurrencyService::class);
        $rate = $currency->getPromedio('oficial') ?? (float) config('currency.bs_rate', 0);
        $store = Settings::get('store', null);
        $general = Settings::get('general', null);

        $featured = Product::where('is_featured', true)
            ->with([
                'categories:id,name',
                'images' => function ($q) {
                    $q->orderBy('sort_order');
                },
            ])
            ->take(8)
            ->get()
            ->map(function ($p) use ($rate) {
                return [
                    'id' => $p->id,
                    'name' => $p->name,
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
                ];
            });

        return Inertia::render('Home', [
            'products' => $featured,
            'canLogin' => RouteFacade::has('login'),
            'canRegister' => RouteFacade::has('register'),
            'rate' => $rate,
            'store' => $store,
            'company' => $general,
        ]);
    }
}

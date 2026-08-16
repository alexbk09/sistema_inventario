<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Banner;
use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HomeController extends Controller
{
    public function index(Request $request)
    {
        $banners = Banner::active()->get();
        
        $featuredProducts = Product::where('stock', '>', 0)
            ->orderBy('created_at', 'desc')
            ->limit(12)
            ->with('category:id,name')
            ->get(['id', 'name', 'sku', 'price_usd', 'image_url', 'category_id']);

        $categories = Category::orderBy('name')
            ->limit(8)
            ->get(['id', 'name', 'slug']);

        return Inertia::render('Public/Home/Index', [
            'banners' => $banners,
            'featuredProducts' => $featuredProducts,
            'categories' => $categories,
        ]);
    }
}

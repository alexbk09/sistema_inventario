<?php

namespace App\Http\Controllers;

use App\Models\ProductImage;
use Illuminate\Support\Facades\Storage;

class ProductImageController extends Controller
{
    public function destroy(ProductImage $image)
    {
        $product = $image->product;

        if ($image->path && Storage::disk('public')->exists($image->path)) {
            Storage::disk('public')->delete($image->path);
        }

        $wasPrimary = (bool) $image->is_primary;
        $image->delete();

        if ($product) {
            if ($wasPrimary) {
                $next = $product->images()->orderBy('sort_order')->first();
                $product->image_url = $next?->path;
            }

            $product->save();
        }

        return back();
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\ProductImage;
use App\Services\ImageStorageService;

class ProductImageController extends Controller
{
    public function destroy(ProductImage $image, ImageStorageService $imageStorageService)
    {
        $product = $image->product;

        if ($image->path) {
            $imageStorageService->delete($image->path);
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

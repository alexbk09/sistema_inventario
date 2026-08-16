<?php

namespace App\Http\Controllers;

use App\Models\Review;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReviewController extends Controller
{
    public function index(Request $request, Product $product)
    {
        $reviews = Review::approved()
            ->forProduct($product->id)
            ->with('user:id,name')
            ->latest()
            ->paginate(10);

        $averageRating = Review::approved()
            ->forProduct($product->id)
            ->avg('rating') ?? 0;

        $ratingDistribution = Review::approved()
            ->forProduct($product->id)
            ->selectRaw('rating, COUNT(*) as count')
            ->groupBy('rating')
            ->pluck('count', 'rating')
            ->toArray();

        // Fill missing ratings with 0
        for ($i = 1; $i <= 5; $i++) {
            if (!isset($ratingDistribution[$i])) {
                $ratingDistribution[$i] = 0;
            }
        }
        ksort($ratingDistribution);

        $userReview = null;
        if ($request->user()) {
            $userReview = Review::where('user_id', $request->user()->id)
                ->where('product_id', $product->id)
                ->first();
        }

        return Inertia::render('Reviews/Index', [
            'product' => $product,
            'reviews' => $reviews,
            'averageRating' => round($averageRating, 1),
            'ratingDistribution' => $ratingDistribution,
            'totalReviews' => $reviews->total(),
            'userReview' => $userReview,
        ]);
    }

    public function store(Request $request, Product $product)
    {
        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'title' => 'nullable|string|max:255',
            'comment' => 'required|string|max:1000',
        ]);

        $review = Review::updateOrCreate(
            [
                'user_id' => $request->user()->id,
                'product_id' => $product->id,
            ],
            [
                'rating' => $request->rating,
                'title' => $request->title,
                'comment' => $request->comment,
                'is_approved' => true, // Auto-approve for now
            ]
        );

        // Check if user has purchased this product
        $hasPurchased = $request->user()
            ->invoices()
            ->where('status', 'paid')
            ->whereHas('items', function ($q) use ($product) {
                $q->where('product_id', $product->id);
            })
            ->exists();

        if ($hasPurchased) {
            $review->is_verified_purchase = true;
            $review->save();
        }

        return back()->with('success', 'Tu reseña ha sido publicada');
    }

    public function update(Request $request, Review $review)
    {
        if ($review->user_id !== $request->user()->id) {
            abort(403);
        }

        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'title' => 'nullable|string|max:255',
            'comment' => 'required|string|max:1000',
        ]);

        $review->update([
            'rating' => $request->rating,
            'title' => $request->title,
            'comment' => $request->comment,
        ]);

        return back()->with('success', 'Tu reseña ha sido actualizada');
    }

    public function destroy(Request $request, Review $review)
    {
        if ($review->user_id !== $request->user()->id) {
            abort(403);
        }

        $review->delete();

        return back()->with('success', 'Tu reseña ha sido eliminada');
    }
}

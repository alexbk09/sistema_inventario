<?php

namespace App\Jobs;

use App\Models\ProductImage;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;

class ProcessProductImage implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $imageId;

    public function __construct(int $imageId)
    {
        $this->imageId = $imageId;
    }

    public function handle(): void
    {
        $image = ProductImage::find($this->imageId);
        if (!$image) return;

        $fullPath = storage_path('app/public/' . $image->path);
        if (!file_exists($fullPath)) return;

        $service = env('IMAGE_AI_URL', 'http://127.0.0.1:8001/process');
        try {
            $response = Http::attach('file', file_get_contents($fullPath), basename($fullPath))
                ->timeout(120)
                ->post($service);
        } catch (\Throwable $e) {
            return;
        }

        if (!$response->successful()) return;

        $data = $response->json();
        if (!is_array($data)) return;

        $image->caption = $data['caption'] ?? null;
        $image->tags = $data['tags'] ?? null;
        $image->ai_processed = true;
        $image->save();
    }
}

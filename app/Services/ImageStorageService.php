<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Http;

class ImageStorageService
{
    public function storeUploadedFile(UploadedFile $file, string $directory = 'products', ?string $disk = null): array
    {
        $disk = $this->resolveDisk($disk);
        $extension = strtolower($file->getClientOriginalExtension() ?: 'jpg');
        $filename = sprintf('%s.%s', uniqid('img_', true), $extension);
        $path = Storage::disk($disk)->putFileAs($directory, $file, $filename);

        return [
            'path' => $path,
            'url' => Storage::disk($disk)->url($path),
            'disk' => $disk,
        ];
    }

    public function storeRemoteImage(string $url, string $directory = 'products', ?string $disk = null): ?array
    {
        $disk = $this->resolveDisk($disk);

        try {
            $response = Http::withOptions(['verify' => false])->get($url);
        } catch (\Throwable $e) {
            return null;
        }

        if (! $response->ok()) {
            return null;
        }

        $extension = $this->guessExtensionFromUrl($url, $response->header('content-type'));
        $filename = sprintf('%s.%s', uniqid('img_', true), $extension);
        $path = rtrim($directory, '/') . '/' . $filename;

        Storage::disk($disk)->put($path, $response->body());

        return [
            'path' => $path,
            'url' => Storage::disk($disk)->url($path),
            'disk' => $disk,
        ];
    }

    public function delete(string $path, ?string $disk = null): bool
    {
        $disk = $this->resolveDisk($disk);

        if (! $path || ! Storage::disk($disk)->exists($path)) {
            return false;
        }

        return Storage::disk($disk)->delete($path);
    }

    public function getUrl(string $path, ?string $disk = null): string
    {
        if (! $path) {
            return '';
        }

        // If a specific disk was provided, prefer it when available
        $preferred = $disk ?: $this->resolveDisk(null);

        $disksToTry = array_unique(array_filter([$preferred, 'images', 'public', 'local']));

        foreach ($disksToTry as $d) {
            try {
                if (config("filesystems.disks.{$d}") && Storage::disk($d)->exists($path)) {
                    return Storage::disk($d)->url($path);
                }
            } catch (\Throwable $e) {
                // ignore and continue
            }
        }

        // Fallback: return URL using the preferred disk (may not exist but keeps previous behavior)
        try {
            return Storage::disk($preferred)->url($path);
        } catch (\Throwable $e) {
            return (rtrim(env('APP_URL', ''), '/')) . '/' . ltrim($path, '/');
        }
    }

    protected function resolveDisk(?string $disk): string
    {
        if ($disk) {
            return $disk;
        }

        if ($envDisk = env('IMAGE_STORAGE_DISK')) {
            return $envDisk;
        }

        if (config('filesystems.disks.images')) {
            return 'images';
        }

        return config('filesystems.default', 'public');
    }

    protected function guessExtensionFromUrl(string $url, ?string $contentType): string
    {
        $extension = pathinfo(parse_url($url, PHP_URL_PATH) ?: '', PATHINFO_EXTENSION);
        $extension = strtolower(trim($extension, '.'));

        if ($extension === '') {
            $extension = $this->guessExtensionFromContentType($contentType);
        }

        if ($extension === '') {
            $extension = 'jpg';
        }

        return $extension;
    }

    protected function guessExtensionFromContentType(?string $contentType): string
    {
        if (! $contentType) {
            return '';
        }

        return match (strtolower(explode(';', $contentType)[0])) {
            'image/jpeg' => 'jpg',
            'image/jpg' => 'jpg',
            'image/png' => 'png',
            'image/gif' => 'gif',
            'image/webp' => 'webp',
            'image/svg+xml' => 'svg',
            default => '',
        };
    }
}

<?php

namespace App\Services;

use App\Support\Settings;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class PayPalService
{
    public function isEnabled(): bool
    {
        $config = $this->config();

        return (bool) Arr::get($config, 'enabled', false)
            && filled(Arr::get($config, 'client_id'))
            && filled(Arr::get($config, 'client_secret'));
    }

    public function createOrder(float $amount, string $currency = 'USD', array $metadata = []): array
    {
        $token = $this->accessToken();

        $response = $this->client()
            ->withToken($token)
            ->post('/v2/checkout/orders', [
                'intent' => 'CAPTURE',
                'purchase_units' => [[
                    'amount' => [
                        'currency_code' => strtoupper($currency),
                        'value' => number_format($amount, 2, '.', ''),
                    ],
                    'custom_id' => (string) ($metadata['custom_id'] ?? 'checkout'),
                    'description' => (string) ($metadata['description'] ?? 'Checkout tienda'),
                ]],
                'application_context' => [
                    'shipping_preference' => 'NO_SHIPPING',
                    'user_action' => 'PAY_NOW',
                    'brand_name' => (string) ($metadata['brand_name'] ?? config('app.name')),
                ],
            ]);

        if ($response->failed()) {
            $errorBody = $response->json();
            $errorMsg = $errorBody['message'] ?? $errorBody['error_description'] ?? 'Unknown PayPal error';
            throw new RuntimeException("PayPal API Error: {$errorMsg} (Status: {$response->status()})");
        }

        return $response->json();
    }

    public function captureOrder(string $orderId): array
    {
        $isLive = Arr::get($this->config(), 'environment') === 'live';

        $client = $this->client()
            ->withToken($this->accessToken());

        // En desarrollo local (XAMPP/Windows), deshabilitar SSL verify para sandbox
        if (! $isLive && app()->environment('local', 'development')) {
            $client = $client->withoutVerifying();
        }

        $response = $client
            ->withHeaders([
                'Content-Type' => 'application/json',
            ])
            ->post("/v2/checkout/orders/{$orderId}/capture", new \stdClass());

        if ($response->failed()) {
            $errorBody = $response->json();
            $errorMsg = $errorBody['message'] ?? $errorBody['error_description'] ?? $errorBody['details'][0]['description'] ?? 'Unknown capture error';
            throw new RuntimeException("PayPal Capture Error: {$errorMsg} (Status: {$response->status()})");
        }

        return $response->json();
    }

    public function publicConfiguration(): array
    {
        $config = $this->config();

        unset($config['client_secret']);

        return $config;
    }

    protected function accessToken(): string
    {
        if (! $this->isEnabled()) {
            $config = $this->config();
            throw new RuntimeException('PayPal not configured: enabled='.($config['enabled'] ?? 'null').', has_client_id='.(filled($config['client_id'] ?? null) ? 'yes' : 'no').', has_secret='.(filled($config['client_secret'] ?? null) ? 'yes' : 'no'));
        }

        $response = $this->client()
            ->asForm()
            ->withBasicAuth((string) Arr::get($this->config(), 'client_id'), (string) Arr::get($this->config(), 'client_secret'))
            ->post('/v1/oauth2/token', [
                'grant_type' => 'client_credentials',
            ]);

        if ($response->failed()) {
            $errorBody = $response->json();
            $errorMsg = $errorBody['error_description'] ?? $errorBody['error'] ?? 'Unknown auth error';
            throw new RuntimeException("PayPal Auth Failed: {$errorMsg} (Status: {$response->status()})");
        }

        $token = $response->json('access_token');

        if (! is_string($token) || $token === '') {
            throw new RuntimeException('PayPal returned empty token.');
        }

        return $token;
    }

    protected function client(): PendingRequest
    {
        $isLive = Arr::get($this->config(), 'environment') === 'live';
        $baseUrl = $isLive
            ? 'https://api-m.paypal.com'
            : 'https://api-m.sandbox.paypal.com';

        $client = Http::baseUrl($baseUrl)
            ->acceptJson()
            ->timeout(20);

        // En desarrollo local (XAMPP/Windows), deshabilitar SSL verify para sandbox
        if (! $isLive && app()->environment('local', 'development')) {
            $client = $client->withoutVerifying();
        }

        return $client;
    }

    protected function config(): array
    {
        // Configuración general desde Settings (no sensible)
        $settingsConfig = Settings::get('payments', ['methods' => []])['methods']['paypal'] ?? [];

        // Credenciales sensibles desde .env (seguro)
        $envConfig = [
            'client_id' => config('services.paypal.client_id'),
            'client_secret' => config('services.paypal.client_secret'),
        ];

        return array_merge($settingsConfig, $envConfig);
    }
}
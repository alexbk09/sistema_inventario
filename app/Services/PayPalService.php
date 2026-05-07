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
        $response = $this->client()
            ->withToken($this->accessToken())
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
            throw new RuntimeException('No se pudo crear la orden de PayPal.');
        }

        return $response->json();
    }

    public function captureOrder(string $orderId): array
    {
        $response = $this->client()
            ->withToken($this->accessToken())
            ->post("/v2/checkout/orders/{$orderId}/capture");

        if ($response->failed()) {
            throw new RuntimeException('No se pudo capturar la orden de PayPal.');
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
            throw new RuntimeException('PayPal no esta configurado correctamente.');
        }

        $response = $this->client()
            ->asForm()
            ->withBasicAuth((string) Arr::get($this->config(), 'client_id'), (string) Arr::get($this->config(), 'client_secret'))
            ->post('/v1/oauth2/token', [
                'grant_type' => 'client_credentials',
            ]);

        if ($response->failed()) {
            throw new RuntimeException('No se pudo autenticar con PayPal.');
        }

        $token = $response->json('access_token');

        if (! is_string($token) || $token === '') {
            throw new RuntimeException('PayPal no devolvio un token valido.');
        }

        return $token;
    }

    protected function client(): PendingRequest
    {
        $baseUrl = Arr::get($this->config(), 'environment') === 'live'
            ? 'https://api-m.paypal.com'
            : 'https://api-m.sandbox.paypal.com';

        return Http::baseUrl($baseUrl)
            ->acceptJson()
            ->timeout(20);
    }

    protected function config(): array
    {
        return Settings::get('payments', ['methods' => []])['methods']['paypal'] ?? [];
    }
}
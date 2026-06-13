<?php

namespace App\Services;

use App\Support\Settings;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class StripeService
{
    public function isEnabled(): bool
    {
        $config = $this->config();

        return (bool) Arr::get($config, 'enabled', false)
            && filled(Arr::get($config, 'publishable_key'))
            && filled(Arr::get($config, 'secret_key'));
    }

    public function createPaymentIntent(float $amount, string $currency = 'usd', array $metadata = []): array
    {
        $response = $this->client()->post('/v1/payment_intents', [
            'amount' => (string) max(1, (int) round($amount * 100)),
            'currency' => strtolower($currency),
            'payment_method_types[]' => 'card',
            'description' => (string) ($metadata['description'] ?? 'Checkout tienda'),
            'metadata[source]' => 'checkout',
            'metadata[checkout_ref]' => (string) ($metadata['checkout_ref'] ?? 'checkout'),
        ]);

        if ($response->failed()) {
            throw new RuntimeException('No se pudo crear el intento de pago con Stripe.');
        }

        return $response->json();
    }

    public function retrievePaymentIntent(string $paymentIntentId): array
    {
        $response = $this->client()->get("/v1/payment_intents/{$paymentIntentId}", [
            'expand[]' => 'latest_charge',
        ]);

        if ($response->failed()) {
            throw new RuntimeException('No se pudo verificar el pago en Stripe.');
        }

        return $response->json();
    }

    public function publicConfiguration(): array
    {
        $config = $this->config();

        unset($config['secret_key']);

        return $config;
    }

    protected function client(): PendingRequest
    {
        if (! $this->isEnabled()) {
            throw new RuntimeException('Stripe no esta configurado correctamente.');
        }

        $http = Http::baseUrl('https://api.stripe.com')
            ->withToken((string) Arr::get($this->config(), 'secret_key'))
            ->asForm()
            ->acceptJson()
            ->timeout(20);

        // Deshabilitar verificación SSL solo en desarrollo local (Windows/XAMPP)
        if (app()->environment('local', 'development')) {
            $http = $http->withoutVerifying();
        }

        return $http;
    }

    protected function config(): array
    {
        // Configuración general desde Settings (no sensible)
        $settingsConfig = Settings::get('payments', ['methods' => []])['methods']['stripe'] ?? [];

        // Credenciales sensibles desde .env (seguro)
        $envConfig = [
            'secret_key' => config('services.stripe.secret_key'),
            'publishable_key' => config('services.stripe.publishable_key'),
        ];

        return array_merge($settingsConfig, $envConfig);
    }
}
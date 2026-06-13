<?php

namespace App\Services;

use App\Support\CurrencySettings;
use App\Support\Settings;
use Illuminate\Support\Facades\Http;

class CurrencyService
{
    public function syncConfiguredRates(?array $currencySettings = null): array
    {
        $settings = CurrencySettings::normalize($currencySettings ?? Settings::get('currency', CurrencySettings::defaults()));
        $resolved = $this->getConfiguredExchangeRates($settings);
        $syncedAt = now()->toIso8601String();

        $supportedCurrencies = array_map(function (array $currency) use ($resolved, $settings, $syncedAt) {
            $code = strtoupper((string) ($currency['code'] ?? ''));
            $resolvedRate = $resolved['rates'][$code] ?? $currency['resolved_rate'] ?? null;

            if ($code === ($settings['base_currency'] ?? 'USD')) {
                $currency['last_rate'] = 1;
                $currency['last_synced_at'] = $syncedAt;
                return $currency;
            }

            $rateMode = (string) ($currency['rate_mode'] ?? 'auto');

            if ($rateMode === 'manual') {
                // En modo manual, SIEMPRE usar manual_rate si está disponible
                $manualRate = isset($currency['manual_rate']) && is_numeric($currency['manual_rate']) ? (float) $currency['manual_rate'] : null;
                if ($manualRate !== null && $manualRate > 0) {
                    $currency['last_rate'] = round($manualRate, 6);
                    $currency['last_synced_at'] = $syncedAt;
                }
                // No usar resolvedRate de la API en modo manual
                unset($currency['resolved_rate']);
                return $currency;
            }

            // Solo para modo auto: actualizar con tasa de API
            if ($rateMode === 'auto' && is_numeric($resolvedRate) && (float) $resolvedRate > 0) {
                $currency['last_rate'] = round((float) $resolvedRate, 6);
                $currency['last_synced_at'] = $syncedAt;
            }

            unset($currency['resolved_rate']);

            return $currency;
        }, $settings['supported_currencies'] ?? []);

        return CurrencySettings::normalize([
            ...$settings,
            'supported_currencies' => $supportedCurrencies,
        ]);
    }

    public function usdToBs(float $amountUsd): float
    {
        $promedio = $this->getPromedio('oficial');
        $rate = $promedio !== null ? (float) $promedio : (float) config('currency.bs_rate', (float) env('BS_RATE', 0));
        return round($amountUsd * ($rate ?: 0), 2);
    }

    public function fetchRateFromApi(?string $apiUrl = null): ?float
    {
        // Mantiene compatibilidad pero ahora intenta leer "promedio" del API público.
        $promedio = $this->getPromedio('oficial', $apiUrl);
        return $promedio !== null ? (float) $promedio : null;
    }

    /**
     * Obtiene los promedios por fuente desde la API.
     * Devuelve un arreglo asociativo: ['oficial' => float, 'paralelo' => float]
     */
    public function getPromedios(?string $apiUrl = null): array
    {
        $url = $apiUrl ?: 'https://ve.dolarapi.com/v1/dolares';
        try {
            $resp = Http::timeout(8)->get($url);
      
            if (!$resp->ok()) {
                return [];
            }
            $json = $resp->json();
            // La API devuelve un array de objetos con claves: fuente, promedio
            if (!is_array($json)) {
                return [];
            }
            $out = [];
            foreach ($json as $item) {
                if (is_array($item) && isset($item['fuente']) && array_key_exists('promedio', $item)) {
                    $fuente = (string) $item['fuente'];
                    $out[$fuente] = $item['promedio'] !== null ? (float) $item['promedio'] : null;
                }
            }
            return $out;
        } catch (\Throwable $e) {
            return [];
        }
    }

    /**
     * Obtiene el promedio para una fuente específica (por defecto: 'oficial').
     */
    public function getPromedio(string $fuente = 'oficial', ?string $apiUrl = null): ?float
    {
        $all = $this->getPromedios($apiUrl);
        if (!array_key_exists($fuente, $all)) {
            return null;
        }
        $val = $all[$fuente];
        return $val !== null ? (float) $val : null;
    }

    public function getConfiguredExchangeRates(?array $currencySettings = null): array
    {
        $settings = CurrencySettings::normalize($currencySettings ?? Settings::get('currency', CurrencySettings::defaults()));
        $baseCurrency = (string) ($settings['base_currency'] ?? 'USD');
        $supportedCurrencies = is_array($settings['supported_currencies'] ?? null) ? $settings['supported_currencies'] : [];
        $refreshIntervalMinutes = max(1, (int) ($settings['auto_refresh_interval_minutes'] ?? 240));

        $rates = [$baseCurrency => 1.0];
        $currencies = [];
        $providerGroups = [];
        $needsUpdate = false;

        foreach ($supportedCurrencies as $currency) {
            if (! is_array($currency)) {
                continue;
            }

            $code = strtoupper((string) ($currency['code'] ?? ''));
            if ($code === '') {
                continue;
            }

            if ($code === $baseCurrency) {
                $currency['resolved_rate'] = 1.0;
                $currencies[] = $currency;
                continue;
            }

            if (! ($currency['enabled'] ?? false)) {
                $currencies[] = $currency;
                continue;
            }

            $rateMode = (string) ($currency['rate_mode'] ?? 'auto');
            if ($rateMode === 'manual') {
                $manualRate = isset($currency['manual_rate']) && is_numeric($currency['manual_rate']) ? (float) $currency['manual_rate'] : null;
                if ($manualRate !== null && $manualRate > 0) {
                    $rate = $this->applyMarkup($manualRate, (float) ($currency['markup_percent'] ?? 0));
                    $rates[$code] = $rate;
                    $currency['resolved_rate'] = $rate;
                    $currencies[] = $currency;
                    continue;
                }
                // Si está en manual pero no hay tasa válida, no caer a auto - dejar null para que falle gracefully
                $currency['resolved_rate'] = null;
                $currencies[] = $currency;
                continue;
            }

            $lastRate = isset($currency['last_rate']) && is_numeric($currency['last_rate']) ? (float) $currency['last_rate'] : null;
            $lastSyncedAt = isset($currency['last_synced_at']) ? $currency['last_synced_at'] : null;
            $hasFreshRate = $this->hasFreshRate($lastSyncedAt, $refreshIntervalMinutes);

            if ($lastRate !== null && $hasFreshRate) {
                $rates[$code] = $lastRate;
                $currency['resolved_rate'] = $lastRate;
                $currencies[] = $currency;
                continue;
            }

            $provider = strtolower((string) ($currency['rate_provider'] ?? $settings['rate_provider'] ?? 'manual'));
            $providerGroups[$provider][] = $code;
            $currencies[] = $currency;
        }

        foreach ($providerGroups as $provider => $codes) {
            $providerRates = $this->fetchProviderRates($provider, $baseCurrency, array_values(array_unique($codes)));
            foreach ($providerRates as $code => $rate) {
                if ($rate > 0) {
                    $rates[$code] = $rate;
                }
            }
        }

        $now = now()->toIso8601String();
        $currencies = array_map(function (array $currency) use ($rates, $baseCurrency, $now, &$needsUpdate) {
            $code = strtoupper((string) ($currency['code'] ?? ''));
            $resolvedRate = $rates[$code] ?? null;
            if ($resolvedRate === null && $code === $baseCurrency) {
                $resolvedRate = 1.0;
            }

            if ($resolvedRate === null && isset($currency['last_rate']) && is_numeric($currency['last_rate'])) {
                $resolvedRate = (float) $currency['last_rate'];
            }

            if ($resolvedRate === null && isset($currency['manual_rate']) && is_numeric($currency['manual_rate'])) {
                $resolvedRate = (float) $currency['manual_rate'];
            }

            if ($resolvedRate !== null && $currency['rate_mode'] === 'auto' && $currency['code'] !== $baseCurrency) {
                $lastRate = isset($currency['last_rate']) && is_numeric($currency['last_rate']) ? (float) $currency['last_rate'] : null;
                if ($lastRate !== $resolvedRate) {
                    $currency['last_rate'] = $resolvedRate;
                    $currency['last_synced_at'] = $now;
                    $needsUpdate = true;
                } elseif (empty($currency['last_synced_at'])) {
                    $currency['last_synced_at'] = $now;
                    $needsUpdate = true;
                }
            }

            $currency['resolved_rate'] = $resolvedRate;

            return $currency;
        }, $currencies);

        if ($needsUpdate && $currencySettings === null) {
            Settings::set('currency', [
                ...$settings,
                'supported_currencies' => $currencies,
            ]);
        }

        return [
            'base_currency' => $baseCurrency,
            'default_display_currency' => $settings['default_display_currency'] ?? $baseCurrency,
            'rate_provider' => $settings['rate_provider'] ?? 'manual',
            'rates' => $rates,
            'currencies' => $currencies,
        ];
    }

    protected function hasFreshRate(?string $timestamp, int $maxAgeMinutes = 240): bool
    {
        if (! $timestamp) {
            return false;
        }

        try {
            $lastSynced = strtotime($timestamp);
            if ($lastSynced === false) {
                return false;
            }

            return (time() - $lastSynced) <= ($maxAgeMinutes * 60);
        } catch (\Throwable $e) {
            return false;
        }
    }

    protected function fetchProviderRates(string $provider, string $baseCurrency, array $targets): array
    {
        $targets = array_values(array_filter($targets, fn (string $code) => $code !== $baseCurrency));
        if ($targets === []) {
            return [];
        }

        return match ($provider) {
            'dolarapi' => $this->fetchDolarApiRates($targets),
            'frankfurter' => $this->fetchFrankfurterRates($baseCurrency, $targets),
            'exchangeratehost' => $this->fetchExchangeRateHostRates($baseCurrency, $targets),
            default => [],
        };
    }

    protected function fetchDolarApiRates(array $targets): array
    {
        if (! in_array('VES', $targets, true)) {
            return [];
        }

        $rate = $this->getPromedio('oficial');
        return $rate !== null ? ['VES' => $rate] : [];
    }

    protected function fetchFrankfurterRates(string $baseCurrency, array $targets): array
    {
        try {
            $response = Http::timeout(8)->get('https://api.frankfurter.app/latest', [
                'from' => $baseCurrency,
                'to' => implode(',', $targets),
            ]);

            if (! $response->ok()) {
                return [];
            }

            $rates = $response->json('rates');
            return is_array($rates) ? array_map(fn ($value) => (float) $value, $rates) : [];
        } catch (\Throwable $e) {
            return [];
        }
    }

    protected function fetchExchangeRateHostRates(string $baseCurrency, array $targets): array
    {
        try {
            $response = Http::timeout(8)->get('https://api.exchangerate.host/latest', [
                'base' => $baseCurrency,
                'symbols' => implode(',', $targets),
            ]);

            if (! $response->ok()) {
                return [];
            }

            $rates = $response->json('rates');
            return is_array($rates) ? array_map(fn ($value) => (float) $value, $rates) : [];
        } catch (\Throwable $e) {
            return [];
        }
    }

    protected function applyMarkup(float $rate, float $markupPercent): float
    {
        if ($rate <= 0) {
            return 0;
        }

        return round($rate * (1 + ($markupPercent / 100)), 6);
    }
}

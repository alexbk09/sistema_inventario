<?php

namespace App\Services;

use App\Support\CurrencySettings;
use App\Support\Settings;
use InvalidArgumentException;

class AdminMoneyService
{
    public function __construct(
        protected CurrencyService $currencyService,
    ) {
    }

    public function getEnabledCurrencyContext(?array $currencySettings = null): array
    {
        $settings = CurrencySettings::normalize($currencySettings ?? Settings::get('currency', CurrencySettings::defaults()));
        $resolved = $this->currencyService->getConfiguredExchangeRates($settings);

        $enabledCurrencies = array_values(array_filter(
            $resolved['currencies'] ?? [],
            fn (array $currency): bool => (bool) ($currency['enabled'] ?? false)
        ));

        $codes = array_map(
            fn (array $currency): string => (string) ($currency['code'] ?? ''),
            $enabledCurrencies
        );

        return [
            'base_currency' => (string) ($resolved['base_currency'] ?? $settings['base_currency'] ?? 'USD'),
            'default_display_currency' => (string) ($resolved['default_display_currency'] ?? $settings['default_display_currency'] ?? 'USD'),
            'currencies' => $enabledCurrencies,
            'codes' => array_values(array_filter($codes)),
            'rates' => is_array($resolved['rates'] ?? null) ? $resolved['rates'] : [],
        ];
    }

    public function getAdminCurrencyContext(?array $currencySettings = null): array
    {
        $context = $this->getEnabledCurrencyContext($currencySettings);

        $adminCurrencies = array_values(array_filter(
            $context['currencies'] ?? [],
            fn (array $currency): bool => (bool) ($currency['visible_in_admin'] ?? false)
        ));

        return [
            ...$context,
            'currencies' => $adminCurrencies,
            'codes' => array_values(array_map(
                fn (array $currency): string => (string) ($currency['code'] ?? ''),
                $adminCurrencies
            )),
        ];
    }

    public function convertFromBase(float $amount, string $targetCurrency, ?array $currencySettings = null): float
    {
        $context = $this->getAdminCurrencyContext($currencySettings);
        $code = strtoupper(trim($targetCurrency));

        if ($code === '') {
            throw new InvalidArgumentException('Target currency code is required.');
        }

        if ($code === $context['base_currency']) {
            return round($amount, 2);
        }

        $rate = $context['rates'][$code] ?? null;
        if (! is_numeric($rate) || (float) $rate <= 0) {
            throw new InvalidArgumentException("No exchange rate available for {$code}.");
        }

        return round($amount * (float) $rate, 2);
    }

    public function convertUsingSnapshot(float $amount, string $targetCurrency, array $snapshot): float
    {
        $baseCurrency = strtoupper((string) ($snapshot['base_currency'] ?? 'USD'));
        $code = strtoupper(trim($targetCurrency));
        $rates = is_array($snapshot['rates'] ?? null) ? $snapshot['rates'] : [];

        if ($code === '') {
            throw new InvalidArgumentException('Target currency code is required.');
        }

        if ($code === $baseCurrency) {
            return round($amount, 2);
        }

        $rate = $rates[$code] ?? null;
        if (! is_numeric($rate) || (float) $rate <= 0) {
            throw new InvalidArgumentException("No snapshot exchange rate available for {$code}.");
        }

        return round($amount * (float) $rate, 2);
    }

    public function convertToBase(float $amount, string $sourceCurrency, ?array $currencySettings = null, ?array $snapshot = null): float
    {
        $code = strtoupper(trim($sourceCurrency));

        if ($code === '') {
            throw new InvalidArgumentException('Source currency code is required.');
        }

        $baseCurrency = strtoupper((string) (($snapshot['base_currency'] ?? null)
            ?: ($this->getEnabledCurrencyContext($currencySettings)['base_currency'] ?? 'USD')));

        if ($code === $baseCurrency) {
            return round($amount, 2);
        }

        $rates = is_array($snapshot['rates'] ?? null)
            ? $snapshot['rates']
            : ($this->getEnabledCurrencyContext($currencySettings)['rates'] ?? []);

        $rate = $rates[$code] ?? null;
        if (! is_numeric($rate) || (float) $rate <= 0) {
            throw new InvalidArgumentException("No exchange rate available for {$code}.");
        }

        return round($amount / (float) $rate, 2);
    }

    public function buildAdminTotals(float $baseAmount, ?array $currencySettings = null, ?array $snapshot = null): array
    {
        $context = $this->getAdminCurrencyContext($currencySettings);
        $totals = [];

        foreach ($context['codes'] as $code) {
            $totals[$code] = $snapshot !== null
                ? $this->convertUsingSnapshot($baseAmount, $code, $snapshot)
                : $this->convertFromBase($baseAmount, $code, $currencySettings);
        }

        return [
            'base_amount' => round($baseAmount, 2),
            'base_currency' => $context['base_currency'],
            'default_display_currency' => $context['default_display_currency'],
            'totals' => $totals,
        ];
    }

    public function buildSnapshot(array $rates, ?string $baseCurrency = null, ?string $capturedAt = null): array
    {
        $normalizedRates = [];

        foreach ($rates as $code => $rate) {
            $currencyCode = strtoupper((string) $code);
            if ($currencyCode === '' || ! is_numeric($rate) || (float) $rate <= 0) {
                continue;
            }

            $normalizedRates[$currencyCode] = round((float) $rate, 6);
        }

        $snapshotBaseCurrency = strtoupper((string) ($baseCurrency ?: 'USD'));
        $normalizedRates[$snapshotBaseCurrency] = 1.0;

        return [
            'base_currency' => $snapshotBaseCurrency,
            'captured_at' => $capturedAt,
            'rates' => $normalizedRates,
        ];
    }

    public function buildDocumentTotals(float $baseAmount, ?array $currencySettings = null, ?array $snapshot = null): array
    {
        $context = $this->getEnabledCurrencyContext($currencySettings);
        $effectiveSnapshot = $snapshot ?? $this->buildSnapshot(
            $context['rates'] ?? [],
            $context['base_currency'] ?? 'USD',
            now()->toIso8601String(),
        );

        $totals = [];
        foreach ($context['codes'] ?? [] as $code) {
            $totals[$code] = $this->convertUsingSnapshot($baseAmount, $code, $effectiveSnapshot);
        }

        return [
            'base_amount' => round($baseAmount, 2),
            'base_currency' => (string) ($effectiveSnapshot['base_currency'] ?? ($context['base_currency'] ?? 'USD')),
            'default_display_currency' => (string) ($context['default_display_currency'] ?? ($context['base_currency'] ?? 'USD')),
            'captured_at' => $effectiveSnapshot['captured_at'] ?? null,
            'rates' => $effectiveSnapshot['rates'] ?? [],
            'totals' => $totals,
        ];
    }

    public function resolveCurrencyRateSource(string $currencyCode, ?array $currencySettings = null): ?string
    {
        $code = strtoupper(trim($currencyCode));
        if ($code === '') {
            return null;
        }

        $context = $this->getEnabledCurrencyContext($currencySettings);
        foreach ($context['currencies'] ?? [] as $currency) {
            if (($currency['code'] ?? null) === $code) {
                return (string) ($currency['rate_provider'] ?? 'manual');
            }
        }

        return null;
    }
}

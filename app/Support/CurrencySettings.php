<?php

namespace App\Support;

class CurrencySettings
{
    public static function defaults(): array
    {
        return [
            'base_currency' => 'USD',
            'secondary_currency' => 'VES',
            'default_display_currency' => 'USD',
            'rate_source' => 'dolarapi',
            'rate_provider' => 'dolarapi',
            'auto_refresh_enabled' => true,
            'auto_refresh_interval_minutes' => 60,
            'supported_currencies' => [
                self::makeCurrency('USD', 'US Dollar', '$', true, true, true, true, 'manual', 'manual', 1),
                self::makeCurrency('VES', 'Bolivar', 'Bs.', true, true, true, true, 'auto', 'dolarapi', null),
                self::makeCurrency('EUR', 'Euro', 'EUR', false, true, true, false, 'auto', 'frankfurter', null),
                self::makeCurrency('COP', 'Peso colombiano', 'COP', false, true, true, false, 'auto', 'frankfurter', null),
                self::makeCurrency('MXN', 'Peso mexicano', 'MXN', false, true, true, false, 'auto', 'frankfurter', null),
                self::makeCurrency('BRL', 'Real brasileño', 'R$', false, true, true, false, 'auto', 'frankfurter', null),
            ],
        ];
    }

    public static function normalize(mixed $settings): array
    {
        $defaults = self::defaults();
        $settings = is_array($settings) ? $settings : [];

        $baseCurrency = self::normalizeCode($settings['base_currency'] ?? $defaults['base_currency']);
        $secondaryCurrency = self::normalizeNullableCode($settings['secondary_currency'] ?? $defaults['secondary_currency']);
        $rateProvider = (string) ($settings['rate_provider'] ?? $settings['rate_source'] ?? $defaults['rate_provider']);
        $defaultDisplayCurrency = self::normalizeCode($settings['default_display_currency'] ?? $baseCurrency);

        $catalog = [];
        foreach ($defaults['supported_currencies'] as $currency) {
            $catalog[$currency['code']] = $currency;
        }

        $configuredCurrencies = $settings['supported_currencies'] ?? [];
        $hasConfiguredCurrencies = is_array($configuredCurrencies) && count($configuredCurrencies) > 0;

        if (is_array($configuredCurrencies)) {
            foreach ($configuredCurrencies as $currency) {
                $normalizedCurrency = self::normalizeCurrency($currency, $rateProvider);
                if ($normalizedCurrency === null) {
                    continue;
                }

                $code = $normalizedCurrency['code'];
                $catalog[$code] = array_replace($catalog[$code] ?? self::makeCurrency($code, $code, $code, false, true, true, false, 'auto', $rateProvider, null), $normalizedCurrency);
            }
        }

        $catalog[$baseCurrency] = array_replace(
            $catalog[$baseCurrency] ?? self::makeCurrency($baseCurrency, $baseCurrency, $baseCurrency, true, true, true, true, 'manual', 'manual', 1),
            [
                'code' => $baseCurrency,
                'enabled' => true,
                'visible_in_store' => true,
                'visible_in_admin' => true,
                'allow_checkout' => true,
                'rate_mode' => 'manual',
                'rate_provider' => 'manual',
                'manual_rate' => 1,
                'last_rate' => 1,
            ],
        );

        if ($secondaryCurrency !== null && ! $hasConfiguredCurrencies) {
            $catalog[$secondaryCurrency] = array_replace(
                $catalog[$secondaryCurrency] ?? self::makeCurrency($secondaryCurrency, $secondaryCurrency, $secondaryCurrency, true, true, true, false, 'auto', $rateProvider, null),
                [
                    'code' => $secondaryCurrency,
                    'enabled' => true,
                    'visible_in_store' => true,
                    'visible_in_admin' => true,
                    'rate_provider' => $catalog[$secondaryCurrency]['rate_provider'] ?? $rateProvider,
                ],
            );
        }

        if (! isset($catalog[$defaultDisplayCurrency]) || ! ($catalog[$defaultDisplayCurrency]['enabled'] ?? false)) {
            $defaultDisplayCurrency = $baseCurrency;
        }

        $supportedCurrencies = array_values($catalog);
        usort($supportedCurrencies, function (array $left, array $right) use ($baseCurrency, $defaultDisplayCurrency) {
            if ($left['code'] === $baseCurrency) {
                return -1;
            }
            if ($right['code'] === $baseCurrency) {
                return 1;
            }
            if ($left['code'] === $defaultDisplayCurrency) {
                return -1;
            }
            if ($right['code'] === $defaultDisplayCurrency) {
                return 1;
            }
            return strcmp($left['code'], $right['code']);
        });

        $availableCurrencies = array_values(array_map(
            fn (array $currency) => $currency['code'],
            array_filter($supportedCurrencies, fn (array $currency) => (bool) ($currency['enabled'] ?? false))
        ));

        return [
            'base_currency' => $baseCurrency,
            'secondary_currency' => self::deriveSecondaryCurrency($supportedCurrencies, $baseCurrency, $secondaryCurrency),
            'default_display_currency' => $defaultDisplayCurrency,
            'rate_source' => $rateProvider,
            'rate_provider' => $rateProvider,
            'auto_refresh_enabled' => (bool) ($settings['auto_refresh_enabled'] ?? $defaults['auto_refresh_enabled']),
            'auto_refresh_interval_minutes' => max(5, (int) ($settings['auto_refresh_interval_minutes'] ?? $defaults['auto_refresh_interval_minutes'])),
            'supported_currencies' => $supportedCurrencies,
            'available_currencies' => $availableCurrencies,
        ];
    }

    protected static function normalizeCurrency(mixed $currency, string $defaultRateProvider): ?array
    {
        if (! is_array($currency)) {
            return null;
        }

        $code = self::normalizeNullableCode($currency['code'] ?? null);
        if ($code === null) {
            return null;
        }

        return [
            'code' => $code,
            'name' => (string) ($currency['name'] ?? $code),
            'symbol' => (string) ($currency['symbol'] ?? $code),
            'enabled' => (bool) ($currency['enabled'] ?? false),
            'visible_in_store' => (bool) ($currency['visible_in_store'] ?? true),
            'visible_in_admin' => (bool) ($currency['visible_in_admin'] ?? true),
            'allow_checkout' => (bool) ($currency['allow_checkout'] ?? false),
            'rate_mode' => in_array(($currency['rate_mode'] ?? 'auto'), ['auto', 'manual'], true) ? (string) $currency['rate_mode'] : 'auto',
            'rate_provider' => (string) ($currency['rate_provider'] ?? $defaultRateProvider),
            'manual_rate' => self::normalizeNullableNumber($currency['manual_rate'] ?? null),
            'last_rate' => self::normalizeNullableNumber($currency['last_rate'] ?? null),
            'last_synced_at' => $currency['last_synced_at'] ?? null,
            'markup_percent' => (float) ($currency['markup_percent'] ?? 0),
            'rounding_mode' => (string) ($currency['rounding_mode'] ?? 'standard'),
        ];
    }

    protected static function deriveSecondaryCurrency(array $supportedCurrencies, string $baseCurrency, ?string $legacySecondary): ?string
    {
        if ($legacySecondary !== null && $legacySecondary !== $baseCurrency) {
            foreach ($supportedCurrencies as $currency) {
                if (($currency['code'] ?? null) === $legacySecondary && ($currency['enabled'] ?? false)) {
                    return $legacySecondary;
                }
            }
        }

        foreach ($supportedCurrencies as $currency) {
            if (($currency['code'] ?? null) !== $baseCurrency && ($currency['enabled'] ?? false)) {
                return $currency['code'];
            }
        }

        return null;
    }

    protected static function normalizeCode(mixed $value): string
    {
        $normalized = self::normalizeNullableCode($value);
        return $normalized ?? 'USD';
    }

    protected static function normalizeNullableCode(mixed $value): ?string
    {
        if (! is_string($value) || trim($value) === '') {
            return null;
        }

        return strtoupper(trim($value));
    }

    protected static function normalizeNullableNumber(mixed $value): ?float
    {
        if ($value === null || $value === '') {
            return null;
        }

        return is_numeric($value) ? (float) $value : null;
    }

    protected static function makeCurrency(
        string $code,
        string $name,
        string $symbol,
        bool $enabled,
        bool $visibleInStore,
        bool $visibleInAdmin,
        bool $allowCheckout,
        string $rateMode,
        string $rateProvider,
        ?float $manualRate,
    ): array {
        return [
            'code' => $code,
            'name' => $name,
            'symbol' => $symbol,
            'enabled' => $enabled,
            'visible_in_store' => $visibleInStore,
            'visible_in_admin' => $visibleInAdmin,
            'allow_checkout' => $allowCheckout,
            'rate_mode' => $rateMode,
            'rate_provider' => $rateProvider,
            'manual_rate' => $manualRate,
            'last_rate' => $manualRate,
            'last_synced_at' => null,
            'markup_percent' => 0,
            'rounding_mode' => 'standard',
        ];
    }
}
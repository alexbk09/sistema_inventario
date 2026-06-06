<?php

namespace App\Support;

class TranslationKeySanitizer
{
    private const KEY_ALIASES = [
        'app.admin.settings.' => 'app.admin.invoices.transfers.settings.',
    ];

    public static function translate(string $key): string
    {
        $translated = __($key);

        if (is_string($translated) && $translated !== $key) {
            return $translated;
        }

        foreach (self::KEY_ALIASES as $prefix => $aliasPrefix) {
            if (! str_starts_with($key, $prefix)) {
                continue;
            }

            $aliasKey = $aliasPrefix . substr($key, strlen($prefix));
            $aliasTranslation = __($aliasKey);

            if (is_string($aliasTranslation) && $aliasTranslation !== $aliasKey) {
                return $aliasTranslation;
            }
        }

        return $key;
    }

    public static function sanitize(mixed $value): mixed
    {
        if (is_array($value)) {
            $sanitized = [];

            foreach ($value as $key => $item) {
                $sanitized[$key] = self::sanitize($item);
            }

            return $sanitized;
        }

        if (! is_string($value)) {
            return $value;
        }

        $trimmed = trim($value);

        if ($trimmed === '' || ! str_starts_with($trimmed, 'app.')) {
            return $value;
        }

        return self::translate($trimmed);
    }
}

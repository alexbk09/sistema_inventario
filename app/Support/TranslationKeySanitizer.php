<?php

namespace App\Support;

class TranslationKeySanitizer
{
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

        $translated = __($trimmed);

        return is_string($translated) && $translated !== $trimmed
            ? $translated
            : $value;
    }
}

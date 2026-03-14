<?php

namespace App\Support;

use App\Models\Setting;

class Settings
{
    public static function get(string $key, mixed $default = null): mixed
    {
        $setting = Setting::where('key', $key)->first();

        if (! $setting) {
            return $default;
        }

        $value = $setting->value;

        // Si value es un escalar, devolverlo directo
        if (! is_array($value)) {
            return $value ?? $default;
        }

        return $value;
    }

    public static function set(string $key, mixed $value): Setting
    {
        return Setting::updateOrCreate(
            ['key' => $key],
            ['value' => $value],
        );
    }
}

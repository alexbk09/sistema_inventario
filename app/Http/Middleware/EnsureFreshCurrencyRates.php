<?php

namespace App\Http\Middleware;

use App\Services\CurrencyService;
use App\Support\Settings;
use Closure;
use Illuminate\Http\Request;

class EnsureFreshCurrencyRates
{
    public function __construct(
        private CurrencyService $currencyService,
    ) {
    }

    public function handle(Request $request, Closure $next)
    {
        // Solo verificar en rutas del admin/dashboard (no en API o frontend público)
        if (! $this->shouldCheckRates($request)) {
            return $next($request);
        }

        $settings = Settings::get('currency', []);
        $needsSync = $this->needsSync($settings);

        if ($needsSync) {
            try {
                $synced = $this->currencyService->syncConfiguredRates($settings);
                Settings::set('currency', $synced);
            } catch (\Throwable $e) {
                // Silenciar errores - no queremos bloquear la aplicación
                // si el servicio de tasas no está disponible
                \Log::warning('Currency auto-sync failed: '.$e->getMessage());
            }
        }

        return $next($request);
    }

    private function shouldCheckRates(Request $request): bool
    {
        $path = $request->path();

        // Solo verificar en rutas de administración
        $adminPrefixes = ['admin', 'dashboard', 'api/currency'];

        foreach ($adminPrefixes as $prefix) {
            if (str_starts_with($path, $prefix)) {
                return true;
            }
        }

        return false;
    }

    private function needsSync(array $settings): bool
    {
        // Verificar si auto-refresh está habilitado
        if (! ($settings['auto_refresh_enabled'] ?? true)) {
            return false;
        }

        $supportedCurrencies = $settings['supported_currencies'] ?? [];
        $intervalMinutes = $settings['auto_refresh_interval_minutes'] ?? 60;
        $threshold = now()->subMinutes($intervalMinutes);

        foreach ($supportedCurrencies as $currency) {
            // Solo verificar monedas con modo auto
            if (($currency['rate_mode'] ?? 'manual') !== 'auto') {
                continue;
            }

            // Si no tiene fecha de sincronización, necesita sync
            if (empty($currency['last_synced_at'])) {
                return true;
            }

            // Si la última sincronización es anterior al umbral, necesita sync
            try {
                $lastSynced = \Carbon\Carbon::parse($currency['last_synced_at']);
                if ($lastSynced->lt($threshold)) {
                    return true;
                }
            } catch (\Throwable $e) {
                // Fecha inválida, necesita sync
                return true;
            }
        }

        return false;
    }
}

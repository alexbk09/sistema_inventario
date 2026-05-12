<?php

namespace App\Http\Middleware;

use App\Services\AdminNotificationService;
use App\Support\CurrencySettings;
use App\Support\Settings;
use App\Support\TranslationKeySanitizer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Lang;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        if (app()->environment(['local', 'testing'])) {
            return null;
        }

        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $locale = app()->getLocale();
        $supportedLocales = config('locales.supported', []);
        $currentLocaleConfig = $supportedLocales[$locale] ?? $supportedLocales[config('app.fallback_locale')] ?? null;
        $appTranslations = $this->normalizeAppTranslations(Lang::get('app'));

        $notifications = [
            'unread_count' => 0,
            'items' => [],
        ];

        if ($user && $this->isBackofficeUser($user)) {
            $notificationService = app(AdminNotificationService::class);
            $notificationService->syncSystemNotifications();

            $notifications['unread_count'] = $notificationService->getUnreadCountForUser($user);
            $notifications['items'] = $notificationService
                ->getUnreadForUser($user, 12)
                ->map(fn ($notification) => [
                    'id' => $notification->id,
                    'type' => $notification->type,
                    'severity' => $notification->severity,
                    'title' => $notification->title,
                    'message' => $notification->message,
                    'action_url' => $notification->action_url,
                    'action_label' => $notification->action_label,
                    'data' => $notification->data,
                    'created_at' => $notification->created_at?->toIso8601String(),
                ])
                ->values();
        }

        return [
            ...parent::share($request),
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
            'notifications' => $notifications,
            'locale' => $locale,
            'localeConfig' => $currentLocaleConfig,
            'supportedLocales' => array_values($supportedLocales),
            'translations' => [
                'app' => $appTranslations,
            ],
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'type' => $user->type,
                    'roles' => method_exists($user, 'roles') ? $user->roles->pluck('name')->toArray() : [],
                    'permissions' => method_exists($user, 'getAllPermissions')
                        ? $user->getAllPermissions()->pluck('name')->values()
                        : [],
                ] : null,
            ],
            'settings' => [
                'general' => Settings::get('general', null),
                'location' => Settings::get('location', null),
                'branding' => Settings::get('branding', null),
                'billing' => Settings::get('billing', null),
                'currency' => CurrencySettings::normalize(Settings::get('currency', CurrencySettings::defaults())),
                'store' => TranslationKeySanitizer::sanitize(Settings::get('store', null)),
                'inventory' => Settings::get('inventory', null),
                'warehouses' => Settings::get('warehouses', null),
                'security' => Settings::get('security', null),
                'qr' => Settings::get('qr', null),
            ],
        ];
    }

    private function isBackofficeUser($user): bool
    {
        $roles = collect($user->roles ?? [])
            ->map(fn ($role) => is_string($role) ? $role : ($role->name ?? null))
            ->filter()
            ->values();

        return in_array($user->type, ['admin', 'supervisor', 'cashier', 'warehouse'], true)
            || $roles->intersect(['admin', 'supervisor', 'cashier', 'warehouse'])->isNotEmpty();
    }

    private function normalizeAppTranslations(array $translations): array
    {
        $adminModuleFallbacks = [
            'rmas' => ['admin.invoices.rmas'],
            'transfers' => ['admin.invoices.transfers', 'admin.transfers', 'auth.admin.transfers'],
            'layaways' => ['admin.invoices.transfers.layaways', 'admin.transfers.layaways', 'auth.admin.transfers.layaways'],
            'providers' => ['admin.invoices.transfers.providers', 'admin.transfers.providers', 'auth.admin.transfers.providers'],
            'customers' => ['admin.invoices.transfers.customers', 'admin.transfers.customers', 'auth.admin.transfers.customers'],
            'products' => ['admin.invoices.transfers.products', 'admin.transfers.products', 'auth.admin.transfers.products'],
            'users' => ['admin.invoices.transfers.users', 'admin.transfers.users', 'auth.admin.transfers.users'],
            'security' => ['admin.invoices.transfers.security', 'admin.transfers.security', 'auth.admin.transfers.security'],
            'categories' => ['admin.invoices.transfers.categories', 'admin.transfers.categories', 'auth.admin.transfers.categories'],
            'qr' => ['admin.invoices.transfers.qr', 'admin.transfers.qr', 'auth.admin.transfers.qr'],
            'qr_scanner' => ['admin.invoices.transfers.qr_scanner', 'admin.transfers.qr_scanner', 'auth.admin.transfers.qr_scanner'],
            'warehouses' => ['admin.invoices.transfers.warehouses', 'admin.transfers.warehouses', 'auth.admin.transfers.warehouses'],
            'credits' => ['admin.invoices.transfers.credits', 'admin.transfers.credits', 'auth.admin.transfers.credits'],
            'settings' => ['admin.invoices.transfers.settings', 'admin.transfers.settings', 'auth.admin.transfers.settings'],
        ];

        foreach ($adminModuleFallbacks as $targetKey => $fallbackPaths) {
            $targetPath = "admin.{$targetKey}";

            if (data_get($translations, $targetPath) !== null) {
                continue;
            }

            foreach ((array) $fallbackPaths as $fallbackPath) {
                $fallbackValue = data_get($translations, $fallbackPath);

                if ($fallbackValue !== null) {
                    data_set($translations, $targetPath, $fallbackValue);

                    break;
                }
            }
        }

        return $translations;
    }
}

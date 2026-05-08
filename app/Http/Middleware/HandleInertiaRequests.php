<?php

namespace App\Http\Middleware;

use App\Services\AdminNotificationService;
use App\Support\CurrencySettings;
use App\Support\Settings;
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
                'app' => Lang::get('app'),
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
                'store' => Settings::get('store', null),
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
}

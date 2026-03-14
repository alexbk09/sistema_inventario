<?php

namespace App\Http\Middleware;

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

        return [
            ...parent::share($request),
            'locale' => app()->getLocale(),
            'translations' => [
                'app' => Lang::get('app'),
            ],
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'type' => $user->type,
                    'roles' => method_exists($user, 'roles') ? $user->roles->map(function ($role) {
                        return [
                            'id' => $role->id,
                            'name' => $role->name,
                        ];
                    }) : [],
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
                'currency' => Settings::get('currency', null),
                'store' => Settings::get('store', null),
                'inventory' => Settings::get('inventory', null),
                'warehouses' => Settings::get('warehouses', null),
                'security' => Settings::get('security', null),
                'qr' => Settings::get('qr', null),
            ],
        ];
    }
}

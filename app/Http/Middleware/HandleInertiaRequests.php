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

        // Notificaciones internas básicas para usuarios autenticados (stock bajo, apartados vencidos)
        $notifications = [
            'low_stock' => [
                'count' => 0,
                'items' => [],
            ],
            'expired_layaways' => [
                'count' => 0,
                'items' => [],
            ],
        ];

        if ($user) {
            $inventorySettings = Settings::get('inventory', [
                'default_min_stock' => 0,
            ]);
            $defaultMinStock = (int) ($inventorySettings['default_min_stock'] ?? 0);

            // Productos con stock bajo
            $lowStockQuery = \App\Models\Product::query()
                ->where(function ($q) {
                    $q->whereNotNull('min_stock')
                      ->whereColumn('stock', '<=', 'min_stock');
                })
                ->orWhere(function ($q) use ($defaultMinStock) {
                    if ($defaultMinStock > 0) {
                        $q->whereNull('min_stock')
                          ->where('stock', '<=', $defaultMinStock);
                    }
                })
                ->orWhere('stock', '<=', 0);

            $notifications['low_stock']['count'] = (int) (clone $lowStockQuery)->count();
            $notifications['low_stock']['items'] = (clone $lowStockQuery)
                ->orderBy('stock')
                ->take(5)
                ->get(['id','name','sku','stock','min_stock']);

            // Apartados vencidos
            $expiredLayawaysQuery = \App\Models\Layaway::whereIn('status', ['active','pending'])
                ->whereNotNull('expires_at')
                ->where('expires_at', '<', now())
                ->with('customer:id,name');

            $notifications['expired_layaways']['count'] = (int) (clone $expiredLayawaysQuery)->count();
            $notifications['expired_layaways']['items'] = (clone $expiredLayawaysQuery)
                ->orderBy('expires_at')
                ->take(5)
                ->get(['id','number','customer_id','expires_at','status']);
        }

        return [
            ...parent::share($request),
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
            'notifications' => $notifications,
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

<?php

namespace App\Services;

use App\Models\AdminNotification;
use App\Models\Layaway;
use App\Models\Product;
use App\Models\User;
use App\Support\Settings;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class AdminNotificationService
{
    /**
     * @var array<int, string>
     */
    protected array $staffRoles = ['admin', 'supervisor', 'cashier', 'warehouse'];

    public function syncSystemNotifications(): void
    {
        $users = $this->staffUsers()->get(['id']);

        if ($users->isEmpty()) {
            return;
        }

        $this->syncLowStockNotifications($users);
        $this->syncExpiredLayawayNotifications($users);
    }

    public function getUnreadForUser(User $user, int $limit = 12): Collection
    {
        return AdminNotification::query()
            ->where('user_id', $user->id)
            ->whereNull('read_at')
            ->latest()
            ->limit($limit)
            ->get();
    }

    public function getUnreadCountForUser(User $user): int
    {
        return (int) AdminNotification::query()
            ->where('user_id', $user->id)
            ->whereNull('read_at')
            ->count();
    }

    public function markAsRead(AdminNotification $notification, User $user): void
    {
        if ((int) $notification->user_id !== (int) $user->id) {
            abort(403);
        }

        if ($notification->read_at === null) {
            $notification->forceFill([
                'read_at' => now(),
            ])->save();
        }
    }

    public function markAllAsRead(User $user): void
    {
        AdminNotification::query()
            ->where('user_id', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }

    public function delete(AdminNotification $notification, User $user): void
    {
        if ((int) $notification->user_id !== (int) $user->id) {
            abort(403);
        }

        $notification->delete();
    }

    public function notifyStaff(string $type, string $title, string $message, array $options = []): void
    {
        $users = $this->staffUsers()->get(['id']);

        if ($users->isEmpty()) {
            return;
        }

        $this->notifyUsers($users, [
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'severity' => $options['severity'] ?? 'info',
            'action_url' => $options['action_url'] ?? null,
            'action_label' => $options['action_label'] ?? null,
            'dedupe_key' => $options['dedupe_key'] ?? null,
            'data' => $options['data'] ?? null,
        ]);
    }

    protected function syncLowStockNotifications(Collection $users): void
    {
        $inventorySettings = Settings::get('inventory', [
            'default_min_stock' => 0,
        ]);

        $defaultMinStock = (int) ($inventorySettings['default_min_stock'] ?? 0);

        $products = Product::query()
            ->where(function (Builder $query) {
                $query->whereNotNull('min_stock')
                    ->whereColumn('stock', '<=', 'min_stock');
            })
            ->orWhere(function (Builder $query) use ($defaultMinStock) {
                if ($defaultMinStock > 0) {
                    $query->whereNull('min_stock')
                        ->where('stock', '<=', $defaultMinStock);
                }
            })
            ->orWhere('stock', '<=', 0)
            ->orderBy('stock')
            ->get(['id', 'name', 'sku', 'stock', 'min_stock']);

        $activeKeys = [];

        foreach ($products as $product) {
            $activeKeys[] = 'low_stock:product:'.$product->id;
            $minStock = $product->min_stock ?? $defaultMinStock;
            $message = 'Stock actual: '.(int) $product->stock;

            if ($minStock !== null && (int) $minStock > 0) {
                $message .= ' / minimo: '.(int) $minStock;
            }

            if (!empty($product->sku)) {
                $message .= ' / SKU: '.$product->sku;
            }

            $this->notifyUsers($users, [
                'type' => 'low_stock',
                'title' => 'Producto con stock bajo: '.$product->name,
                'message' => $message,
                'severity' => (int) $product->stock <= 0 ? 'danger' : 'warning',
                'action_url' => route('admin.products.inventory.index', $product->id),
                'action_label' => 'Revisar inventario',
                'dedupe_key' => 'low_stock:product:'.$product->id,
                'data' => [
                    'product_id' => $product->id,
                    'stock' => (int) $product->stock,
                    'min_stock' => $minStock,
                ],
            ]);
        }

        $this->deleteObsoleteNotifications('low_stock', $activeKeys);
    }

    protected function syncExpiredLayawayNotifications(Collection $users): void
    {
        $layaways = Layaway::query()
            ->whereIn('status', ['active', 'pending'])
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now())
            ->with('customer:id,name')
            ->orderBy('expires_at')
            ->get(['id', 'number', 'customer_id', 'expires_at', 'status']);

        $activeKeys = [];

        foreach ($layaways as $layaway) {
            $activeKeys[] = 'expired_layaway:'.$layaway->id;
            $customerName = $layaway->customer?->name;
            $message = 'Vencio el '.$layaway->expires_at?->format('d/m/Y H:i');

            if ($customerName) {
                $message .= ' / Cliente: '.$customerName;
            }

            $this->notifyUsers($users, [
                'type' => 'expired_layaway',
                'title' => 'Apartado vencido: '.$layaway->number,
                'message' => $message,
                'severity' => 'warning',
                'action_url' => route('admin.layaways.show', $layaway->id),
                'action_label' => 'Gestionar apartado',
                'dedupe_key' => 'expired_layaway:'.$layaway->id,
                'data' => [
                    'layaway_id' => $layaway->id,
                    'expires_at' => $layaway->expires_at?->toIso8601String(),
                ],
            ]);
        }

        $this->deleteObsoleteNotifications('expired_layaway', $activeKeys);
    }

    protected function deleteObsoleteNotifications(string $type, array $activeKeys): void
    {
        $query = AdminNotification::query()->where('type', $type);

        if ($activeKeys === []) {
            $query->delete();

            return;
        }

        $query->whereNotIn('dedupe_key', $activeKeys)->delete();
    }

    protected function notifyUsers(Collection $users, array $payload): void
    {
        foreach ($users as $user) {
            $attributes = [
                'type' => $payload['type'],
                'severity' => $payload['severity'] ?? 'info',
                'title' => $payload['title'],
                'message' => $payload['message'],
                'action_url' => $payload['action_url'] ?? null,
                'action_label' => $payload['action_label'] ?? null,
                'data' => $payload['data'] ?? null,
                'read_at' => null,
            ];

            if (!empty($payload['dedupe_key'])) {
                AdminNotification::updateOrCreate(
                    [
                        'user_id' => $user->id,
                        'dedupe_key' => $payload['dedupe_key'],
                    ],
                    $attributes
                );

                continue;
            }

            AdminNotification::create([
                'user_id' => $user->id,
                'dedupe_key' => null,
                ...$attributes,
            ]);
        }
    }

    protected function staffUsers(): Builder
    {
        return User::query()->where(function (Builder $query) {
            $query->whereIn('type', $this->staffRoles)
                ->orWhereHas('roles', function (Builder $roleQuery) {
                    $roleQuery->whereIn('name', $this->staffRoles);
                });
        });
    }
}
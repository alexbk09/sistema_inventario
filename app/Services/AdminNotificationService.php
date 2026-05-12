<?php

namespace App\Services;

use App\Models\AdminNotification;
use App\Models\CreditMovement;
use App\Models\Invoice;
use App\Models\Layaway;
use App\Models\Product;
use App\Models\Rma;
use App\Models\User;
use App\Support\Settings;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class AdminNotificationService
{
    protected int $stalePendingInvoiceHours = 24;

    protected int $staleRmaHours = 48;

    /**
     * @var array<int, string>
     */
    protected array $availableTypes = [
        'low_stock',
        'expired_layaway',
        'manual_checkout_payment_pending',
        'overdue_credit_charge',
        'stale_pending_invoice',
        'stale_rma',
        'invoice_created',
        'invoice_status_changed',
        'layaway_created',
        'layaway_status_changed',
        'rma_created',
        'rma_status_changed',
        'transfer_created',
        'transfer_status_changed',
        'credit_account_created',
        'credit_movement_created',
    ];

    /**
     * @var array<int, string>
     */
    protected array $staffRoles = ['admin', 'supervisor', 'cashier', 'warehouse'];

    public function availableTypes(): array
    {
        return $this->availableTypes;
    }

    public function formatDocumentAmount(string $label, ?string $currencyCode, ?float $baseAmount, ?array $monetaryTotals = null): string
    {
        $resolvedCurrency = (string) ($currencyCode ?: ($monetaryTotals['original_currency'] ?? 'USD'));
        $resolvedAmount = is_numeric($monetaryTotals['original_amount'] ?? null)
            ? (float) $monetaryTotals['original_amount']
            : (float) ($baseAmount ?? 0);

        return $label.': '.$resolvedCurrency.' '.number_format($resolvedAmount, 2);
    }

    public function updatePreferences(User $user, array $channelMutedTypes): void
    {
        $preferences = is_array($user->notification_preferences) ? $user->notification_preferences : [];
        unset($preferences['muted_types']);
        $bellMutedTypes = array_values(array_intersect($this->availableTypes(), $channelMutedTypes['bell'] ?? []));
        $historyMutedTypes = array_values(array_intersect($this->availableTypes(), $channelMutedTypes['history'] ?? []));

        $user->forceFill([
            'notification_preferences' => [
                ...$preferences,
                'channels' => [
                    ...($preferences['channels'] ?? []),
                    'bell' => [
                        'muted_types' => $bellMutedTypes,
                    ],
                    'history' => [
                        'muted_types' => $historyMutedTypes,
                    ],
                ],
            ],
        ])->save();
    }

    public function syncSystemNotifications(): void
    {
        $users = $this->staffUsers()->get(['id', 'notification_preferences']);

        if ($users->isEmpty()) {
            return;
        }

        $this->syncLowStockNotifications($users);
        $this->syncExpiredLayawayNotifications($users);
        $this->syncManualCheckoutPaymentNotifications($users);
        $this->syncOverdueCreditNotifications($users);
        $this->syncStalePendingInvoiceNotifications($users);
        $this->syncStaleRmaNotifications($users);
    }

    public function getUnreadForUser(User $user, int $limit = 12): Collection
    {
        $mutedTypes = $user->mutedNotificationTypes('bell');

        return AdminNotification::query()
            ->where('user_id', $user->id)
            ->whereNull('read_at')
            ->when($mutedTypes !== [], fn (Builder $query) => $query->whereNotIn('type', $mutedTypes))
            ->orderByRaw("CASE severity WHEN 'danger' THEN 1 WHEN 'warning' THEN 2 WHEN 'success' THEN 3 ELSE 4 END")
            ->latest('created_at')
            ->limit($limit)
            ->get();
    }

    public function getUnreadCountForUser(User $user): int
    {
        $mutedTypes = $user->mutedNotificationTypes('bell');

        return (int) AdminNotification::query()
            ->where('user_id', $user->id)
            ->whereNull('read_at')
            ->when($mutedTypes !== [], fn (Builder $query) => $query->whereNotIn('type', $mutedTypes))
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

    public function markSelectedAsRead(User $user, array $notificationIds): void
    {
        AdminNotification::query()
            ->where('user_id', $user->id)
            ->whereIn('id', $notificationIds)
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

    public function deleteSelected(User $user, array $notificationIds): void
    {
        AdminNotification::query()
            ->where('user_id', $user->id)
            ->whereIn('id', $notificationIds)
            ->delete();
    }

    public function notifyStaff(string $type, string $title, string $message, array $options = []): void
    {
        $users = $this->staffUsers()->get(['id', 'notification_preferences']);

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
                    'product_name' => $product->name,
                    'sku' => $product->sku,
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

    protected function syncManualCheckoutPaymentNotifications(Collection $users): void
    {
        $invoices = Invoice::query()
            ->where('status', 'pending')
            ->whereHas('contact', function (Builder $query) {
                $query->where('payment_method', 'manual');
            })
            ->with(['contact:id,invoice_id,full_name,reference,payment_method,payment_date', 'customer:id,name'])
            ->latest()
            ->get(['id', 'number', 'customer_id', 'status', 'total_usd', 'currency_code', 'monetary_totals_json', 'created_at']);

        $activeKeys = [];

        foreach ($invoices as $invoice) {
            $activeKeys[] = 'manual_checkout_payment_pending:invoice:'.$invoice->id;
            $customerName = $invoice->customer?->name ?: $invoice->contact?->full_name;
            $reference = $invoice->contact?->reference;

            $message = 'Factura pendiente por pago manual / '.$this->formatDocumentAmount(
                'Total',
                $invoice->currency_code,
                $invoice->total_usd,
                is_array($invoice->monetary_totals_json) ? $invoice->monetary_totals_json : null,
            );

            if ($customerName) {
                $message .= ' / Cliente: '.$customerName;
            }

            if ($reference && $reference !== 'N/A') {
                $message .= ' / Ref: '.$reference;
            }

            $this->notifyUsers($users, [
                'type' => 'manual_checkout_payment_pending',
                'title' => 'Validar pago manual: '.$invoice->number,
                'message' => $message,
                'severity' => 'warning',
                'action_url' => route('admin.invoices.index'),
                'action_label' => 'Revisar facturas',
                'dedupe_key' => 'manual_checkout_payment_pending:invoice:'.$invoice->id,
                'data' => [
                    'invoice_id' => $invoice->id,
                    'invoice_number' => $invoice->number,
                    'payment_method' => 'manual',
                ],
            ]);
        }

        $this->deleteObsoleteNotifications('manual_checkout_payment_pending', $activeKeys);
    }

    protected function syncOverdueCreditNotifications(Collection $users): void
    {
        $today = now()->toDateString();

        $movements = CreditMovement::query()
            ->where('type', 'charge')
            ->whereNotNull('due_date')
            ->whereDate('due_date', '<', $today)
            ->whereNull('paid_at')
            ->with(['account.customer:id,name,email'])
            ->orderBy('due_date')
            ->get(['id', 'credit_account_id', 'amount_usd', 'amount_original', 'currency_code', 'description', 'due_date']);

        $activeKeys = [];

        foreach ($movements as $movement) {
            $activeKeys[] = 'overdue_credit_charge:movement:'.$movement->id;
            $customerName = $movement->account?->customer?->name;
            $message = 'Monto: '.($movement->currency_code ?: 'USD').' '.number_format((float) ($movement->amount_original ?? $movement->amount_usd), 2)
                .' / Vencimiento: '.$movement->due_date?->format('d/m/Y');

            if ($customerName) {
                $message .= ' / Cliente: '.$customerName;
            }

            if (!empty($movement->description)) {
                $message .= ' / '.$movement->description;
            }

            $this->notifyUsers($users, [
                'type' => 'overdue_credit_charge',
                'title' => 'Cargo de credito vencido',
                'message' => $message,
                'severity' => 'danger',
                'action_url' => route('admin.credits.show', $movement->credit_account_id),
                'action_label' => 'Gestionar credito',
                'dedupe_key' => 'overdue_credit_charge:movement:'.$movement->id,
                'data' => [
                    'credit_movement_id' => $movement->id,
                    'credit_account_id' => $movement->credit_account_id,
                    'due_date' => $movement->due_date?->toIso8601String(),
                ],
            ]);
        }

        $this->deleteObsoleteNotifications('overdue_credit_charge', $activeKeys);
    }

    protected function syncStalePendingInvoiceNotifications(Collection $users): void
    {
        $threshold = now()->subHours($this->stalePendingInvoiceHours);

        $invoices = Invoice::query()
            ->where('status', 'pending')
            ->where('created_at', '<=', $threshold)
            ->with(['customer:id,name', 'contact:id,invoice_id,full_name,payment_method'])
            ->orderBy('created_at')
            ->get(['id', 'number', 'customer_id', 'total_usd', 'currency_code', 'monetary_totals_json', 'created_at', 'status']);

        $activeKeys = [];

        foreach ($invoices as $invoice) {
            $activeKeys[] = 'stale_pending_invoice:invoice:'.$invoice->id;
            $customerName = $invoice->customer?->name ?: $invoice->contact?->full_name;
            $paymentMethod = $invoice->contact?->payment_method;
            $message = 'Pendiente desde '.$invoice->created_at?->format('d/m/Y H:i')
                .' / '.$this->formatDocumentAmount(
                    'Total',
                    $invoice->currency_code,
                    $invoice->total_usd,
                    is_array($invoice->monetary_totals_json) ? $invoice->monetary_totals_json : null,
                );

            if ($customerName) {
                $message .= ' / Cliente: '.$customerName;
            }

            if ($paymentMethod) {
                $message .= ' / Metodo: '.$paymentMethod;
            }

            $this->notifyUsers($users, [
                'type' => 'stale_pending_invoice',
                'title' => 'Factura pendiente sin confirmar: '.$invoice->number,
                'message' => $message,
                'severity' => 'warning',
                'action_url' => route('admin.invoices.index'),
                'action_label' => 'Revisar facturas',
                'dedupe_key' => 'stale_pending_invoice:invoice:'.$invoice->id,
                'data' => [
                    'invoice_id' => $invoice->id,
                    'invoice_number' => $invoice->number,
                    'created_at' => $invoice->created_at?->toIso8601String(),
                ],
            ]);
        }

        $this->deleteObsoleteNotifications('stale_pending_invoice', $activeKeys);
    }

    protected function syncStaleRmaNotifications(Collection $users): void
    {
        $threshold = now()->subHours($this->staleRmaHours);

        $rmas = Rma::query()
            ->whereIn('status', ['pending', 'approved'])
            ->where('created_at', '<=', $threshold)
            ->with(['customer:id,name'])
            ->orderBy('created_at')
            ->get(['id', 'number', 'customer_id', 'status', 'created_at']);

        $activeKeys = [];

        foreach ($rmas as $rma) {
            $activeKeys[] = 'stale_rma:rma:'.$rma->id;
            $message = 'Abierto desde '.$rma->created_at?->format('d/m/Y H:i')
                .' / Estado: '.$rma->status;

            if ($rma->customer?->name) {
                $message .= ' / Cliente: '.$rma->customer->name;
            }

            $this->notifyUsers($users, [
                'type' => 'stale_rma',
                'title' => 'RMA sin resolver: '.$rma->number,
                'message' => $message,
                'severity' => $rma->status === 'approved' ? 'warning' : 'danger',
                'action_url' => route('admin.rmas.show', $rma->id),
                'action_label' => 'Revisar RMA',
                'dedupe_key' => 'stale_rma:rma:'.$rma->id,
                'data' => [
                    'rma_id' => $rma->id,
                    'status' => $rma->status,
                    'created_at' => $rma->created_at?->toIso8601String(),
                ],
            ]);
        }

        $this->deleteObsoleteNotifications('stale_rma', $activeKeys);
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
            ];

            if (!empty($payload['dedupe_key'])) {
                $notification = AdminNotification::firstOrNew([
                    'user_id' => $user->id,
                    'dedupe_key' => $payload['dedupe_key'],
                ]);

                $shouldReopenUnread = !$notification->exists || $this->notificationPayloadChanged($notification, $attributes);

                $notification->fill($attributes);

                if ($shouldReopenUnread) {
                    $notification->read_at = null;
                }

                $notification->save();

                continue;
            }

            AdminNotification::create([
                'user_id' => $user->id,
                'dedupe_key' => null,
                'read_at' => null,
                ...$attributes,
            ]);
        }
    }

    protected function notificationPayloadChanged(AdminNotification $notification, array $attributes): bool
    {
        return $notification->type !== $attributes['type']
            || $notification->severity !== $attributes['severity']
            || $notification->title !== $attributes['title']
            || $notification->message !== $attributes['message']
            || $notification->action_url !== $attributes['action_url']
            || $notification->action_label !== $attributes['action_label']
            || $notification->data != $attributes['data'];
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
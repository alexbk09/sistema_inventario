<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StockTransfer extends Model
{
    use HasFactory;

    const STATUS_DRAFT = 'draft';
    const STATUS_SENT = 'sent';
    const STATUS_IN_TRANSIT = 'in_transit';
    const STATUS_RECEIVED = 'received';
    const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'number',
        'from_warehouse_id',
        'to_warehouse_id',
        'status',
        'notes',
        'user_id',
        'sent_at',
        'received_at',
        'qr_code',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
        'received_at' => 'datetime',
    ];

    public function fromWarehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'from_warehouse_id');
    }

    public function toWarehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'to_warehouse_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(StockTransferItem::class);
    }

    public function getStatusLabelAttribute(): string
    {
        return match($this->status) {
            self::STATUS_DRAFT => 'Borrador',
            self::STATUS_SENT => 'Enviado',
            self::STATUS_IN_TRANSIT => 'En tránsito',
            self::STATUS_RECEIVED => 'Recibido',
            self::STATUS_CANCELLED => 'Cancelado',
            default => 'Desconocido',
        };
    }

    public function getStatusColorAttribute(): string
    {
        return match($this->status) {
            self::STATUS_DRAFT => 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
            self::STATUS_SENT => 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            self::STATUS_IN_TRANSIT => 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
            self::STATUS_RECEIVED => 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
            self::STATUS_CANCELLED => 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            default => 'bg-gray-100 text-gray-700',
        };
    }

    public function canTransitionTo(string $newStatus): bool
    {
        $validTransitions = [
            self::STATUS_DRAFT => [self::STATUS_SENT, self::STATUS_CANCELLED],
            self::STATUS_SENT => [self::STATUS_IN_TRANSIT, self::STATUS_CANCELLED],
            self::STATUS_IN_TRANSIT => [self::STATUS_RECEIVED, self::STATUS_CANCELLED],
            self::STATUS_RECEIVED => [],
            self::STATUS_CANCELLED => [],
        ];

        return in_array($newStatus, $validTransitions[$this->status] ?? []);
    }
}

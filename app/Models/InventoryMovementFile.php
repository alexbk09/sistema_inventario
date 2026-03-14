<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryMovementFile extends Model
{
    use HasFactory;

    protected $fillable = [
        'inventory_movement_id',
        'path',
        'original_name',
        'mime_type',
        'size',
        'uploaded_by',
    ];

    public function movement(): BelongsTo
    {
        return $this->belongsTo(InventoryMovement::class, 'inventory_movement_id');
    }
}

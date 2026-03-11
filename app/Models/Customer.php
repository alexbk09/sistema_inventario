<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'identification_type_id', 'identification', 'name', 'phone', 'email', 'address',
        'loyalty_points', 'lifetime_spent_usd', 'last_purchase_at',
    ];

    public function identificationType()
    {
        return $this->belongsTo(IdentificationType::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }
}

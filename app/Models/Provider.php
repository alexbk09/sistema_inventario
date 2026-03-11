<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Provider extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'contact_name', 'phone', 'email', 'address'
    ];

    public function accountsPayable(): HasMany
    {
        return $this->hasMany(AccountsPayable::class);
    }
}

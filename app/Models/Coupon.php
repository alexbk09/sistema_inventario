<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Coupon extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'type',
        'value',
        'active',
        'uses',
        'max_uses',
        'min_amount_usd',
        'valid_from',
        'valid_until',
    ];

    protected $casts = [
        'active' => 'bool',
        'uses' => 'int',
        'max_uses' => 'int',
        'min_amount_usd' => 'float',
        'value' => 'float',
        'valid_from' => 'datetime',
        'valid_until' => 'datetime',
    ];
}

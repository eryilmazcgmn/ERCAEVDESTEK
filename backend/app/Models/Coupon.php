<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Coupon extends Model
{
    protected $fillable = [
        'code',
        'type',
        'value',
        'min_order_amount',
        'max_uses',
        'used_count',
        'is_active',
        'expires_at',
    ];

    protected $casts = [
        'value' => 'float',
        'min_order_amount' => 'float',
        'is_active' => 'boolean',
        'expires_at' => 'datetime',
    ];
}

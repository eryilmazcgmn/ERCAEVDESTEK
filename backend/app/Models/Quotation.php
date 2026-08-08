<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Quotation extends Model
{
    protected $fillable = [
        'customer_id',
        'conversation_id',
        'service_type',
        'details',
        'price_details',
        'pdf_path',
        'status',
        'photos',
        'preferred_date',
        'time_slot',
        'coupon_code',
        'discount_amount',
    ];

    protected $casts = [
        'details' => 'array',
        'price_details' => 'array',
        'photos' => 'array',
        'preferred_date' => 'date',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function workOrder(): HasOne
    {
        return $this->hasOne(WorkOrder::class);
    }
}


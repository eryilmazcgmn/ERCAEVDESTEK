<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkOrder extends Model
{
    protected $fillable = [
        'quotation_id',
        'customer_id',
        'technician_id',
        'scheduled_at',
        'technician_name',
        'status',
        'pdf_path',
        'completion_notes',
        'completion_photo',
        'customer_address',
        'customer_phone',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function quotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class);
    }

    public function technician(): BelongsTo
    {
        return $this->belongsTo(User::class, 'technician_id');
    }
}


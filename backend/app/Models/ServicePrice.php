<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServicePrice extends Model
{
    protected $fillable = [
        'service_type',
        'question_id',
        'question_type',
        'option_value',
        'label',
        'price',
    ];
}

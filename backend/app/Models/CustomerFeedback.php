<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerFeedback extends Model
{
    protected $table = 'customer_feedbacks';

    protected $fillable = [
        'customer_id',
        'work_order_id',
        'rating',
        'comment',
    ];
}

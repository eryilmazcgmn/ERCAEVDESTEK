<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UploadedFile extends Model
{
    protected $fillable = [
        'customer_id',
        'conversation_id',
        'file_path',
        'file_type',
        'mime_type',
        'file_size',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    /**
     * Generate the full public URL for this uploaded file.
     * Relies on storage:link symlink being configured.
     */
    public function getUrlAttribute(): string
    {
        $safeName = rawurlencode(basename($this->file_path));
        return url('storage/uploads/' . $safeName);
    }
}


<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class UpdateWorkOrderStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => 'required|string|in:pending,deposit_pending,deposit_declared,deposit_paid,scheduled,in_progress,completed,cancelled',
            'completion_notes' => 'nullable|string|max:1000',
            'completion_photo' => 'nullable|string|max:255'
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'status' => false,
            'message' => 'Geçersiz durum bilgisi.',
            'data' => null,
            'errors' => $validator->errors()
        ], 422));
    }
}

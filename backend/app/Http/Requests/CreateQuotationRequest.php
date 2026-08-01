<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class CreateQuotationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'service_type' => 'required|string|in:tv-mount,paint,plumbing,electric',
            'details' => 'nullable|array',
            'items' => 'nullable|array',
            'total_amount' => 'nullable|numeric'
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'status' => false,
            'message' => 'Teklif verileri geçersiz.',
            'data' => null,
            'errors' => $validator->errors()
        ], 422));
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class BulkUpdateServicePricesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'prices' => 'required|array',
            'prices.*.id' => 'required|integer',
            'prices.*.price' => 'required|numeric|min:0',
            'prices.*.label' => 'nullable|string|max:255'
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'status' => false,
            'message' => 'Fiyat verileri geçersiz.',
            'data' => null,
            'errors' => $validator->errors()
        ], 422));
    }
}

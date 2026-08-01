<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class AssignTechnicianRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (empty($this->scheduled_at)) {
            $this->merge(['scheduled_at' => null]);
        }
    }

    public function rules(): array
    {
        return [
            'technician_id' => 'required|integer|exists:users,id',
            'scheduled_at' => 'nullable|date_format:Y-m-d H:i:s,Y-m-d\TH:i'
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'status' => false,
            'message' => 'Lütfen geçerli bir teknisyen ve randevu tarihi seçin.',
            'data' => null,
            'errors' => $validator->errors()
        ], 422));
    }
}

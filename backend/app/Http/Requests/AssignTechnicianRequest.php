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
        $scheduledAt = $this->scheduled_at;
        if (empty($scheduledAt)) {
            $this->merge(['scheduled_at' => null]);
        } else {
            $formatted = str_replace('T', ' ', (string) $scheduledAt);
            if (strlen($formatted) === 16) {
                $formatted .= ':00';
            }
            $this->merge(['scheduled_at' => $formatted]);
        }
    }

    public function rules(): array
    {
        return [
            'technician_id' => 'required|integer|exists:users,id',
            'scheduled_at' => 'nullable|string'
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

<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\StartSessionRequest;
use App\Http\Requests\UpdateContactRequest;
use App\Services\CustomerService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Exception;

class SessionController extends Controller
{
    protected CustomerService $customerService;

    public function __construct(CustomerService $customerService)
    {
        $this->customerService = $customerService;
    }

    /**
     * Start a new customer support session.
     */
    public function start(StartSessionRequest $request): JsonResponse
    {
        try {
            $result = $this->customerService->startSession($request->validated());

            return response()->json([
                'status' => true,
                'message' => 'Oturum başarıyla başlatıldı.',
                'data' => [
                    'session_id' => $result['session_id'],
                    'token' => $result['token'],
                ],
                'errors' => null
            ], 200);
        } catch (Exception $e) {
            Log::error('Failed to start session: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Oturum başlatılırken bir hata oluştu.',
                'data' => null,
                'errors' => ['server' => [$e->getMessage()]]
            ], 500);
        }
    }

    /**
     * Update customer contact and address info for a session.
     */
    public function updateContact(UpdateContactRequest $request, string $sessionId): JsonResponse
    {
        $jwtUser = $request->input('jwt_user');
        if (($jwtUser['role'] ?? '') !== 'admin') {
            if (($jwtUser['session_id'] ?? '') !== $sessionId) {
                return response()->json([
                    'status' => false,
                    'message' => 'Bu oturuma erişim yetkiniz yok.',
                    'data' => null,
                    'errors' => null
                ], 403);
            }
        }

        try {
            $customer = $this->customerService->updateContactInfo($sessionId, $request->validated());

            return response()->json([
                'status' => true,
                'message' => 'İletişim bilgileri başarıyla güncellendi.',
                'data' => $customer,
                'errors' => null
            ], 200);
        } catch (Exception $e) {
            Log::error('Failed to update contact: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'İletişim bilgileri güncellenirken bir hata oluştu.',
                'data' => null,
                'errors' => ['server' => [$e->getMessage()]]
            ], 500);
        }
    }

    /**
     * Upload photos or documents for the session.
     */
    public function upload(Request $request, string $sessionId): JsonResponse
    {
        $jwtUser = $request->input('jwt_user');
        if (($jwtUser['role'] ?? '') !== 'admin') {
            if (($jwtUser['session_id'] ?? '') !== $sessionId) {
                return response()->json([
                    'status' => false,
                    'message' => 'Bu oturuma erişim yetkiniz yok.',
                    'data' => null,
                    'errors' => null
                ], 403);
            }
        }

        $request->validate([
            'file' => 'required|file|max:5120|mimetypes:image/jpeg,image/png,image/webp,application/pdf',
        ]);

        try {
            $file = $request->file('file');
            $uploadedFile = $this->customerService->uploadSessionFile($sessionId, $file);

            return response()->json([
                'status' => true,
                'message' => 'Fotoğraf başarıyla yüklendi.',
                'data' => [
                    'file_id' => $uploadedFile->id,
                    'file_path' => asset($uploadedFile->file_path),
                    'file_type' => $uploadedFile->file_type,
                ],
                'errors' => null
            ], 201);
        } catch (Exception $e) {
            Log::error('Upload processing failed: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Fotoğraf yüklenirken hata oluştu: ' . $e->getMessage(),
                'data' => null,
                'errors' => ['upload' => [$e->getMessage()]]
            ], 500);
        }
    }

    /**
     * Declare that the customer paid the deposit via Havale/EFT.
     */
    public function declareDeposit(Request $request, string $sessionId): JsonResponse
    {
        $jwtUser = $request->input('jwt_user');
        if (($jwtUser['role'] ?? '') !== 'admin') {
            if (($jwtUser['session_id'] ?? '') !== $sessionId) {
                return response()->json([
                    'status' => false,
                    'message' => 'Bu oturuma erişim yetkiniz yok.',
                    'data' => null,
                    'errors' => null
                ], 403);
            }
        }

        try {
            $conversation = \App\Models\Conversation::where('session_id', $sessionId)->first();

            if (!$conversation) {
                return response()->json([
                    'status' => false,
                    'message' => 'Oturum bulunamadı.',
                    'data' => null,
                    'errors' => null
                ], 404);
            }

            $quotationIds = \App\Models\Quotation::where('conversation_id', $conversation->id)->pluck('id');
            $workOrder = \App\Models\WorkOrder::whereIn('quotation_id', $quotationIds)
                ->whereIn('status', ['deposit_pending', 'pending'])
                ->first();

            if (!$workOrder) {
                return response()->json([
                    'status' => false,
                    'message' => 'Ödeme bildirimi yapılabilecek bekleyen bir iş emri bulunamadı.',
                    'data' => null,
                    'errors' => null
                ], 404);
            }

            $workOrder->update(['status' => 'deposit_declared']);

            return response()->json([
                'status' => true,
                'message' => 'Havale/EFT bildirimi başarıyla alındı. Ekibimiz ödemeyi onayladıktan sonra usta yönlendirilecektir.',
                'data' => $workOrder,
                'errors' => null
            ], 200);
        } catch (Exception $e) {
            Log::error('Failed to declare deposit: ' . $e->getMessage());
            return response()->json([
                'status' => false,
                'message' => 'Ödeme bildirimi kaydedilirken bir hata oluştu.',
                'data' => null,
                'errors' => ['server' => [$e->getMessage()]]
            ], 500);
        }
    }
}

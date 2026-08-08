<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\CreateQuotationRequest;
use App\Services\QuotationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Exception;

class QuotationController extends Controller
{
    protected QuotationService $quotationService;

    public function __construct(QuotationService $quotationService)
    {
        $this->quotationService = $quotationService;
    }

    /**
     * Calculate price proposal on backend without persisting (for frontend preview).
     */
    public function calculatePrice(Request $request): JsonResponse
    {
        try {
            $serviceType = (string) $request->input('service_type', 'tv-mount');
            $details = (array) $request->input('details', []);

            $breakdown = $this->quotationService->calculatePrice($serviceType, $details);

            return response()->json([
                'status' => true,
                'message' => 'Fiyat hesaplandı.',
                'data' => $breakdown,
                'errors' => null
            ], 200);
        } catch (Exception $e) {
            Log::error('Failed to calculate price', ['exception' => $e]);
            return response()->json([
                'status' => false,
                'message' => 'Fiyat hesaplanırken bir hata oluştu.',
                'data' => null,
                'errors' => ['calculation' => ['Fiyat hesaplanamadı. Lütfen tekrar deneyin.']]
            ], 400);
        }
    }

    /**
     * Create quotation proposal and generate PDF.
     */
    public function create(CreateQuotationRequest $request, string $sessionId): JsonResponse
    {
        try {
            $serviceType = $request->input('service_type');
            $formDetails = $request->input('details', []);

            $quotation = $this->quotationService->createQuotation($sessionId, $serviceType, $formDetails);

            return response()->json([
                'status' => true,
                'message' => 'Teklif başarıyla oluşturuldu.',
                'data' => [
                    'quotation_id' => $quotation->id,
                    'pdf_url' => asset($quotation->pdf_path),
                    'service_type' => $quotation->service_type,
                    'price_details' => $quotation->price_details,
                    'total_amount' => $quotation->price_details['total'] ?? 0,
                    'created_at' => $quotation->created_at,
                ],
                'errors' => null
            ], 201);
        } catch (Exception $e) {
            Log::error('Failed to create quotation', ['exception' => $e, 'session_id' => $sessionId]);
            return response()->json([
                'status' => false,
                'message' => 'Teklif oluşturulurken bir hata oluştu.',
                'data' => null,
                'errors' => ['quotation' => ['Teklif oluşturulamadı. Lütfen tekrar deneyin.']]
            ], 500);
        }
    }

    /**
     * Approve quotation and create work order PDF.
     */
    public function approve(Request $request, int $quotationId): JsonResponse
    {
        try {
            $result = $this->quotationService->approveQuotation($quotationId);

            return response()->json([
                'status' => true,
                'message' => 'Teklif onaylandı ve iş emri oluşturuldu.',
                'data' => [
                    'id' => $result['workOrder']->id,
                    'work_order_id' => $result['workOrder']->id,
                    'quotation_id' => $result['quotation']->id,
                    'work_order_pdf_url' => asset($result['workOrder']->pdf_path),
                    'status' => $result['workOrder']->status,
                ],
                'errors' => null
            ], 200);
        } catch (Exception $e) {
            Log::error('Failed to approve quotation', ['exception' => $e, 'quotation_id' => $quotationId]);
            return response()->json([
                'status' => false,
                'message' => 'Teklif onaylanırken bir hata oluştu.',
                'data' => null,
                'errors' => ['approval' => ['Teklif onaylanamadı. Lütfen tekrar deneyin.']]
            ], 500);
        }
    }

    /**
     * Get live tracking information for customer (by session ID).
     */
    public function trackingInfo(string $sessionId): JsonResponse
    {
        try {
            $data = $this->quotationService->getTrackingInfo($sessionId);

            return response()->json([
                'status' => true,
                'message' => 'Takip bilgileri getirildi.',
                'data' => $data,
                'errors' => null
            ], 200);
        } catch (Exception $e) {
            Log::error('Failed to get tracking info', ['exception' => $e, 'session_id' => $sessionId]);
            return response()->json([
                'status' => false,
                'message' => 'Takip bilgisi bulunamadı veya oturum geçersiz.',
                'data' => null,
                'errors' => ['tracking' => ['Takip bilgisi alınamadı.']]
            ], 404);
        }
    }

    /**
     * Get live tracking information for customer (by phone number).
     */
    public function trackingByPhone(string $phone): JsonResponse
    {
        try {
            $data = $this->quotationService->getTrackingInfoByPhone($phone);

            return response()->json([
                'status' => true,
                'message' => 'Telefon numarasına ait sipariş bulundu.',
                'data' => $data,
                'errors' => null
            ], 200);
        } catch (Exception $e) {
            Log::error('Failed to get tracking info by phone', ['exception' => $e, 'phone' => $phone]);
            return response()->json([
                'status' => false,
                'message' => 'Bu telefon numarasına ait sipariş bulunamadı.',
                'data' => null,
                'errors' => ['tracking' => ['Takip bilgisi alınamadı.']]
            ], 404);
        }
    }

    /**
     * Get live tracking info by order code (WO-XXXX or ID).
     */
    public function trackingByCode(string $code): JsonResponse
    {
        try {
            $data = $this->quotationService->getTrackingInfoByCode($code);

            return response()->json([
                'status' => true,
                'message' => 'Sipariş detayları getirildi.',
                'data' => $data,
                'errors' => null
            ], 200);
        } catch (Exception $e) {
            Log::error('Failed to get tracking info by code', ['exception' => $e, 'code' => $code]);
            return response()->json([
                'status' => false,
                'message' => 'Belirtilen koda ait sipariş bulunamadı.',
                'data' => null,
                'errors' => ['tracking' => ['Sipariş bulunamadı.']]
            ], 404);
        }
    }
}

<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\AssignTechnicianRequest;
use App\Http\Requests\BulkUpdateServicePricesRequest;
use App\Http\Requests\CreateTechnicianRequest;
use App\Http\Requests\UpdateWorkOrderStatusRequest;
use App\Services\CustomerService;
use App\Services\WorkOrderService;
use App\Services\SettingService;
use App\Models\Customer;
use App\Models\WorkOrder;
use App\Models\Quotation;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\File;
use Barryvdh\DomPDF\Facade\Pdf;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;
use Illuminate\Support\Facades\Log;
use App\Models\Service;
use App\Services\Auth\JwtService;
use Exception;

class AdminController extends Controller
{
    protected WorkOrderService $workOrderService;
    protected CustomerService $customerService;
    protected JwtService $jwtService;

    public function __construct(WorkOrderService $workOrderService, CustomerService $customerService, JwtService $jwtService)
    {
        $this->workOrderService = $workOrderService;
        $this->customerService = $customerService;
        $this->jwtService = $jwtService;
    }

    /**
     * Get CRM dashboard stats.
     */
    public function dashboardStats(): JsonResponse
    {
        try {
            $stats = $this->workOrderService->getDashboardStats();
            return response()->json([
                'status' => true,
                'message' => 'İstatistikler başarıyla alındı.',
                'data' => $stats,
                'errors' => null
            ], 200);
        } catch (Exception $e) {
            Log::error('Admin dashboardStats error', ['exception' => $e]);
            return response()->json([
                'status' => false,
                'message' => 'İstatistikler yüklenirken hata oluştu.',
                'data' => null,
                'errors' => ['server' => ['Sunucu hatası. Lütfen tekrar deneyin.']]
            ], 500);
        }
    }

    /**
     * Get all customers list for CRM.
     */
    public function customers(): JsonResponse
    {
        try {
            $customers = $this->customerService->getCustomersForAdmin();
            return response()->json([
                'status' => true,
                'message' => 'Müşteriler getirildi.',
                'data' => $customers,
                'errors' => null
            ], 200);
        } catch (Exception $e) {
            Log::error('Admin customers list error', ['exception' => $e]);
            return response()->json([
                'status' => false,
                'message' => 'Müşteriler alınırken hata oluştu.',
                'data' => null,
                'errors' => ['server' => ['Sunucu hatası. Lütfen tekrar deneyin.']]
            ], 500);
        }
    }

    /**
     * Get all quotations.
     */
    public function quotations(Request $request): JsonResponse
    {
        try {
            $query = Quotation::with('customer')->orderBy('created_at', 'desc');
            $perPage = (int) min(max(1, (int) $request->input('per_page', 50)), 200);
            
            if ($request->boolean('all')) {
                $quotations = $query->get();
                return response()->json([
                    'status' => true,
                    'message' => 'Teklifler getirildi.',
                    'data' => $quotations,
                    'errors' => null
                ], 200);
            } else {
                $quotations = $query->paginate(max(1, min(100, $perPage)));
                return response()->json([
                    'status' => true,
                    'message' => 'Teklifler getirildi.',
                    'data' => $quotations->items(),
                    'meta' => [
                        'current_page' => $quotations->currentPage(),
                        'last_page' => $quotations->lastPage(),
                        'per_page' => $quotations->perPage(),
                        'total' => $quotations->total(),
                    ],
                    'errors' => null
                ], 200);
            }
        } catch (Exception $e) {
            Log::error('Admin quotations list error', ['exception' => $e]);
            return response()->json([
                'status' => false,
                'message' => 'Teklifler yüklenirken hata oluştu.',
                'data' => null,
                'errors' => ['server' => ['Sunucu hatası. Lütfen tekrar deneyin.']]
            ], 500);
        }
    }

    /**
     * Get all work orders.
     */
    public function workOrders(): JsonResponse
    {
        try {
            $workOrders = $this->workOrderService->getWorkOrdersForAdmin();
            return response()->json([
                'status' => true,
                'message' => 'İş emirleri getirildi.',
                'data' => $workOrders,
                'errors' => null
            ], 200);
        } catch (Exception $e) {
            Log::error('Admin workOrders list error', ['exception' => $e]);
            return response()->json([
                'status' => false,
                'message' => 'İş emirleri yüklenirken hata oluştu.',
                'data' => null,
                'errors' => ['server' => ['Sunucu hatası. Lütfen tekrar deneyin.']]
            ], 500);
        }
    }

    /**
     * Update status of work order.
     */
    public function updateWorkOrderStatus(UpdateWorkOrderStatusRequest $request, int $id): JsonResponse
    {
        try {
            $workOrder = $this->workOrderService->updateWorkOrderStatus($id, $request->validated()['status']);
            return response()->json([
                'status' => true,
                'message' => 'İş emri durumu güncellendi.',
                'data' => $workOrder,
                'errors' => null
            ], 200);
        } catch (Exception $e) {
            Log::error('Admin updateWorkOrderStatus error', ['exception' => $e, 'work_order_id' => $id]);
            return response()->json([
                'status' => false,
                'message' => 'İş emri durumu güncellenemedi: ' . $e->getMessage(),
                'data' => null,
                'errors' => ['server' => [$e->getMessage()]]
            ], 400);
        }
    }

    /**
     * Download or stream Work Order PDF. Auto-generates if missing.
     */
    public function downloadWorkOrderPdf(int $id)
    {
        try {
            $workOrder = WorkOrder::with(['customer', 'quotation'])->findOrFail($id);
            $fullPath = null;

            if (!empty($workOrder->pdf_path)) {
                $relative = str_replace('storage/', '', $workOrder->pdf_path);
                $fullPath = storage_path('app/public/' . $relative);
            }

            if (!$fullPath || !file_exists($fullPath)) {
                if ($workOrder->quotation_id) {
                    $res = app(QuotationService::class)->approveQuotation((int)$workOrder->quotation_id);
                    $workOrder = $res['workOrder'] ?? $workOrder;
                } else {
                    $pdfDir = storage_path('app/public/pdf');
                    if (!File::exists($pdfDir)) {
                        File::makeDirectory($pdfDir, 0755, true);
                    }
                    $pdfFileName = 'IS_EMRI_' . $workOrder->id . '_' . time() . '.pdf';
                    $pdfRelativePath = 'storage/pdf/' . $pdfFileName;
                    $pdfFullPath = storage_path('app/public/pdf/' . $pdfFileName);
                    $settings = app(SettingService::class)->getAllSettings();

                    $pdf = Pdf::loadView('pdf.work_order', [
                        'workOrder' => $workOrder,
                        'work_order' => $workOrder,
                        'quotation' => $workOrder->quotation,
                        'customer' => $workOrder->customer,
                        'settings' => $settings,
                    ]);
                    $pdf->save($pdfFullPath);
                    $workOrder->update(['pdf_path' => $pdfRelativePath]);
                    $fullPath = $pdfFullPath;
                }
            }

            if (!empty($workOrder->pdf_path)) {
                $relative = str_replace('storage/', '', $workOrder->pdf_path);
                $fullPath = storage_path('app/public/' . $relative);
            }

            if (!file_exists($fullPath)) {
                return response()->json(['status' => false, 'message' => 'PDF dosyası henüz oluşturulmadı.'], 404);
            }

            return response()->file($fullPath, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="' . basename($fullPath) . '"'
            ]);
        } catch (Exception $e) {
            Log::error('Download WorkOrder PDF error', ['exception' => $e, 'id' => $id]);
            return response()->json(['status' => false, 'message' => 'PDF indirilirken hata oluştu: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Download or stream Quotation PDF. Auto-generates if missing.
     */
    public function downloadQuotationPdf(int $id)
    {
        try {
            $quotation = Quotation::with(['customer', 'conversation'])->findOrFail($id);
            $fullPath = null;

            if (!empty($quotation->pdf_path)) {
                $relative = str_replace('storage/', '', $quotation->pdf_path);
                $fullPath = storage_path('app/public/' . $relative);
            }

            if (!$fullPath || !file_exists($fullPath)) {
                $service = app(QuotationService::class);
                $newQ = $service->createQuotation($quotation->conversation->session_id ?? '', $quotation->service_type, $quotation->details ?? []);
                $quotation = $newQ;
            }

            if (!empty($quotation->pdf_path)) {
                $relative = str_replace('storage/', '', $quotation->pdf_path);
                $fullPath = storage_path('app/public/' . $relative);
            }

            if (!file_exists($fullPath)) {
                return response()->json(['status' => false, 'message' => 'Teklif PDF dosyası bulunamadı.'], 404);
            }

            return response()->file($fullPath, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="' . basename($fullPath) . '"'
            ]);
        } catch (Exception $e) {
            Log::error('Download Quotation PDF error', ['exception' => $e, 'id' => $id]);
            return response()->json(['status' => false, 'message' => 'Teklif PDF indirilirken hata oluştu: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Export customers as CSV.
     */
    public function exportCustomers(): StreamedResponse
    {
        $fileName = 'musteriler_' . date('Y-m-d') . '.csv';

        return response()->streamDownload(function () {
            $handle = fopen('php://output', 'w');
            // UTF-8 BOM for Turkish characters in Excel
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));
            fputcsv($handle, ['ID', 'Ad Soyad', 'Telefon', 'E-posta', 'Adres', 'Durum', 'Kayıt Tarihi']);

            Customer::chunk(100, function ($customers) use ($handle) {
                foreach ($customers as $c) {
                    fputcsv($handle, [
                        $c->id,
                        $c->name,
                        $c->phone,
                        $c->email,
                        $c->address,
                        $c->status,
                        $c->created_at->format('Y-m-d H:i')
                    ]);
                }
            });

            fclose($handle);
        }, $fileName, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
        ]);
    }

    /**
     * Export work orders as CSV.
     */
    public function exportWorkOrders(): StreamedResponse
    {
        $fileName = 'is_emirleri_' . date('Y-m-d') . '.csv';

        return response()->streamDownload(function () {
            $handle = fopen('php://output', 'w');
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));
            fputcsv($handle, ['İş Emri No', 'Müşteri', 'Telefon', 'Teknisyen', 'Randevu Tarihi', 'Durum', 'Oluşturulma Tarihi']);

            WorkOrder::with(['customer', 'technician'])->chunk(100, function ($workOrders) use ($handle) {
                foreach ($workOrders as $wo) {
                    fputcsv($handle, [
                        "WO-{$wo->id}",
                        $wo->customer->name ?? 'Müşteri',
                        $wo->customer->phone ?? '-',
                        $wo->technician_name ?? 'Atanmadı',
                        $wo->scheduled_at ? $wo->scheduled_at->format('Y-m-d H:i') : 'Planlanmadı',
                        $wo->status,
                        $wo->created_at->format('Y-m-d H:i')
                    ]);
                }
            });

            fclose($handle);
        }, $fileName, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
        ]);
    }

    /**
     * Get technicians list.
     */
    public function technicians(): JsonResponse
    {
        try {
            $technicians = $this->workOrderService->getTechnicians();
            return response()->json([
                'status' => true,
                'message' => 'Teknisyenler getirildi.',
                'data' => $technicians,
                'errors' => null
            ], 200);
        } catch (Exception $e) {
            Log::error('Admin technicians list error', ['exception' => $e]);
            return response()->json([
                'status' => false,
                'message' => 'Teknisyenler alınırken hata oluştu.',
                'data' => null,
                'errors' => ['server' => ['Sunucu hatası. Lütfen tekrar deneyin.']]
            ], 500);
        }
    }

    /**
     * Create technician user.
     */
    public function createTechnician(CreateTechnicianRequest $request): JsonResponse
    {
        try {
            $technician = $this->workOrderService->createTechnician($request->validated());
            return response()->json([
                'status' => true,
                'message' => 'Teknisyen hesabı oluşturuldu.',
                'data' => $technician,
                'errors' => null
            ], 201);
        } catch (Exception $e) {
            Log::error('Admin createTechnician error', ['exception' => $e]);
            return response()->json([
                'status' => false,
                'message' => 'Teknisyen hesabı oluşturulamadı.',
                'data' => null,
                'errors' => ['technician' => ['Hesap oluşturma başarısız oldu.']]
            ], 400);
        }
    }

    /**
     * Delete technician.
     */
    public function deleteTechnician(int $id): JsonResponse
    {
        try {
            $this->workOrderService->deleteTechnician($id);
            return response()->json([
                'status' => true,
                'message' => 'Teknisyen silindi.',
                'data' => null,
                'errors' => null
            ], 200);
        } catch (Exception $e) {
            Log::error('Admin deleteTechnician error', ['exception' => $e, 'technician_id' => $id]);
            return response()->json([
                'status' => false,
                'message' => 'Teknisyen silinirken hata oluştu.',
                'data' => null,
                'errors' => ['server' => ['Silme işlemi başarısız.']]
            ], 500);
        }
    }

    /**
     * Assign technician to work order.
     */
    public function assignTechnician(AssignTechnicianRequest $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validated();
            $workOrder = $this->workOrderService->assignTechnician(
                $id,
                (int) $validated['technician_id'],
                $validated['scheduled_at'] ?? null
            );

            return response()->json([
                'status' => true,
                'message' => 'Teknisyen atandı.',
                'data' => $workOrder,
                'errors' => null
            ], 200);
        } catch (Exception $e) {
            Log::error('Admin assignTechnician error', ['exception' => $e, 'work_order_id' => $id]);
            return response()->json([
                'status' => false,
                'message' => 'Teknisyen atanamadı.',
                'data' => null,
                'errors' => ['assign' => ['Atama işlemi başarısız oldu.']]
            ], 500);
        }
    }

    /**
     * Get technician's assigned work orders.
     */
    public function technicianWorkOrders(Request $request): JsonResponse
    {
        try {
            $jwtUser = (array) $request->attributes->get('jwt_user', []);
            $userId = $this->jwtService->extractUserId($jwtUser);

            $workOrders = $this->workOrderService->getTechnicianWorkOrders($userId);

            return response()->json([
                'status' => true,
                'message' => 'Atanan iş emirleri getirildi.',
                'data' => $workOrders,
                'errors' => null
            ], 200);
        } catch (Exception $e) {
            Log::error('Technician work orders list error', ['exception' => $e]);
            return response()->json([
                'status' => false,
                'message' => 'İş emirleri yüklenirken hata oluştu.',
                'data' => null,
                'errors' => ['server' => ['Sunucu hatası. Lütfen tekrar deneyin.']]
            ], 500);
        }
    }

    /**
     * Update status from technician dashboard.
     */
    public function updateTechnicianWorkOrderStatus(UpdateWorkOrderStatusRequest $request, int $id): JsonResponse
    {
        try {
            $jwtUser = (array) $request->attributes->get('jwt_user', []);
            $userId = $this->jwtService->extractUserId($jwtUser);
            $validated = $request->validated();

            $workOrder = $this->workOrderService->updateTechnicianWorkOrderStatus(
                $id,
                $userId,
                $validated['status'],
                $validated['completion_notes'] ?? null,
                $validated['completion_photo'] ?? null
            );

            return response()->json([
                'status' => true,
                'message' => 'İş emri durumu güncellendi.',
                'data' => $workOrder,
                'errors' => null
            ], 200);
        } catch (Exception $e) {
            Log::error('Technician updateWorkOrderStatus error', ['exception' => $e, 'work_order_id' => $id]);
            return response()->json([
                'status' => false,
                'message' => 'İş emri güncellenirken hata oluştu.',
                'data' => null,
                'errors' => ['update' => ['Güncelleme başarısız oldu.']]
            ], 500);
        }
    }

    /**
     * Get service prices list.
     */
    public function getServicePrices(): JsonResponse
    {
        try {
            $prices = $this->workOrderService->getServicePrices();
            return response()->json([
                'status' => true,
                'message' => 'Hizmet fiyatları getirildi.',
                'data' => $prices,
                'errors' => null
            ], 200);
        } catch (Exception $e) {
            Log::error('Admin getServicePrices error', ['exception' => $e]);
            return response()->json([
                'status' => false,
                'message' => 'Hizmet fiyatları yüklenemedi.',
                'data' => null,
                'errors' => ['server' => ['Sunucu hatası. Lütfen tekrar deneyin.']]
            ], 500);
        }
    }

    /**
     * Bulk update service prices.
     */
    public function updateServicePrices(BulkUpdateServicePricesRequest $request): JsonResponse
    {
        try {
            $this->workOrderService->bulkUpdateServicePrices($request->validated()['prices']);
            return response()->json([
                'status' => true,
                'message' => 'Fiyatlar başarıyla güncellendi.',
                'data' => null,
                'errors' => null
            ], 200);
        } catch (Exception $e) {
            Log::error('Admin updateServicePrices error', ['exception' => $e]);
            return response()->json([
                'status' => false,
                'message' => 'Fiyatlar güncellenirken hata oluştu.',
                'data' => null,
                'errors' => ['prices' => ['Fiyat güncelleme işlemi başarısız oldu.']]
            ], 500);
        }
    }

    /**
     * Create a new service price (question option).
     */
    public function createServicePrice(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'service_type' => 'required|string|max:100',
                'question_id' => 'required|string|max:100',
                'question_type' => 'nullable|string|in:radio,select,number,text',
                'option_value' => 'required|string|max:100',
                'label' => 'required|string|max:255',
                'price' => 'nullable|integer|min:0',
                'parent_question_id' => 'nullable|string|max:100',
                'parent_option_value' => 'nullable|string|max:100',
            ]);

            $sp = $this->workOrderService->createServicePrice($validated);

            return response()->json([
                'status' => true,
                'message' => 'Soru seçeneği eklendi.',
                'data' => $sp,
                'errors' => null
            ], 201);
        } catch (Exception $e) {
            Log::error('Admin createServicePrice error', ['exception' => $e]);
            return response()->json([
                'status' => false,
                'message' => 'Soru seçeneği eklenirken hata: ' . $e->getMessage(),
                'data' => null,
                'errors' => ['price' => [$e->getMessage()]]
            ], 400);
        }
    }

    /**
     * Delete a service price item.
     */
    public function deleteServicePrice(int $id): JsonResponse
    {
        try {
            $this->workOrderService->deleteServicePrice($id);
            return response()->json([
                'status' => true,
                'message' => 'Soru seçeneği silindi.',
                'data' => null,
                'errors' => null
            ], 200);
        } catch (Exception $e) {
            Log::error('Admin deleteServicePrice error', ['exception' => $e, 'id' => $id]);
            return response()->json([
                'status' => false,
                'message' => 'Silme işlemi başarısız.',
                'data' => null,
                'errors' => ['server' => ['Silme başarısız.']]
            ], 500);
        }
    }

    /**
     * Reorder questions for a service.
     */
    public function reorderServiceQuestions(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'service_type' => 'required|string|max:100',
                'ordered_question_ids' => 'required|array',
                'ordered_question_ids.*' => 'string|max:100',
            ]);

            $this->workOrderService->reorderQuestions(
                $validated['service_type'],
                $validated['ordered_question_ids']
            );

            return response()->json([
                'status' => true,
                'message' => 'Soru sıralaması güncellendi.',
                'data' => null,
                'errors' => null
            ], 200);
        } catch (Exception $e) {
            Log::error('Admin reorderServiceQuestions error', ['exception' => $e]);
            return response()->json([
                'status' => false,
                'message' => 'Sıralama güncellenirken hata oluştu.',
                'data' => null,
                'errors' => ['reorder' => [$e->getMessage()]]
            ], 500);
        }
    }

    /**
     * Update question title and type for a service.
     */
    public function updateQuestion(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'service_type' => 'required|string|max:100',
                'question_id' => 'required|string|max:100',
                'question_title' => 'required|string|max:255',
                'question_type' => 'required|string|in:radio,select,number,text',
                'parent_question_id' => 'nullable|string|max:100',
                'parent_option_value' => 'nullable|string|max:100',
            ]);

            $this->workOrderService->updateQuestionTitleAndType(
                $validated['service_type'],
                $validated['question_id'],
                $validated['question_title'],
                $validated['question_type'],
                $validated['parent_question_id'] ?? null,
                $validated['parent_option_value'] ?? null
            );

            return response()->json([
                'status' => true,
                'message' => 'Soru başlığı ve türü güncellendi.',
                'data' => null,
                'errors' => null
            ], 200);
        } catch (Exception $e) {
            Log::error('Admin updateQuestion error', ['exception' => $e]);
            return response()->json([
                'status' => false,
                'message' => 'Güncelleme başarısız.',
                'data' => null,
                'errors' => ['question' => [$e->getMessage()]]
            ], 500);
        }
    }

    /**
     * Delete an entire question and its options.
     */
    public function deleteQuestion(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'service_type' => 'required|string|max:100',
                'question_id' => 'required|string|max:100',
            ]);

            $this->workOrderService->deleteWholeQuestion(
                $validated['service_type'],
                $validated['question_id']
            );

            return response()->json([
                'status' => true,
                'message' => 'Soru ve tüm seçenekleri silindi.',
                'data' => null,
                'errors' => null
            ], 200);
        } catch (Exception $e) {
            Log::error('Admin deleteQuestion error', ['exception' => $e]);
            return response()->json([
                'status' => false,
                'message' => 'Soru silinirken hata oluştu.',
                'data' => null,
                'errors' => ['question' => [$e->getMessage()]]
            ], 500);
        }
    }

    /**
     * Reorder options inside a question.
     */
    public function reorderOptions(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'ordered_option_ids' => 'required|array',
                'ordered_option_ids.*' => 'integer',
            ]);

            $this->workOrderService->reorderOptions($validated['ordered_option_ids']);

            return response()->json([
                'status' => true,
                'message' => 'Seçenek sıralaması güncellendi.',
                'data' => null,
                'errors' => null
            ], 200);
        } catch (Exception $e) {
            Log::error('Admin reorderOptions error', ['exception' => $e]);
            return response()->json([
                'status' => false,
                'message' => 'Sıralama güncellenemedi.',
                'data' => null,
                'errors' => ['reorder' => [$e->getMessage()]]
            ], 500);
        }
    }

    // ────────────────────────────────────────────────
    // Service CRUD (Admin Panel)
    // ────────────────────────────────────────────────

    /**
     * Get all services (admin - includes inactive).
     */
    public function getServices(): JsonResponse
    {
        try {
            $services = Service::ordered()->get();
            return response()->json([
                'status' => true,
                'message' => 'Hizmetler getirildi.',
                'data' => $services,
                'errors' => null
            ], 200);
        } catch (Exception $e) {
            Log::error('Admin getServices error', ['exception' => $e]);
            return response()->json([
                'status' => false,
                'message' => 'Hizmetler yüklenirken hata oluştu.',
                'data' => null,
                'errors' => ['server' => ['Sunucu hatası.']]
            ], 500);
        }
    }

    /**
     * Create a new service.
     */
    public function createService(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:100',
                'slug' => 'required|string|max:100|unique:services,slug',
                'description' => 'nullable|string|max:255',
                'icon' => 'nullable|string|max:50',
                'color' => 'nullable|string|max:50',
                'sort_order' => 'nullable|integer',
                'is_active' => 'nullable|boolean',
                'min_price' => 'nullable|integer|min:0',
            ]);

            $service = Service::create($validated);

            return response()->json([
                'status' => true,
                'message' => 'Hizmet başarıyla oluşturuldu.',
                'data' => $service,
                'errors' => null
            ], 201);
        } catch (Exception $e) {
            Log::error('Admin createService error', ['exception' => $e]);
            return response()->json([
                'status' => false,
                'message' => 'Hizmet oluşturulurken hata: ' . $e->getMessage(),
                'data' => null,
                'errors' => ['service' => [$e->getMessage()]]
            ], 400);
        }
    }

    /**
     * Update an existing service.
     */
    public function updateService(Request $request, int $id): JsonResponse
    {
        try {
            $service = Service::findOrFail($id);

            $validated = $request->validate([
                'name' => 'sometimes|string|max:100',
                'slug' => 'sometimes|string|max:100|unique:services,slug,' . $id,
                'description' => 'nullable|string|max:255',
                'icon' => 'nullable|string|max:50',
                'color' => 'nullable|string|max:50',
                'sort_order' => 'nullable|integer',
                'is_active' => 'nullable|boolean',
                'min_price' => 'nullable|integer|min:0',
            ]);

            $service->update($validated);

            return response()->json([
                'status' => true,
                'message' => 'Hizmet başarıyla güncellendi.',
                'data' => $service->fresh(),
                'errors' => null
            ], 200);
        } catch (Exception $e) {
            Log::error('Admin updateService error', ['exception' => $e, 'service_id' => $id]);
            return response()->json([
                'status' => false,
                'message' => 'Hizmet güncellenirken hata: ' . $e->getMessage(),
                'data' => null,
                'errors' => ['service' => [$e->getMessage()]]
            ], 400);
        }
    }

    /**
     * Delete a service.
     */
    public function deleteService(int $id): JsonResponse
    {
        try {
            $service = Service::findOrFail($id);
            $service->delete();

            return response()->json([
                'status' => true,
                'message' => 'Hizmet silindi.',
                'data' => null,
                'errors' => null
            ], 200);
        } catch (Exception $e) {
            Log::error('Admin deleteService error', ['exception' => $e, 'service_id' => $id]);
            return response()->json([
                'status' => false,
                'message' => 'Hizmet silinirken hata oluştu.',
                'data' => null,
                'errors' => ['server' => ['Silme işlemi başarısız.']]
            ], 500);
        }
    }
}


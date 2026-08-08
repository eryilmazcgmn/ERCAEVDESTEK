<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\AssignTechnicianRequest;
use App\Http\Requests\BulkUpdateServicePricesRequest;
use App\Http\Requests\CreateTechnicianRequest;
use App\Http\Requests\UpdateWorkOrderStatusRequest;
use App\Services\CustomerService;
use App\Services\WorkOrderService;
use App\Models\Customer;
use App\Models\WorkOrder;
use App\Models\Quotation;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;
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
                'message' => 'İş emri durumu güncellenemedi.',
                'data' => null,
                'errors' => ['server' => ['Güncelleme başarısız oldu.']]
            ], 400);
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


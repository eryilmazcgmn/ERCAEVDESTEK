<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Conversation;
use App\Models\Customer;
use App\Models\Quotation;
use App\Models\WorkOrder;
use App\Models\UploadedFile;
use App\Models\ServicePrice;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Exception;

class QuotationService
{
    protected SettingService $settingService;

    public function __construct(SettingService $settingService)
    {
        $this->settingService = $settingService;
    }

    /**
     * Calculate price breakdown without persisting (for preview/backend source of truth).
     */
    public function calculatePrice(string $serviceType, array $formDetails): array
    {
        $items = [];
        $totalAmount = 0;
        $dbPrices = ServicePrice::where('service_type', $serviceType)->get();

        foreach ($formDetails as $questionId => $optionValue) {
            if (empty($optionValue)) continue;

            if (is_numeric($optionValue)) {
                $matchedPrice = $dbPrices->where('question_id', $questionId)
                    ->where('option_value', 'per_unit_price')
                    ->first();

                if ($matchedPrice && $matchedPrice->price > 0) {
                    $linePrice = $matchedPrice->price * floatval($optionValue);
                    $items[] = [
                        'description' => $matchedPrice->label . " (" . $optionValue . " m²)",
                        'price' => $linePrice
                    ];
                    $totalAmount += $linePrice;
                    continue;
                }
            }

            $matchedPrice = $dbPrices->where('question_id', $questionId)
                ->where('option_value', $optionValue)
                ->first();

            if ($matchedPrice && $matchedPrice->price > 0) {
                $items[] = [
                    'description' => $matchedPrice->label,
                    'price' => $matchedPrice->price
                ];
                $totalAmount += $matchedPrice->price;
            }
        }

        if (empty($items)) {
            $items[] = [
                'description' => 'Servis / Keşif Bedeli',
                'price' => 500
            ];
            $totalAmount = 500;
        }

        $depositAmount = round($totalAmount * 0.20, 2);

        return [
            'items' => $items,
            'subtotal' => $totalAmount,
            'tax' => 0,
            'total' => $totalAmount,
            'deposit_amount' => $depositAmount,
        ];
    }

    /**
     * Create quotation proposal and generate PDF.
     */
    public function createQuotation(string $sessionId, string $serviceType, array $formDetails): Quotation
    {
        return DB::transaction(function () use ($sessionId, $serviceType, $formDetails) {
            $conversation = Conversation::where('session_id', $sessionId)->firstOrFail();

            // Fetch uploaded reference photos
            $uploadedPhotos = UploadedFile::where('conversation_id', $conversation->id)
                ->where('file_type', 'image')
                ->get();

            $priceBreakdown = $this->calculatePrice($serviceType, $formDetails);
            $items = $priceBreakdown['items'];
            $totalAmount = $priceBreakdown['total'];

            $existingQuotation = Quotation::where('conversation_id', $conversation->id)
                ->where('status', 'pending')
                ->latest()
                ->first();

            if ($existingQuotation) {
                $quotation = $existingQuotation;
                $quotation->update([
                    'service_type' => $serviceType,
                    'details' => $formDetails,
                    'price_details' => $priceBreakdown,
                ]);
            } else {
                $quotation = Quotation::create([
                    'customer_id' => $conversation->customer_id,
                    'conversation_id' => $conversation->id,
                    'service_type' => $serviceType,
                    'details' => $formDetails,
                    'price_details' => $priceBreakdown,
                    'status' => 'pending'
                ]);
            }

            // PDF directory structure
            $pdfDir = storage_path('app/public/pdf');
            if (!File::exists($pdfDir)) {
                File::makeDirectory($pdfDir, 0755, true);
            }

            $pdfFileName = 'TEKLIF_' . $quotation->id . '_' . time() . '.pdf';
            $pdfRelativePath = 'storage/pdf/' . $pdfFileName;
            $pdfFullPath = storage_path('app/public/pdf/' . $pdfFileName);

            $serviceNames = [
                'tv-mount' => 'TV Montajı & Askı Aparatı Hizmeti',
                'paint' => 'Boya & Dekorasyon Hizmeti',
                'plumbing' => 'Sıhhi Tesisat Hizmeti',
                'electric' => 'Elektrik Tesisatı Hizmeti'
            ];

            $serviceTitle = $serviceNames[$serviceType] ?? 'Ev Destek Hizmeti';

            $settings = $this->settingService->getAllSettings();

            $companyName = $settings['company_name'] ?? 'ERCA EV DESTEK';
            $companyPhone = $settings['company_phone'] ?? '0850 123 45 67';
            $companyEmail = $settings['company_email'] ?? 'info@ercaevdestek.com';
            $depositAmount = $settings['deposit_amount'] ?? '500';
            $bankIban = $settings['bank_iban'] ?? 'TR00 0000 0000 0000 0000 0000 00';
            $bankName = $settings['bank_name'] ?? 'Ziraat Bankası';
            $bankRecipient = $settings['bank_recipient'] ?? 'ERCA Ev Destek Ltd. Şti.';

            $pdf = Pdf::loadView('pdf.quotation', [
                'quotation' => $quotation,
                'customer' => $conversation->customer,
                'serviceTitle' => $serviceTitle,
                'items' => $items,
                'totalAmount' => $totalAmount,
                'uploadedPhotos' => $uploadedPhotos,
                'companyName' => $companyName,
                'companyPhone' => $companyPhone,
                'companyEmail' => $companyEmail,
                'depositAmount' => $depositAmount,
                'bankIban' => $bankIban,
                'bankName' => $bankName,
                'bankRecipient' => $bankRecipient,
            ]);

            $pdf->save($pdfFullPath);
            $quotation->update(['pdf_path' => $pdfRelativePath]);

            // Auto-create initial Work Order (if not already existing)
            $workOrder = WorkOrder::firstOrCreate(
                ['quotation_id' => $quotation->id],
                [
                    'customer_id' => $conversation->customer_id,
                    'status' => 'pending',
                ]
            );

            return $quotation;
        });
    }

    /**
     * Approve quotation and create work order PDF.
     */
    public function approveQuotation(int $quotationId): array
    {
        return DB::transaction(function () use ($quotationId) {
            $quotation = Quotation::findOrFail($quotationId);
            $quotation->update(['status' => 'approved']);

            $workOrder = WorkOrder::where('quotation_id', $quotation->id)->first();
            if (!$workOrder) {
                $workOrder = WorkOrder::create([
                    'quotation_id' => $quotation->id,
                    'customer_id' => $quotation->customer_id,
                    'status' => 'deposit_pending',
                ]);
            } else {
                if ($workOrder->status === 'pending') {
                    $workOrder->update(['status' => 'deposit_pending']);
                }
            }

            // Generate Work Order PDF
            $pdfDir = storage_path('app/public/pdf');
            if (!File::exists($pdfDir)) {
                File::makeDirectory($pdfDir, 0755, true);
            }

            $pdfFileName = 'IS_EMRI_' . $workOrder->id . '_' . time() . '.pdf';
            $pdfRelativePath = 'storage/pdf/' . $pdfFileName;
            $pdfFullPath = storage_path('app/public/pdf/' . $pdfFileName);

            $settings = $this->settingService->getAllSettings();

            $pdf = Pdf::loadView('pdf.work_order', [
                'workOrder' => $workOrder,
                'work_order' => $workOrder,
                'quotation' => $quotation,
                'customer' => $quotation->customer,
                'settings' => $settings,
            ]);

            $pdf->save($pdfFullPath);
            $workOrder->update(['pdf_path' => $pdfRelativePath]);

            return [
                'quotation' => $quotation,
                'workOrder' => $workOrder
            ];
        });
    }

    /**
     * Get live tracking info for customer tracking page (by session ID).
     */
    public function getTrackingInfo(string $sessionId): array
    {
        $conversation = Conversation::where('session_id', $sessionId)->firstOrFail();
        $customer = $conversation->customer;

        $quotations = Quotation::where('conversation_id', $conversation->id)
            ->orderBy('created_at', 'desc')
            ->get();

        $quotationIds = $quotations->pluck('id');
        $workOrders = WorkOrder::whereIn('quotation_id', $quotationIds)
            ->with('technician')
            ->orderBy('created_at', 'desc')
            ->get();

        $activeWorkOrder = $workOrders->first();

        return [
            'session_id' => $sessionId,
            'customer' => $customer,
            'quotations' => $quotations,
            'work_orders' => $workOrders,
            'active_work_order' => $activeWorkOrder
        ];
    }

    /**
     * Get tracking info by customer phone number.
     */
    public function getTrackingInfoByPhone(string $phone): array
    {
        // Strip non-digits for flexible search
        $cleanPhone = preg_replace('/[^0-9]/', '', $phone);

        $customer = Customer::where('phone', 'LIKE', "%{$cleanPhone}%")
            ->latest()
            ->firstOrFail();

        $quotations = Quotation::where('customer_id', $customer->id)
            ->orderBy('created_at', 'desc')
            ->get();

        $quotationIds = $quotations->pluck('id');
        $workOrders = WorkOrder::whereIn('quotation_id', $quotationIds)
            ->with('technician')
            ->orderBy('created_at', 'desc')
            ->get();

        $activeWorkOrder = $workOrders->first();
        $latestConversation = Conversation::where('customer_id', $customer->id)->latest()->first();

        return [
            'session_id' => $latestConversation->session_id ?? "CUST-{$customer->id}",
            'customer' => $customer,
            'quotations' => $quotations,
            'work_orders' => $workOrders,
            'active_work_order' => $activeWorkOrder
        ];
    }
}

<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Direct storage file access fallback with auto-generation for PDFs
Route::get('/storage/{path}', function ($path) {
    $basePath = storage_path('app/public');
    $filePath = $basePath . '/' . ltrim($path, '/\\');

    $realBasePath = realpath($basePath);
    $realFilePath = realpath($filePath);

    if (!$realFilePath || !$realBasePath || !str_starts_with($realFilePath, $realBasePath) || !file_exists($realFilePath)) {
        // If file missing, try to auto-generate PDF on the fly
        if (preg_match('/IS_EMRI_(\d+)_/i', $path, $matches)) {
            $woId = (int)$matches[1];
            $wo = \App\Models\WorkOrder::find($woId);
            if ($wo && $wo->quotation_id) {
                $service = app(\App\Services\QuotationService::class);
                $res = $service->approveQuotation((int)$wo->quotation_id);
                $newWo = $res['workOrder'] ?? null;
                if ($newWo && !empty($newWo->pdf_path)) {
                    $newFullPath = storage_path('app/public/' . str_replace('storage/', '', $newWo->pdf_path));
                    if (file_exists($newFullPath)) {
                        return response()->file($newFullPath, [
                            'Content-Type' => 'application/pdf',
                            'Content-Disposition' => 'inline; filename="' . basename($newFullPath) . '"'
                        ]);
                    }
                }
            }
        }
        if (preg_match('/TEKLIF_(\d+)_/i', $path, $matches)) {
            $qId = (int)$matches[1];
            $q = \App\Models\Quotation::find($qId);
            if ($q) {
                $service = app(\App\Services\QuotationService::class);
                $newQ = $service->createQuotation($q->conversation->session_id ?? '', $q->service_type, $q->details ?? []);
                if ($newQ && !empty($newQ->pdf_path)) {
                    $newFullPath = storage_path('app/public/' . str_replace('storage/', '', $newQ->pdf_path));
                    if (file_exists($newFullPath)) {
                        return response()->file($newFullPath, [
                            'Content-Type' => 'application/pdf',
                            'Content-Disposition' => 'inline; filename="' . basename($newFullPath) . '"'
                        ]);
                    }
                }
            }
        }

        return response()->json(['status' => false, 'message' => 'Dosya henüz oluşturulmamış veya silinmiş olabilir.'], 404);
    }

    $mimeType = mime_content_type($realFilePath) ?: 'application/octet-stream';
    return response()->file($realFilePath, [
        'Content-Type' => $mimeType,
        'Content-Disposition' => 'inline; filename="' . basename($realFilePath) . '"'
    ]);
})->where('path', '.*');


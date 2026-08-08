<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\SessionController;
use App\Http\Controllers\QuotationController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\FeedbackController;
use App\Http\Controllers\ServiceController;
use App\Services\SettingService;
use Illuminate\Http\Request;

// ─── Public Routes (with rate limiting throttles) ────────────────
Route::middleware(['throttle:10,1'])->group(function () {
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/session/start', [SessionController::class, 'start']);
});

Route::middleware(['throttle:30,1'])->group(function () {
    Route::post('/calculate-price', [QuotationController::class, 'calculatePrice']);
    Route::get('/settings', [SettingController::class, 'index']);
    Route::get('/settings/bank', [SettingController::class, 'getBankInfo']);
    Route::get('/services', [ServiceController::class, 'index']);
    Route::get('/service-prices', [AdminController::class, 'getServicePrices']);
    Route::get('/tracking/{session_id}', [QuotationController::class, 'trackingInfo']);
    Route::get('/tracking-by-phone/{phone}', [QuotationController::class, 'trackingByPhone']);
    Route::post('/feedback', [FeedbackController::class, 'store']);
});

// Storage Stream with Path Traversal Protection
// NOTE: In production, consider using X-Accel-Redirect (Nginx) or X-Sendfile (Apache) for better performance.
Route::get('/storage/{path}', function ($path) {
    $basePath = storage_path('app/public');
    $filePath = $basePath . '/' . ltrim($path, '/\\');

    $realBasePath = realpath($basePath);
    $realFilePath = realpath($filePath);

    if (!$realFilePath || !$realBasePath || !str_starts_with($realFilePath, $realBasePath) || !file_exists($realFilePath)) {
        return response()->json(['status' => false, 'message' => 'File not found or access denied'], 404);
    }

    $mimeType = mime_content_type($realFilePath) ?: 'application/octet-stream';
    return response()->file($realFilePath, ['Content-Type' => $mimeType]);
})->where('path', '.*');

// ─── Customer / Authenticated Protected Routes (JWT required) ───
Route::middleware(['auth.jwt'])->group(function () {
    Route::post('/auth/refresh', [AuthController::class, 'refresh']);

    // Customer Session file uploads & contact
    Route::post('/session/{session_id}/upload', [SessionController::class, 'upload'])->middleware('throttle:20,1');
    Route::post('/session/{session_id}/contact', [SessionController::class, 'updateContact']);
    Route::post('/session/{session_id}/deposit-declare', [SessionController::class, 'declareDeposit']);

    // Quotation and Work Order endpoints
    Route::post('/session/{session_id}/quotation', [QuotationController::class, 'create']);
    Route::post('/quotation/{quotation_id}/approve', [QuotationController::class, 'approve']);

    // Technician endpoints
    Route::get('/technician/work-orders', [AdminController::class, 'technicianWorkOrders']);
    Route::post('/technician/work-orders/{id}/status', [AdminController::class, 'updateTechnicianWorkOrderStatus']);
});

// ─── Admin Protected Routes (JWT + Admin Role required) ─────────
Route::middleware(['auth.jwt', 'auth.admin'])->prefix('admin')->group(function () {
    Route::post('/settings', [SettingController::class, 'update']);
    Route::get('/verify-token', function (Request $request) {
        return response()->json([
            'status' => true,
            'user' => $request->attributes->get('jwt_user'),
            'message' => 'Token geçerli.'
        ]);
    });

    // CRM Management endpoints
    Route::get('/dashboard-stats', [AdminController::class, 'dashboardStats']);
    Route::get('/customers', [AdminController::class, 'customers']);
    Route::get('/quotations', [AdminController::class, 'quotations']);
    Route::get('/work-orders', [AdminController::class, 'workOrders']);
    Route::post('/work-orders/{id}/status', [AdminController::class, 'updateWorkOrderStatus']);
    Route::get('/technicians', [AdminController::class, 'technicians']);
    Route::post('/technicians', [AdminController::class, 'createTechnician']);
    Route::delete('/technicians/{id}', [AdminController::class, 'deleteTechnician']);
    Route::post('/work-orders/{id}/assign', [AdminController::class, 'assignTechnician']);

    // Exports
    Route::get('/export/customers', [AdminController::class, 'exportCustomers']);
    Route::get('/export/work-orders', [AdminController::class, 'exportWorkOrders']);

    // Service Prices management
    Route::get('/service-prices', [AdminController::class, 'getServicePrices']);
    Route::post('/service-prices/bulk-update', [AdminController::class, 'updateServicePrices']);
    Route::post('/service-prices/create', [AdminController::class, 'createServicePrice']);
    Route::post('/service-prices/reorder', [AdminController::class, 'reorderServiceQuestions']);
    Route::delete('/service-prices/{id}', [AdminController::class, 'deleteServicePrice']);

    // Service management (CRUD)
    Route::get('/services', [AdminController::class, 'getServices']);
    Route::post('/services', [AdminController::class, 'createService']);
    Route::put('/services/{id}', [AdminController::class, 'updateService']);
    Route::delete('/services/{id}', [AdminController::class, 'deleteService']);

    // Hosting utility routes — protected by ADMIN_OPERATION_SECRET
    Route::get('/link-storage', function (SettingService $settingService, Request $request) {
        $opKey = $request->header('X-OPERATION-KEY') ?? $request->query('op_key');
        if (config('app.env') !== 'local' && env('ADMIN_OPERATION_SECRET') && $opKey !== env('ADMIN_OPERATION_SECRET')) {
            \Illuminate\Support\Facades\Log::warning('Unauthorized operation attempt', ['uri' => $request->getRequestUri(), 'ip' => $request->ip()]);
            return response()->json(['status' => false, 'message' => 'Unauthorized operation'], 403);
        }
        return response()->json($settingService->linkStorage());
    });

    Route::get('/run-migrations', function (SettingService $settingService, Request $request) {
        $opKey = $request->header('X-OPERATION-KEY') ?? $request->query('op_key');
        if (config('app.env') !== 'local' && env('ADMIN_OPERATION_SECRET') && $opKey !== env('ADMIN_OPERATION_SECRET')) {
            \Illuminate\Support\Facades\Log::warning('Unauthorized operation attempt', ['uri' => $request->getRequestUri(), 'ip' => $request->ip()]);
            return response()->json(['status' => false, 'message' => 'Unauthorized operation'], 403);
        }
        return response()->json($settingService->runMigrations());
    });

    Route::get('/clear-cache', function (SettingService $settingService, Request $request) {
        $opKey = $request->header('X-OPERATION-KEY') ?? $request->query('op_key');
        if (config('app.env') !== 'local' && env('ADMIN_OPERATION_SECRET') && $opKey !== env('ADMIN_OPERATION_SECRET')) {
            \Illuminate\Support\Facades\Log::warning('Unauthorized operation attempt', ['uri' => $request->getRequestUri(), 'ip' => $request->ip()]);
            return response()->json(['status' => false, 'message' => 'Unauthorized operation'], 403);
        }
        return response()->json($settingService->clearCache());
    });
});

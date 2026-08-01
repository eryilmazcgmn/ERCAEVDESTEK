AuthController — encode sonrası null token kontrolü (login + refresh) Dosya: backend/app/Http/Controllers/AuthController.php Ekle (login içindeki try/catch’in hemen altına; aynı mantığı refresh için $newToken sonrası de ekle):
PHP
if ($token === null) {
    Log::error('JWT encode returned null despite secret being valid.');
    return response()->json([
        'status' => false,
        'message' => 'Token oluşturulamadı. Sunucu hatası.',
        'data' => null,
        'errors' => ['server' => ['Token üretimi başarısız.']]
    ], 500);
}
CustomerService.startSession — oturum token üretimi null kontrolü Dosya: backend/app/Services/CustomerService.php Ekle ($token üretiminden hemen sonra):
PHP
if ($token === null) {
    Log::error('Failed to create session JWT token: JWT_SECRET misconfigured.');
    throw new \RuntimeException('Session token creation failed due to server configuration.');
}
(Çağıran controller bu exception’ı yakalamalı; istersen ben controller içinde 500 dönen bir catch de eklerim.)

Controllerlarda user-id normalizasyonu — JwtService::extractUserId kullan Dosyalar: backend/app/Http/Controllers/AdminController.php ve repo genelinde jwt_user kullanıldığı yerler (ara: attributes->get('jwt_user')) Yapılacak:
Controller yapıcılarına JwtService $jwtService injekte et (eğer yoksa) ve atama yap.
ID alma yerine:
PHP
$jwtUser = (array) $request->attributes->get('jwt_user', []);
$userId = $this->jwtService->extractUserId($jwtUser);
(Uygula: technicianWorkOrders, updateTechnicianWorkOrderStatus ve benzeri methodlara; SessionController’da session-scoped token kullanıyorsan onun logic’ini bozma.)

quotations endpoint — default paginate(50) Dosya: backend/app/Http/Controllers/AdminController.php (quotations method) Değiştir: per_page verilmemişse tüm kaydı get() yerine paginate(50) dön:
PHP
$query = Quotation::with('customer')->orderBy('created_at', 'desc');
$perPage = (int) min(max(1, (int) $request->input('per_page', 50)), 200);
$quotations = $query->paginate($perPage);

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
(İhtiyaç halinde ?all=true param ile tüm kayıt seçeneğini koruyabilirsin ama üretimde riskli.)

CSP — production’da 'unsafe-inline' kaldır Dosya: backend/app/Http/Middleware/CorsAndSecurityHeaders.php Replace CSP satırı ile:
PHP
if (config('app.env') === 'local') {
    $csp = "default-src 'self'; script-src 'self' https: 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' http://localhost:5173 ws://localhost:5173 https:;";
} else {
    $csp = "default-src 'self'; script-src 'self' https:; style-src 'self' https:; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:;";
}
$response->headers->set('Content-Security-Policy', $csp);
(Not: production’da inline script/style varsa frontend’i nonce/sha’ya taşımadan prod’a geçirme.)

Admin utility rotaları — run-migrations & clear-cache koruması Dosya: backend/routes/api.php Eğer hâlen prod’da açık durumdaysa, wrapper ile op-key kontrolü eklensin (veya tamamen prod’da register edilmesin). Örnek koruma:
PHP
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

Route::get('/run-migrations', function (SettingService $settingService, Request $request) {
    $opKey = $request->header('X-OPERATION-KEY') ?? $request->query('op_key');
    if (config('app.env') !== 'local' && env('ADMIN_OPERATION_SECRET') && $opKey !== env('ADMIN_OPERATION_SECRET')) {
        Log::warning('Unauthorized operation attempt', ['uri' => $request->getRequestUri(), 'ip' => $request->ip()]);
        return response()->json(['status' => false, 'message' => 'Unauthorized operation'], 403);
    }
    return response()->json($settingService->runMigrations());
});

Route::get('/clear-cache', function (SettingService $settingService, Request $request) {
    $opKey = $request->header('X-OPERATION-KEY') ?? $request->query('op_key');
    if (config('app.env') !== 'local' && env('ADMIN_OPERATION_SECRET') && $opKey !== env('ADMIN_OPERATION_SECRET')) {
        Log::warning('Unauthorized operation attempt', ['uri' => $request->getRequestUri(), 'ip' => $request->ip()]);
        return response()->json(['status' => false, 'message' => 'Unauthorized operation'], 403);
    }
    return response()->json($settingService->clearCache());
});
Testleri çalıştırma / CI
Lokal: cd backend && composer install && cp .env.example .env (set JWT_SECRET≥32 ve DB) && php artisan migrate && ./vendor/bin/phpunit
CI: .github workflow’da phpunit çalıştığını doğrula. Yeni eklenen null-check ve paginate değişikliklerine göre testleri güncelle (AuthJwtTest token not null assertion, QuotationPaginationTest default page size assertion).
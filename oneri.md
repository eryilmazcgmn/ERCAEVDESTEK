
Amaç: kalan güvenlik/kararlılık eksikliklerini otomatik uygulamak:

JwtService: kontrollü secret doğrulama + helper extractUserId ekle.
AuthController: encode çağrılarını isSecretValid() kontrolü + try/catch ile sarmala.
Controller tüketicileri: JwtService helper kullanarak userId alma ile normalize et (AdminController, SessionController vb.).
Admin utility HTTP rotalarını güvene al (ADMIN_OPERATION_SECRET veya header X-OPERATION-KEY).
CSP sertleştirmesi (prod için unsafe-inline kaldırma/azaltma).
Admin quotations endpoint’ine paginate ekle.
Tests: AuthJwtTest genişlet, admin operation protected test, storage path traversal test, quotation pagination test.
CI workflow: phpunit + frontend build.
Değişiklikler — tam kod blokları (apply exactly)

JwtService: isSecretValid() ve extractUserId() File: backend/app/Services/Auth/JwtService.php Insert inside class App\Services\Auth\JwtService:
PHP
public function isSecretValid(): bool
{
    return $this->secretValid;
}

/**
 * Extract canonical user id from decoded JWT payload.
 */
public function extractUserId(array $decoded): int
{
    return (int) ($decoded['id'] ?? $decoded['user_id'] ?? 0);
}
AuthController: güvenli token üretimi (login ve refresh) File: backend/app/Http/Controllers/AuthController.php
In login() before calling $this->jwtService->encode(...), add isSecretValid check and try/catch:
Replace the encode block with:

PHP
// ensure JWT secret configured
if (! $this->jwtService->isSecretValid()) {
    Log::error('JWT secret is not configured or too short. Cannot create token.');
    return response()->json([
        'status' => false,
        'message' => 'Sunucu yapılandırma hatası: kimlik doğrulama servisi eksik.',
        'data' => null,
        'errors' => ['server' => ['Authentication configuration invalid. Contact admin.']]
    ], 500);
}

try {
    $token = $this->jwtService->encode([
        'id' => $user->id,
        'user_id' => $user->id, // geçiş dönemi: kısa süre sonra sadece 'id' kullanılacak
        'role' => $user->role,
        'username' => $user->username,
    ]);
} catch (\Throwable $e) {
    Log::error('JWT encode failed', ['exception' => $e]);
    return response()->json([
        'status' => false,
        'message' => 'Token oluşturulamadı. Sunucu hatası.',
        'data' => null,
        'errors' => ['server' => ['Token üretimi başarısız.']]
    ], 500);
}
Do the same in refresh() before creating $newToken (insert same isSecretValid + try/catch around encode).
AdminController & other controllers: normalize user id extraction (inject JwtService) Files to update (examples):
backend/app/Http/Controllers/AdminController.php

backend/app/Http/Controllers/SessionController.php (wherever $jwtUser['id'] or $jwtUser['user_id'] used)

backend/app/Http/Controllers/SettingController.php (if reading jwt_user) Change pattern:

Add injection to constructor where needed:

PHP
use App\Services\Auth\JwtService;

protected JwtService $jwtService;

public function __construct(WorkOrderService $workOrderService, CustomerService $customerService, JwtService $jwtService)
{
    $this->workOrderService = $workOrderService;
    $this->customerService = $customerService;
    $this->jwtService = $jwtService;
}
Replace occurrences like:
PHP
$jwtUser = $request->attributes->get('jwt_user');
$userId = (int) ($jwtUser['id'] ?? 0);
with:

PHP
$jwtUser = (array) $request->attributes->get('jwt_user', []);
$userId = $this->jwtService->extractUserId($jwtUser);
Apply across AdminController methods:

technicianWorkOrders
updateTechnicianWorkOrderStatus
any other place that uses jwt_user id.
Admin utility routes: require operation secret (route guards) File: backend/routes/api.php
Replace the /admin/link-storage, /admin/run-migrations, /admin/clear-cache route bodies with the guarded versions (use Request and Log). Example:

PHP
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

Route::get('/link-storage', function (SettingService $settingService, Request $request) {
    $opKey = $request->header('X-OPERATION-KEY') ?? $request->query('op_key');
    if (config('app.env') !== 'local' && env('ADMIN_OPERATION_SECRET') && $opKey !== env('ADMIN_OPERATION_SECRET')) {
        Log::warning('Unauthorized operation attempt', ['uri' => $request->getRequestUri(), 'ip' => $request->ip()]);
        return response()->json(['status' => false, 'message' => 'Unauthorized operation'], 403);
    }
    return response()->json($settingService->linkStorage());
});

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
Add note to DEPLOYMENT.md: set ADMIN_OPERATION_SECRET in prod env and never commit it.

CSP tightening File: backend/app/Http/Middleware/CorsAndSecurityHeaders.php
Replace the Content-Security-Policy header line:

Old:

PHP
$response->headers->set('Content-Security-Policy', "default-src 'self' http: https: data: blob: 'unsafe-inline'");
New (tighter; test frontend after deploy):

PHP
$csp = "default-src 'self'; script-src 'self' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:;";
if (config('app.env') === 'local') {
    $csp .= " connect-src 'self' http://localhost:5173 ws://localhost:5173;";
}
$response->headers->set('Content-Security-Policy', $csp);
Note: try to remove 'unsafe-inline' from style-src in future; if frontend uses inline styles/scripts, move to nonce/sha or remove inline usage.

quotations endpoint paginate File: backend/app/Http/Controllers/AdminController.php (quotations method)
Replace:

PHP
$quotations = Quotation::with('customer')->orderBy('created_at', 'desc')->get();
With:

PHP
$perPage = (int) request('per_page', 50);
$quotations = Quotation::with('customer')->orderBy('created_at', 'desc')->paginate($perPage);
And return the paginator object (or transform into resource) — keep response consistent. Example response update:

PHP
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
Storage route note / optional X-Accel File: backend/routes/api.php (storage route)
Add a comment suggesting production use of X-Accel-Redirect/X-Sendfile for performance.
Tests — add/extend
Create tests under backend/tests/Feature:

a) AdminOperationProtectedTest.php (checks op key) b) StorageTraversalTest.php (ensure path traversal fails) c) QuotationPaginationTest.php (pagination meta returned)

Example skeleton for AdminOperationProtectedTest (paste-ready):

PHP
<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Services\Auth\JwtService;
use Illuminate\Foundation\Testing\RefreshDatabase;

class AdminOperationProtectedTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_run_migrations_requires_operation_key()
    {
        $user = User::factory()->create(['username' => 'admin', 'password' => bcrypt('password123'), 'role' => 'admin']);

        $jwtService = app(JwtService::class);
        $token = $jwtService->encode(['id' => $user->id, 'user_id' => $user->id, 'role' => 'admin']);

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/admin/run-migrations');

        $response->assertStatus(403);

        // simulate ADMIN_OPERATION_SECRET set in env for test
        putenv('ADMIN_OPERATION_SECRET=test-op-key');

        $response2 = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->withHeader('X-OPERATION-KEY', 'test-op-key')
            ->getJson('/api/admin/run-migrations');

        $response2->assertStatus(200);
    }
}
Add StorageTraversalTest skeleton:

PHP
public function test_storage_path_traversal_is_blocked()
{
    $resp = $this->getJson('/api/storage/../../.env');
    $resp->assertStatus(404);
}
Add QuotationPaginationTest skeleton:

PHP
public function test_admin_quotations_pagination()
{
    // create many quotations via factory...
    // call GET /api/admin/quotations?per_page=10 with admin JWT
    // assert status 200, data length <= 10 and meta contains total/current_page/per_page
}
Run phpunit and ensure tests pass.

CI: add basic GitHub Action File: .github/workflows/ci.yml
Paste this (adjust paths):

YAML
name: CI

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: test
        ports: ['3306:3306']
        options: >-
          --health-cmd "mysqladmin ping --silent"
          --health-interval 10s
    steps:
      - uses: actions/checkout@v4
      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.1'
      - name: Install composer dependencies
        run: |
          composer install --working-dir=backend --no-progress --prefer-dist
      - name: Prepare env
        run: |
          cp backend/.env.example backend/.env
          php -r "file_put_contents('backend/.env', str_replace('DB_DATABASE=', 'DB_DATABASE=test', file_get_contents('backend/.env')));"
      - name: Run phpunit
        run: |
          cd backend
          ./vendor/bin/phpunit --testdox

  frontend-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 18
      - name: Install and build
        run: |
          cd frontend
          npm ci
          npm run build
Commit/PR

Commit messages (one per logical change):
feat(auth): add JwtService helpers isSecretValid + extractUserId
fix(auth): handle encode errors and missing JWT_SECRET in AuthController
fix(admin): protect admin operation routes with ADMIN_OPERATION_SECRET
feat(security): tighten CSP header
feat(api): paginate admin quotations endpoint
test: add admin operation, storage traversal and pagination tests
ci: add basic GitHub Actions CI workflow
Verification (local)

Backend:
composer install
cp backend/.env.example backend/.env ; set JWT_SECRET (>=32 chars) and DB settings
php artisan key:generate
php artisan migrate
./vendor/bin/phpunit
Frontend:
cd frontend
npm ci
npm run build
Manual quick checks with curl:
POST /api/auth/login (works)
GET /api/technician/work-orders with valid token -> 200
GET /api/technician/work-orders with invalid token -> 401
GET /api/admin/run-migrations without X-OPERATION-KEY -> 403
GET /api/admin/run-migrations with X-OPERATION-KEY -> 200 (if ADMIN_OPERATION_SECRET set)
Extra notes for the agent

Do not change unrelated files.
If any test failures arise, report failing test name + stack trace in the commit message description, but attempt to fix issues only if they are directly related to the changed code paths above.
Keep changes minimal and reversible (one commit per logical area).
After applying changes, run unit tests and include test results.

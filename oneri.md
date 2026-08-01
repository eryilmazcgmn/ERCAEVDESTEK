Aşağıya, yapay zeka destekli IDE/agent’e (Copilot / Codespaces / VSCode+AI vb.) doğrudan yapıştırıp çalıştırabileceğin, kalan düzeltmeleri otomatik uygulayacak tam görev talimatını veriyorum. Bu prompt; hangi dosyaları değiştireceğini, tam olarak neleri ekleyip/çevirip/çepeçevre kontrol edeceğini, testleri nasıl güncelleyeceğini, branch/commit adlarını ve doğrulama (local + ci) adımlarını içerir. Yapıştır → yeni branch oluştur → apply changes iste.

Branch adı

fix/jwt-null-check-paginate-csp-normalize
Amaç (kısa)

AuthController’da encode sonrası null token durumunu kapat.
Controller’larda JWT user id alma işlemini JwtService::extractUserId ile normalize et (AdminController başta).
Admin quotations endpoint’ini varsayılan paginate(50) yap.
CSP: production için 'unsafe-inline' kaldır (local geliştirme istisnası bırak).
DEPLOYMENT.md (veya README) içine ADMIN_OPERATION_SECRET tanımı/rotasyon bilgisi ekle.
Testleri (AuthJwtTest, QuotationPaginationTest, AdminOperationProtectedTest, StorageTraversalTest) çalıştır ve failures raporla.
PROMPT (kopyala → AI IDE’ye yapıştır)

Repo: eryilmazcgmn/ERCAEVDESTEK Branch: create branch fix/jwt-null-check-paginate-csp-normalize and apply changes.

AuthController — encode() sonrası null kontrolü (kritik) Files:
backend/app/Http/Controllers/AuthController.php
Task:

login() ve refresh()’te encode() çağrısından sonra token null ise hata dönecek şekilde kontrol ekle.
Replace token-returning blocks (örnek):

After existing try { $token = $this->jwtService->encode(...); } catch(...) { ... }

Add immediately after try/catch (both in login and refresh):

PHP
if ($token === null) {
    Log::error('JWT encode returned null despite secret being valid. Check JWT service configuration.');
    return response()->json([
        'status' => false,
        'message' => 'Token oluşturulamadı. Sunucu hatası.',
        'data' => null,
        'errors' => ['server' => ['Token üretimi başarısız.']]
    ], 500);
}
Make sure variable names match ($token / $newToken where appropriate).

Normalize user-id extraction across controllers (use JwtService::extractUserId) Files to change:
backend/app/Http/Controllers/AdminController.php
backend/app/Http/Controllers/SomeOtherControllersThatUseJwtUser (scan for $request->attributes->get('jwt_user') usages and update where ID is extracted)
e.g., backend/app/Http/Controllers/AdminController.php (technicianWorkOrders, updateTechnicianWorkOrderStatus)
Optionally: SessionController only if it expects user id from user token (session tokens use session_id) — leave session-specific logic intact.
Task:

Inject JwtService into controller constructor (add property and assignment).
Replace patterns like:
$jwtUser = $request->attributes->get('jwt_user');
$userId = (int) ($jwtUser['id'] ?? $jwtUser['user_id'] ?? 0); with:
$jwtUser = (array) $request->attributes->get('jwt_user', []);
$userId = $this->jwtService->extractUserId($jwtUser);
Example (AdminController):

Add at top: use App\Services\Auth\JwtService;
Add property: protected JwtService $jwtService;
Modify constructor to accept JwtService $jwtService and assign to $this->jwtService (preserve existing constructor args).
Replace ID extraction in technicianWorkOrders and updateTechnicianWorkOrderStatus accordingly.
Exact snippet to add to constructor (merge with existing parameters):

PHP
use App\Services\Auth\JwtService;

protected JwtService $jwtService;

public function __construct(WorkOrderService $workOrderService, CustomerService $customerService, JwtService $jwtService)
{
    $this->workOrderService = $workOrderService;
    $this->customerService = $customerService;
    $this->jwtService = $jwtService;
}
Then inside methods:

PHP
$jwtUser = (array) $request->attributes->get('jwt_user', []);
$userId = $this->jwtService->extractUserId($jwtUser);
Search & update: run a repo search for "attributes->get('jwt_user')" and update all places where numeric id is taken from the array.

quotations endpoint — default paginate(50) File:
backend/app/Http/Controllers/AdminController.php (quotations method)
Task:

If per_page param given, use it (bounded to reasonable max e.g. 200). If not given, default to paginate(50).
Return 'data' as items() and include 'meta' with pagination info.
Replace current logic:

PHP
$query = Quotation::with('customer')->orderBy('created_at', 'desc');
$perPage = $request->input('per_page');

if ($perPage && is_numeric($perPage)) {
    $quotations = $query->paginate((int) $perPage);
} else {
    $quotations = $query->get();
}
With:

PHP
$query = Quotation::with('customer')->orderBy('created_at', 'desc');
$perPage = (int) min(max(1, (int) $request->input('per_page', 50)), 200); // default 50, max 200
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
CSP tightening for production (remove 'unsafe-inline' in prod) File:
backend/app/Http/Middleware/CorsAndSecurityHeaders.php
Task:

Adjust CSP so that 'unsafe-inline' is allowed only in local environment. In production remove it. Replace existing CSP line with:
PHP
if (config('app.env') === 'local') {
    $csp = "default-src 'self'; script-src 'self' https: 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' http://localhost:5173 ws://localhost:5173 https:;";
} else {
    $csp = "default-src 'self'; script-src 'self' https:; style-src 'self' https:; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:;";
}
$response->headers->set('Content-Security-Policy', $csp);
Note: This removes inline styles/scripts in non-local environments. If frontend relies on inline scripts/styles, coordinate with frontend to add nonce/sha or remove inline usage before deploying.

DEPLOYMENT.md — document ADMIN_OPERATION_SECRET and JWT_SECRET File:
DEPLOYMENT.md or README.md at repo root (create if missing)
Add section:

Code
## Secrets required for production

- JWT_SECRET (minimum 32 characters): used by JWT service. Set in backend/.env as JWT_SECRET.
- ADMIN_OPERATION_SECRET: secret used to protect admin operations (/api/admin/run-migrations, /api/admin/clear-cache, /api/admin/link-storage) when app.env !== local.

How to create:
- Generate a strong random key: `php -r "echo bin2hex(random_bytes(32));"`
- Add to your environment (do NOT commit).
Rotation:
- Rotate key via deploy process; update environment and restart service. Consider vaulting secrets (Hashicorp Vault, AWS Secrets Manager).
Tests — update/add tests and ensure they assert token != null and default pagination Files:
Update backend/tests/Feature/AuthJwtTest.php

After login response: assert token is string and not null.
Add assertion that decoded token contains 'id' or 'user_id'.
Update or create backend/tests/Feature/QuotationPaginationTest.php

Ensure that calling GET /api/admin/quotations without per_page returns meta and items length <= 50.
Ensure AdminOperationProtectedTest uses ADMIN_OPERATION_SECRET simulation (putenv('ADMIN_OPERATION_SECRET=...') before request) or sets header X-OPERATION-KEY.

Example assertions to add to AuthJwtTest after response:

PHP
$response->assertStatus(200)
    ->assertJsonPath('status', true)
    ->assertJsonStructure(['data' => ['token', 'user_id', 'role']]);

$token = $response->json('data.token');
$this->assertIsString($token);
$this->assertNotEmpty($token);

$decoded = $jwtService->decode($token);
$this->assertNotNull($decoded);
$this->assertEquals($user->id, $decoded['id'] ?? $decoded['user_id'] ?? null);
Run tests & CI
Add or update .github/workflows/ci.yml to run backend phpunit and frontend build (if not already added).
Locally verify:
cd backend && composer install && cp .env.example .env (set JWT_SECRET >=32, DB) && php artisan migrate --seed
./vendor/bin/phpunit --testdox
Fix any failing tests that are related to the above changes.
Commit messages & PR Create commits per logical change:
fix(auth): reject null token after encode in AuthController
feat(auth): normalize extractUserId usage in controllers
feat(api): default pagination for admin quotations
feat(security): tighten CSP in production
docs: add DEPLOYMENT.md admin operation secret instructions
test: assert token non-null and pagination tests
ci: ensure phpunit runs in CI
Verification checklist (manual)
 POST /api/auth/login returns 200 and non-null token
 Decoding token yields id or user_id matching created user
 GET /api/admin/quotations (no per_page) returns data array and meta.current_page === 1, data length <= 50
 Admin operation endpoints without X-OPERATION-KEY return 403 (in non-local)
 CSP header on responses in production environment does NOT contain 'unsafe-inline'
 phpunit passes locally and in CI
Agent rules

Make minimal diffs; do not modify unrelated files.
If frontend breakage risk for CSP exists, add TODO comment and leave local dev with 'unsafe-inline' as above, but do not leave production with 'unsafe-inline'.
Run unit tests; if a test fails unrelated to these changes, report failure and stop (do not attempt broad refactor).
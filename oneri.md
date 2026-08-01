Kritik: JWT ve konfigürasyon doğrulama
Neden: Token üretimi/verification için JWT_SECRET gerekli; eksikse runtime hataları veya güvenlik açığı oluşur.
Yapılacaklar:
.env içinde services.jwt.secret (veya config/services.php ile map) değerinin en az 32 karakter olduğundan emin ol.
Deploy pipeline’a veya ręf testine config check ekle (artisan komutuyla).
Dosyalar:
backend/app/Services/Auth/JwtService.php
(opsiyonel) backend/app/Console/Commands/ConfigCheckCommand.php
Kod örneği (zaten önerildi/eklenebilir):
JwtService constructor’da secret kontrolü (loglar) — mevcutsa bırak ya da encode/decode sırasında ensureSecretValid() kullan.
Artisan check komutu (örnek):
PHP
// backend/app/Console/Commands/ConfigCheckCommand.php
// kontrol: JWT_SECRET uzunluğu ve public storage symlink
Test / Doğrulama:
.env’ye JWT_SECRET ekle: export JWT_SECRET="random-32-or-more-chars"
Lokal: php artisan app:config-check (komut eklediysen)
CI: workflow’da config-check çalışsın.
Kritik: session_id üretimini güvenli hale getir
Neden: Tahmin edilebilir session_id brute-force riskine yol açar.
Yapılacaklar:
session id üretimini UUID veya cryptographically secure random ile değiştir.
Dosya:
backend/app/Services/CustomerService.php
Değişiklik:
PHP
use Illuminate\Support\Str;
$sessionId = 'SES_' . Str::uuid()->toString(); // güvenli UUID
Test / Doğrulama:
POST start-session endpoint’ini çağır, dönen session_id’nin SES_ ile başlayıp UUID formatına benzediğini kontrol et.
Kritik: Dosya yükleme güvenliği (finfo fallback + .htaccess)
Neden: MIME spoofing, PHP dosyası yüklenmesi, veya paylaşılan hostta fileinfo extension yokluğu.
Yapılacaklar:
uploadSessionFile fonksiyonunda finfo_open kullan; eğer ext-fileinfo yoksa fallback olarak $file->getMimeType() kullan.
upload klasörü oluşturulurken yalnızca yoksa .htaccess yaz; var olan dosyayı ezme.
Dosya isimlendirme için cryptographically secure random (bin2hex(random_bytes(...))) kullan (zaten varsa bırak).
Dosya:
backend/app/Services/CustomerService.php
Kod örneği:
PHP
if (function_exists('finfo_open')) {
  $finfo = finfo_open(FILEINFO_MIME_TYPE);
  $realMime = finfo_file($finfo, $file->getPathname());
  finfo_close($finfo);
} else {
  $realMime = $file->getMimeType();
}
// upload dir
if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
if (!file_exists($htaccessPath)) {
  file_put_contents($htaccessPath, "# Prevent PHP execution\nphp_flag engine off\nRemoveHandler .php .phtml ...\n");
}
Test / Doğrulama:
ext-fileinfo yüklü bir ortamda test et: başarılı upload.
ext-fileinfo yüklü olmayan test ortamında fallback çalışmalı (hata atmamalı).
Yüksek: storage symlink ve UploadedFile URL accessor
Neden: storage:link yoksa public URL kırılır; URL üretimini modele taşımak temiz ve tek sorumluluklu.
Yapılacaklar:
php artisan storage:link çalıştır ve DEPLOYMENT.md’ye ekle.
Modelde accessor ekle veya doğrula: backend/app/Models/UploadedFile.php → getUrlAttribute().
Controller’larda asset(...) kullanımını $uploadedFile->url ile değiştir.
Dosyalar:
backend/app/Models/UploadedFile.php
backend/app/Http/Controllers/SessionController.php
Kod örneği:
PHP
// model
public function getUrlAttribute(): string {
  return url('storage/uploads/' . basename($this->file_path));
}

// controller response
'file_path' => $uploadedFile->url,
Test / Doğrulama:
php artisan storage:link
upload işlemi sonrası dönen URL tarayıcıda açılmalı.
Yüksek: JWT middleware + admin middleware kayıt kontrolü
Neden: Merkezi auth middleware yoksa controller bazlı kontroller atlanabilir.
Yapılacaklar:
JwtAuthenticate ve AdminRoleCheck middleware’leri Kernel’e register et (route veya global middleware).
Router’larda admin-only rotaları ilgili middleware ile koru.
Dosyalar:
backend/app/Http/Middleware/JwtAuthenticate.php
backend/app/Http/Middleware/AdminRoleCheck.php
backend/app/Http/Kernel.php (kontrol/ekleme)
Örnek (Kernel.php içinde):
PHP
protected $routeMiddleware = [
  // ...
  'jwt.auth' => \App\Http\Middleware\JwtAuthenticate::class,
  'role.admin' => \App\Http\Middleware\AdminRoleCheck::class,
];
Test / Doğrulama:
Admin-only endpoint’e token olmadan istekte bulun -> 401/403 döndürmeli.
Geçerli admin token ile istek -> 200.
Orta: Loglama ve hata yönetimini standartlaştır
Neden: Hata analizi için exception nesnesini loglamak lazım (stack trace).
Yapılacaklar:
catch bloklarında Log::error('...', ['exception' => $e, ...]) şeklinde tutarlı kullan.
Gizli verileri loglama (kullanıcı şifreleri, tokenlar) sakın loglama.
Dosyalar: backend/app/Http/Controllers/*.php genel olarak
Test / Doğrulama:
Hata üreten senaryo yaratıp storage/logs/laravel.log içeriğini kontrol et.
Orta: DB indeksleri ve sorgu optimizasyonu
Neden: Conversation.session_id, UploadedFile.conversation_id, Quotation.conversation_id aramaları optimizasyon gerektirir.
Yapılacaklar:
Eğer migration’larda yoksa index ekle için yeni migration oluştur:
PHP
Schema::table('conversations', function (Blueprint $table) {
  $table->index('session_id');
});
Test / Doğrulama:
Büyük veri seti simülasyonu yoksa EXPLAIN ile sorgu planını incele.
Orta: PHPUnit testleri ekle / çalıştır
Neden: Kritik fonksiyonlar (startSession, uploadSessionFile, updateContactInfo) unit/integration testleri ile güvence altına alınsın.
Yapılacaklar:
tests/Unit/CustomerServiceTest.php — startSession, updateContactInfo (mock DB).
tests/Feature/UploadTest.php — fake storage ile upload testi:
PHP
Storage::fake('public');
$response = $this->post('/api/session/.../upload', [...]);
Storage::disk('public')->assertExists('uploads/...'); 
Komut:
cd backend && vendor/bin/phpunit
CI:
GitHub Actions ile phpunit job ekle (.github/workflows/phpunit.yml).
Orta: Frontend küçük düzeltmeler ve test
Neden: useEffect dependency, API base URL kontrollü olmalı.
Yapılacaklar:
frontend/src/App.jsx: useEffect deps -> add navigate ve location.pathname.
frontend/src/config veya env dosyasında API_BASE_URL kontrolü; production build için doğru ayarlama.
Test / Doğrulama:
cd frontend && npm ci && npm run build
Lokal: npm run dev ve rota geçişlerini test et.
Orta/Düşük: DEPLOYMENT.md güncelle ve otomasyon
Neden: Deploy adımlarının kesin ve eksiksiz olması gerekir (storage:link, cron, php.ini limits).
Yapılacaklar:
DEPLOYMENT.md’ye:
php artisan storage:link talimatı
JWT_SECRET gereksinimi (min 32)
cron komutları ve queue worker hatırlatma
ext-fileinfo requirement (PHP)
Opsiyonel: Deploy script (bash) veya docker-compose/forge script hazırlama.
Test / Doğrulama:
Staging ortamında adımları uygulayıp smoke test yap.
Düşük: .htaccess / Nginx uyumluluğu ve dokümantasyon
Neden: .htaccess sadece Apache için; Nginx kullanılıyorsa farklı konfig gerekecek.
Yapılacaklar:
DEPLOYMENT.md’ye Nginx snippet ekle (uploads dizini için location deny php).
Örnek Nginx snippet:
Nginx
location ~* /storage/uploads/.*\.(php|phtml)$ {
  deny all;
}
Düşük: Monitoring / failed_jobs / error tracking
Neden: Prod hatalarını izlemek için Sentry/Honeybadger veya benzeri gerekli.
Yapılacaklar:
failed_jobs tablolarını izleme; queue worker restart/monitor.
Hata izleme entegrasyonu (Sentry).
Test / Doğrulama:
Test hata atıp Sentry dashboard’ta görünmesini kontrol et.
PR / Git / CI süreçleri (adımlar)
Yerel:
Code
git checkout -b fix/security-upload-jwt-YYYYMMDD
# değişiklikleri yap
git add .
git commit -m "Security: session id (UUID), finfo fallback, uploadedFile URL accessor, config-check command, CI workflows"
git push origin fix/security-upload-jwt-YYYYMMDD
PR:
Başlık: security/upload/jwt fixes
Açıklama: hangi dosyalar değişti, test talimatları, migration var mı vs.
CI:
.github/workflows/phpunit.yml (backend test job)
.github/workflows/frontend-build.yml (frontend build job)
Veritabanı migration örneği (index ekleme)
Dosya: create_migration_add_indexes.php (artisan make:migration)
PHP
public function up()
{
  Schema::table('conversations', function (Blueprint $table) {
    $table->index('session_id');
  });
  Schema::table('uploaded_files', function (Blueprint $table) {
    $table->index('conversation_id');
  });
}
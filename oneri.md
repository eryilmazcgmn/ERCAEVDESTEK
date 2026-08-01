Kritik hata: JWT secret kontrolü -> 500 hatası potansiyeli
Nerede: backend/app/Services/Auth/JwtService.php
ensureSecretValid() metodu secret geçerli değilse RuntimeException fırlatıyor (lines ~38-43).
decode() metodu ensureSecretValid() çağırıyor (lines ~68-74).
Sonuç / Etki:
Eğer .env içinde services.jwt.secret düzgün ayarlı değilse (ör. geliştirme ya da eksik konfigürasyon), herhangi bir auth korumalı route'a (auth.jwt middleware) istek atıldığında decode() RuntimeException fırlatacak ve uygulama 500 dönebiliyor. Bu, erişim kontrolü yerine sunucu hatası/logu üretir.
Öneri (yüksek öncelik):
decode() içinde exception atmak yerine güvenli bir şekilde null döndürün ve middleware'de bu durumu 401 ile karşılayın. Alternatif: ensureSecretValid() exception yerine boolean kontrolü döndürsün.
Örnek düzeltme (özet):
JwtService::decode:
Eğer secret geçersizse loglayıp null dönsün (throw etmeyin).
JwtAuthenticate::handle:
decode() çağrısını try/catch ile sarmalayın; decode hata/exception dönerse 401 dönün (500 değil).
Tutarsız JWT claim isimleri (authentication -> authorization bug)
Nerede:
AuthController::login(): token payload'ı oluştururken anahtar olarak 'user_id' kullanıyor (lines ~47-51).
AuthController::refresh() ise $jwtUser = $request->attributes->get('jwt_user'); ve refresh için $jwtUser['user_id'] kullanıyor (uyumlu).
Ancak AdminController::technicianWorkOrders ve updateTechnicianWorkOrderStatus gibi yerlerde kod $jwtUser['id'] bekliyor (ör. AdminController lines ~328-331, 355-358).
Sonuç / Etki:
JWT içeriği 'user_id' iken kod yer yer 'id' arıyor -> userId = 0 gelir; bunun sonucu yetki denetimleri yanlış davranabilir, hatalı sorgular dönebilir veya boş veri dönebilir. Bu bir güvenlik / doğrulama hatasına yol açabilir.
Öneri (yüksek öncelik):
Tutarlılığı sağlamak için tek bir key kullanın. İki seçenek:
Standardize edin: token payload'ında 'id' kullanın (Laravel model id ile uyumlu).
Veya tüm tüketicileri 'user_id' kullanacak şekilde değiştirin.
Benzer yerleri güncelleyin: Jwt oluşturma (AuthController), middleware tarafından request'e set edilen jwt_user formu ve tüm consumer kodlar (AdminController, technician endpoints vb.).
Örnek düzeltme (özet):
AuthController::login encode payload'ta 'id' => $user->id yazın (ve refresh'te de aynı).
Middleware exception ve hata dönüşleri
Nerede: backend/app/Http/Middleware/JwtAuthenticate.php
decode çağrısı doğrudan yapılıyor; decode null döndüğünde middleware 401 dönebiliyor (bu iyi), fakat eğer JwtService exception fırlatırsa middleware bunu yakalamıyor.
Etki:
Konfigürasyon/secret hatalarında 500 döner; beklenen davranış 401 veya anlaşılır bir hata mesajı olmalı.
Öneri:
JwtAuthenticate içinde decode çağrısını try/catch ile sarmalayın ve hata durumunda 401 döndürün. Log detaylı ama kullanıcıya 401 dönülmeli.
CORS / CSP / Security headers — zayıf veya riskli ayarlar
Nerede: backend/app/Http/Middleware/CorsAndSecurityHeaders.php
CSP olarak: "default-src 'self' http: https: data: blob: 'unsafe-inline'" (line ~60).
X-XSS-Protection header kullanılıyor (deprecte edilmiş).
Access-Control-Allow-Credentials header yok.
Risk / Etki:
'unsafe-inline' inline script'leri izin veriyor — XSS riskini artırır.
X-XSS-Protection modern tarayıcılarda gereksiz veya deprece edilmiş.
Eğer kimlik doğrulama cookie ile yapılacaksa Allow-Credentials gerekli.
Öneri:
CSP’yi tighten edin; mümkünse inline stil/script kullanımını kaldırın, script-src / style-src ayrıştırması yapın. Örnek: Content-Security-Policy: "default-src 'self'; script-src 'self' 'nonce-...'; style-src 'self' 'nonce-...';".
X-XSS-Protection kaldırılabilir.
Eğer cookie tabanlı auth kullanılacaksa Access-Control-Allow-Credentials: true ve frontend origin ile birlikte true ayarı kullanılmalı.
getAllowedOrigins()’da environment kontrollü liste tutun (özellikle prod'da wildcard kullanmayın).
Riskli admin utility HTTP rotaları
Nerede: backend/routes/api.php
/admin/run-migrations, /admin/clear-cache, /admin/link-storage (lines ~95-105)
Risk / Etki:
Bu rotalar admin'e kapalı olsa bile, web üzerinden migration çalıştırmak, dosya sistemi linklemek veya cache temizlemek üretimde riskli olabilir; yanlışlıkla tetiklenme, log zayıflığı veya kötü niyetle tetiklenme riski var.
Öneri:
Bu tür hosting/ops işlemlerini HTTP endpoint üzerinden sunmayın veya ekden bir (IP + MFA/operation key) koruması ekleyin. Alternatif: sadece CLI veya deploy pipeline ile çalıştırın. Eğer muhakkak HTTP üzerinden açılacaksa operation logu, rate limit ve ek authorization (2FA/operation password) ekleyin.
Rota: storage dosya stream (path traversal kontrolü iyi ama dikkat)
Nerede: backend/routes/api.php -> Route::get('/storage/{path}', ...)
Kod realpath karşılaştırmasıyla basePath koruması sağlıyor (lines ~30-44).
Değerlendirme:
realpath karşılaştırması ve file_exists kontrolü iyi bir yaklaşım. Ancak:
İzin kontrolü (ör. sadece public storage dosyalarını serve etmeye kesin sınır) net olmalı.
Büyük/çok sayıda dosya transferlerinde resource kullanımı ve throttling düşünülmeli.
Öneri:
Serve işlemi için response()->file yerine web sunucu (nginx) ile X-Accel-Redirect/X-Sendfile kullanmak performanslıdır.
Dosya erişim yetkilerini (paylaştığınız dosya türleri) kesinleştirin.
Veri çekimleri / bellek kullanımı
Nerede: AdminController::quotations() doğrudan ->get() (lines ~86-92)
Risk / Etki:
Eğer tablo büyükse ->get() tüm kayıtları belleğe çeker; bellek taşması (OOM) riski oluşur.
Öneri:
Pagination kullanın (->paginate()) veya chunk/stream ile işlemleri kısıtlayın.
CSV export'larda zaten Customer::chunk(100, ...) ve WorkOrder::chunk(100, ...) kullanılmış — bu iyi. Benzer pattern diğer 'get all' metodlarda da uygulanmalı.
İyi pratikler / code quality eksiklikleri
Bulunanlar:
backend/phpunit.xml var fakat tests/ dizini görünüşe göre boş (test coverage eksik).
composer.lock ve package-lock.json repoda — normal. Ancak security audit yapılmalı.
Öneri:
Otomatik test yazımı (feature + unit) — öncelik Auth, Session, Quotation iş akışları.
CI pipeline (GitHub Actions) ile PR’larda test + static analysis (PHPStan veya Psalm) çalıştırma.
Dependabot veya benzeri otomatik package güncelleme/güvenlik bildirimleri kurun.
Token depolama / frontend güvenliği
Durum:
AuthController token'ı JSON cevap içinde döndürüyor (body) -> frontend tarafı muhtemelen bu token'ı localStorage/sessionStorage veya memory'e koyuyor.
Risk:
localStorage XSS ile token sızdırılabilir.
Öneri:
Mümkünse HttpOnly, Secure cookie kullanın (CSRF koruması ile beraber) veya short-lived accesstoken + refresh token pattern (refresh cookie HttpOnly) uygulayın.
Frontend tarafında XSS önlemleri, CSP (nonce/strict) konfigürasyonu yapılmalı.
Güvenlik logging ve leakage
Not:
AuthController login başarısızlıklarını logluyor (kullanıcı adı, ip, user-agent) — bu genelde iyi. Fakat logların saklandığı yerin erişim izinlerini kontrol edin; loglarda hassas veri olmadığından emin olun.
Öneri:
Log dosyalarının rotation, erişim izni ve saklama politika(RETENTION) kuralları olsun.
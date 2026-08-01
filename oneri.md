(Orta‑yüksek) JwtService.encode: hala ensureSecretValid() exception fırlatıyor

Nerede: backend/app/Services/Auth/JwtService.php (ensureSecretValid ve encode)
Durum: decode güvenli, fakat encode() çağrısı (login/refresh) öncesinde ensureSecretValid() exception fırlatıyor. Eğer .env'de JWT_SECRET eksik/yanlışsa login/refresh sırasında RuntimeException ile uygulama 500 üretebilir.
Etki: Prod/QA ortamlarında eksik env konfigürasyonu kullanıcı login işlemlerini çökertir.
Öneri:
Ya ensureSecretValid() exception yerine kontrollü null/false dön ve AuthController/login içinde uygun 500/konfigürasyon-hatası mesajı göster; veya
Daha basit: AuthController.login ve refresh içinde jwtService->encode çağrılarını try/catch ile sar ve konfigurasyon hatalarını (log + kullanıcıya anlaşılır mesaj) yakala.
Nereden başla: backend/app/Services/Auth/JwtService.php (ensureSecretValid) ve backend/app/Http/Controllers/AuthController.php (encode çağrıları).
(Düşük→Orta) Token claim standardizasyonu — geçici çözüm var ama kalıcı standart gerekli

Nerede: AuthController (üretim) vs AdminController/tekniyen tüketimi (tüketim)
Durum: Şu an hem 'id' hem 'user_id' koyuyorsun (bu güvenli bir geçici akrobasi). Ancak kod bazında bazı yerler hâlâ yalın 'id' bekliyor (AdminController technician metodları userId = (int) ($jwtUser['id'] ?? 0) kullanıyor).
Etki: Şu an çalışıyor çünkü ikisini de koyuyorsun. Ancak temiz bir çözüm için tek bir anahtar seç ve tüm tüketicileri ona göre güncelle.
Öneri: Uzun vadede token payload'unda tek bir canonical claim (ör. 'id') kullan, tüm controllerlar bunu okusun; veya token üretici + tüketiciler için ortak bir helper (JwtPayload::getUserId($decoded)) yaz.
(Yüksek risk) Admin-hosting utility HTTP rotaları hâlâ açık

Nerede: backend/routes/api.php (admin/run-migrations, admin/clear-cache, admin/link-storage) lines ~95–105
Durum: Bu rotalar admin middleware’ine bağlı ama yine de web üzerinden migration/run-cache gibi operasyonlara izin veriyor.
Etki: Eğer admin hesabı ele geçirilirse veya auth.admin zayıfsa çok tehlikeli (veri kaybı, servis kesintisi).
Öneri:
Bu rotaları deploy pipeline ya da sadece CLI'ya taşı (kaldırmak en güvenli).
Eğer HTTP üzerinden muhakkak kalacaksa ekstra koruma ekle: operasyon parolası + IP kısıtlama + operation audit log + rate limiting + 2FA.
Nereden başla: backend/routes/api.php ve ilgili SettingService metodları.
(Orta) Cors/CSP hâlihazırda iyileşmiş ama hâlâ 'unsafe-inline' var

Nerede: backend/app/Http/Middleware/CorsAndSecurityHeaders.php (Content-Security-Policy satırı ~60)
Durum: Dosyaya Access-Control-Allow-Credentials eklendi (iyi). CSP artık daha kısıtlı ama style-src/script-src hâlâ 'unsafe-inline' içeriyor.
Etki: 'unsafe-inline' XSS saldırı yüzeyini artırır; frontend token localStorage kullandığında risk büyür.
Öneri:
Inline script/style kullanımını mümkünse kaldır; yerine nonce veya SHA-256 kullan.
Eğer geçici olarak inline bırakılacaksa prod ortamda minimize edilip nonce ile korun.
Nereden başla: CorsAndSecurityHeaders.php -> Content-Security-Policy değişikliği, frontend build (inline removal).
(Orta) AdminController::quotations kullandığı ->get() bellek riski

Nerede: backend/app/Http/Controllers/AdminController.php (quotations method lines ~86–92)
Durum: Tüm teklifler tek seferde belleğe alınıyor.
Etki: Büyük veri setlerinde OOM / yavaş sorgu riski.
Öneri: paginate() veya sorgu ile sayfalama; admin UI export için chunk kullanma (CSV export zaten chunk kullanıyor).
(Orta) Session token design (session vs user token) — kontrol, belgeleme

Nerede: CustomerService::startSession (token içerik session_id) ve SessionController (session_id kontrol)
Durum: Session-scoped token mantıklı ama belgelendirilmeli; tüketiciler bunun varlığını beklemeli.
Öneri: README veya API doc içinde token türlerini (customer token with session_id vs user token with id) netleştir; test ekle.
(Orta) Örnek ve testler: coverage genişletilmeli

Durum: AuthJwtTest mevcut ve faydalı. Ancak admin utility rotaları, file upload, pagination, CSV export, storage stream vs authorization gibi kritik akışlar için test eklemeni öneririm.
Öneri: feature testleri: admin/verify-token, admin/run-migrations (mock), storage file serve (path traversal denemesi), file upload (mimetypes limit), pagination behavior.
(Düşük) UploadedFile::getUrlAttribute path usage

Nerede: backend/app/Models/UploadedFile.php getUrlAttribute()
Durum: URL oluştururken basename kullanıp storage/uploads/ altına yönlendiriyorsun. Bu, storage:link varlığını gerektirir. Güvenlik açısından path büyük oranda güvenli, ama dosya adlarında özel karakterler/encoding olabilir.
Öneri: filename sanitize veya orijinal isim kullanılacaksa saklarken güvenli ad kullan.
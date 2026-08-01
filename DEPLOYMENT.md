# Yeni Başlayanlar İçin: Adım Adım Paylaşımlı Hosting Kurulum Kılavuzu

Bu kılavuz, kodlama veya sunucu yönetimi konusunda **hiçbir teknik bilgisi olmayan birinin dahi** ERCA Ev Destek platformunu sıfırdan canlı sunucuya (Hostinger, GoDaddy, Turhost, Natro vb.) sorunsuz kurabilmesi için en ince detayına kadar hazırlanmıştır.

---

## 1. Hazırlık ve İhtiyacınız Olan Araçlar

Başlamadan önce bilgisayarınıza şu iki basit programı indirin (ikisi de tamamen ücretsizdir):
1. **FileZilla (FTP Programı):** Dosyalarınızı bilgisayarınızdan internetteki sunucunuza yüklemek için kullanılır. [FileZilla İndir](https://filezilla-project.org/)
2. **VS Code veya Notepad++ (Yazı Editörü):** Sunucu ayar dosyalarını düzenlemek için kullanılır.

---

## 2. FTP Bağlantısını Kurma (Sunucuya Bağlanma)

Hosting firmanız size satın alma sonrası bir **FTP Kullanıcı Bilgisi** eposta ile göndermiştir.
1. **FileZilla** programını açın.
2. Sol üstteki **Dosya > Site Yöneticisi** (File > Site Manager) menüsüne girin.
3. **Yeni Site** butonuna tıklayın.
4. Sağ taraftaki ayarları şu şekilde doldurun:
   * **Protokol:** FTP (veya SFTP)
   * **Sunucu (Host):** `ftp.alanadiniz.com` (veya hostinginizin verdiği IP adresi)
   * **Şifreleme:** "Yalnızca düz FTP kullanılsın" (veya varsayılan bırakın)
   * **Giriş Türü:** Normal
   * **Kullanıcı adı:** size iletilen FTP kullanıcı adı
   * **Parola:** size iletilen FTP şifresi
5. **Bağlan** butonuna tıklayın.
6. Bağlandığınızda FileZilla ekranı ikiye ayrılır:
   * **Sol Taraf (Yerel Site):** Kendi bilgisayarınızdaki klasörler.
   * **Sağ Taraf (Uzak Site):** İnternetteki sunucunuzun içi.

---

## 3. Ön Yüzün (React) Derlenmesi ve FTP'ye Yüklenmesi

### 3.1: Bilgisayarınızda Derleme Yapma
1. Windows arama çubuğuna **cmd** veya **PowerShell** yazıp komut satırını açın.
2. Aşağıdaki komutları sırasıyla yazıp her seferinde Enter'a basın (bu komut projenizin kodlarını internette çalışacak statik paket haline getirir):
   ```bash
   cd c:\Users\Eryil\Desktop\ERCAEVDESTEK\frontend
   npm run build
   ```
3. İşlem bittiğinde `frontend` klasörünüzün içinde **`dist`** adında yeni bir klasör oluşacaktır.

### 3.2: Dosyaları FTP Sunucusuna Gönderme
1. FileZilla programında **Sol taraftan** bilgisayarınızdaki `c:\Users\Eryil\Desktop\ERCAEVDESTEK\frontend\dist` klasörünün içine girin.
2. **Sağ taraftan** sunucunuzdaki **`public_html`** klasörünün içine çift tıklayarak girin (burası sitenizin ana dizinidir).
3. Sol taraftaki tüm dosya ve klasörleri seçip (Mouse ile sürükleyerek veya sağ tıklayıp "Yükle" diyerek) sağ taraftaki boşluğa bırakın.
4. Yükleme bittiğinde sitenizin tasarımı sunucunuza aktarılmış olacaktır.

---

## 4. Arka Yüzün (Laravel Backend) FTP'ye Yüklenmesi

Güvenlik nedeniyle sitenin asıl kodları internete açık olan `public_html` klasörünün dışında durmalıdır.

### 4.1: Backend Dosyalarını Sunucuya Atma
1. FileZilla'da **Sağ tarafta (Sunucuda)** en üste gidin (yani `public_html` klasörünün de göründüğü en dış klasör - buna `/` veya `kök` dizin denir).
2. Sağ tarafta boş bir yere sağ tıklayıp **Klasör Oluştur** deyin ve adını **`erca_backend`** yapın.
3. FileZilla'nın **Sol tarafında (Bilgisayarınızda)** `c:\Users\Eryil\Desktop\ERCAEVDESTEK\backend` klasörünün içine girin.
4. Aşağıdaki klasörler **HARİÇ** tüm dosya ve klasörleri seçip sunucudaki `erca_backend` klasörünün içine yükleyin:
   * **YÜKLENMEYECEK klasörler (Hafifletmek için):** `node_modules`, `tests`, `public`.
   * **ÖNEMLİ:** Bilgisayarınızdaki `vendor` klasörü tüm sistem kütüphanelerini içerir, yüklemesi biraz zaman alabilir, mutlaka eksiksiz yüklenmesini bekleyin.

### 4.2: API Giriş Dosyalarını Taşıma
1. Sunucu tarafında (sağda) oluşturduğumuz `/erca_backend/public/` klasörünün içindeki tüm dosyaları (özellikle `index.php` ve `.htaccess` dosyalarını),
2. Sunucuda internete açık olan `public_html/` klasörünün altında **`api`** adında yeni bir klasör oluşturarak onun içine yükleyin. (Yani yol `public_html/api/index.php` şeklinde olmalıdır).

### 4.3: index.php Dosyasını Düzenleme
1. Sunucu tarafındaki `public_html/api/index.php` dosyasına sağ tıklayıp **Göster/Düzenle** seçeneğini seçin.
2. Dosya açıldığında aşağıdaki iki satırı bulun ve `erca_backend` klasörünü görecek şekilde yolları güncelleyip kaydedin:
   * **Eski hali:**
     ```php
     require __DIR__.'/../vendor/autoload.php';
     $app = require_once __DIR__.'/../bootstrap/app.php';
     ```
   * **Yeni hali (Bu şekilde değiştirin):**
     ```php
     require __DIR__.'/../../erca_backend/vendor/autoload.php';
     $app = require_once __DIR__.'/../../erca_backend/bootstrap/app.php';
     ```
3. Dosyayı kaydedip kapatın. FileZilla "Dosya değiştirildi, sunucuya yüklensin mi?" diye sorduğunda **Evet** deyin.

---

## 5. cPanel Üzerinden Veritabanı (MySQL) Oluşturma

1. Tarayıcınızdan hosting panelinize girin ve **cPanel** ikonuna tıklayın.
2. Arama kutusuna **Sihirbaz** veya **Wizard** yazıp **MySQL Veritabanı Sihirbazı (MySQL Database Wizard)** uygulamasını açın.
3. **Adım 1:** Veritabanı adını yazın (Örn: `erca_db`) ve sonraki adıma geçin.
4. **Adım 2:** Veritabanı kullanıcı adını (Örn: `erca_user`) ve şifresini yazın (Şifreyi "Şifre Oluşturucu" ile oluşturup mutlaka bir yere not edin). **Kullanıcı Oluştur** butonuna tıklayın.
5. **Adım 3:** **Tüm Ayrıcalıklar (All Privileges)** kutucuğunu işaretleyin ve **Sonraki Adım** butonuna tıklayarak işlemi tamamlayın.
6. Not aldığınız tam veritabanı adını, kullanıcı adını ve şifreyi saklayın (cPanel genellikle bunları `kullaniciadi_erca_db` şeklinde oluşturur).

---

## 6. Sunucu Ayar Dosyasını (.env) Düzenleme

1. FileZilla'da sağ tarafta `/erca_backend/` klasörüne girin.
2. Oradaki `.env.example` dosyasının adını sağ tıklayıp **Yeniden Adlandır** diyerek **`.env`** yapın.
3. `.env` dosyasına sağ tıklayıp **Göster/Düzenle** deyin.
4. Aşağıdaki satırları bulup kendi bilgilerinizle doldurun:
   ```ini
   APP_NAME="ERCA Ev Destek"
   APP_ENV=production
   APP_DEBUG=false
   APP_URL=http://alanadiniz.com             # Sitenizin gerçek adresi

   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=cpaneldeki_veritabani_adi      # Adım 5'te oluşturduğunuz veritabanı adı
   DB_USERNAME=cpaneldeki_kullanici_adi      # Adım 5'te oluşturduğunuz kullanıcı adı
   DB_PASSWORD=veritabanı_sifreniz            # Adım 5'te belirlediğiniz şifre

   QUEUE_CONNECTION=database

   NVIDIA_API_KEY=nvapi-your-key-here         # NVIDIA AI Anahtarınız
   JWT_SECRET=your-random-secret-key          # Rastgele harf ve sayılardan oluşan gizli kelime
   ```
5. Kaydedip kapatın ve FileZilla'da onaylayıp sunucuya yüklenmesini sağlayın.

---

## 7. Tarayıcı Üzerinden Tek Tık Kurulum Kısayolları

Tüm dosyaları yükleyip ayarları yaptıktan sonra, normalde siyah ekrandan (SSH) yazılması gereken kurulum komutlarını tarayıcınızdan site adresini açarak tek tıkla çalıştıracaksınız:

### 7.1: Veritabanı Tablolarını Oluşturma
Tarayıcınızın (Chrome, Edge vb.) adres çubuğuna şu adresi yazıp Enter'a basın:
`http://alanadiniz.com/api/run-migrations`
* **Ekranda görmeniz gereken çıktı:** `{"success":true,"message":"Database migrations successfully executed."}`
* *Bu sayede tablolarınız otomatik oluşturulur.*

### 7.2: Fotoğraf ve PDF Klasör Bağlantılarını Aktif Etme
Tarayıcınızın adres çubuğuna şu adresi yazıp Enter'a basın:
`http://alanadiniz.com/api/link-storage`
* **Ekranda görmeniz gereken çıktı:** `{"success":true,"message":"Storage symlink successfully created."}`
* *Bu sayede yüklenen fotoğraflar ve hazırlanan PDF teklifleri erişilebilir olur.*

---

## 8. cPanel Üzerinden Zamanlanmış Görevi (Cron Job) Ayarlama

Kullanıcıların fotoğraf analizleri ve PDF oluşturma işlemlerinin arka planda çalışabilmesi için hostinginize dakikalık tetikleme kurmalısınız.

1. **cPanel** ana sayfasına dönün.
2. Arama kutusuna **Cron** yazıp **Zamanlanmış Görevler (Cron Jobs)** uygulamasını açın.
3. Sayfayı aşağı kaydırıp **Yeni Zamanlanmış Görev Ekle** kısmına gelin:
   * **Ortak Ayarlar (Common Settings):** Açılır menüden **Dakikada Bir kere (Once Per Minute - * * * * *)** seçeneğini seçin.
   * **Komut (Command):** Aşağıdaki komutu kopyalayıp yapıştırın (kendi hosting kullanıcı adınızı yazın - cPanel ana sayfasının sağ üstünde yazar):
     ```bash
     /usr/local/bin/php /home/hosting_kullanici_adiniz/erca_backend/artisan schedule:run >> /dev/null 2>&1
     ```
4. **Yeni Zamanlanmış Görev Ekle (Add New Cron Job)** butonuna tıklayın.

Kurulum işlemi tamamen bitti! Artık tarayıcınızdan `http://alanadiniz.com` yazarak projenizi canlı olarak kullanmaya ve müşterilerinize sunmaya başlayabilirsiniz.

---

## 9. Olası Hatalar ve Çözümleri

### 9.1: Fotoğraf Yüklerken Sunucu Hatası (cPanel Limitleri)
Sunucularda genellikle varsayılan dosya yükleme limiti 2MB'tır. Analiz için yüksek çözünürlüklü fotoğraflar yüklenirken hata alırsanız limitleri yükseltmeniz gerekir:
1. **cPanel** ana sayfasına dönün.
2. Arama kutusuna **Select PHP Version** (PHP Sürümü Seçin) yazıp bu menüyü açın.
3. Üstteki **Options (Seçenekler)** sekmesine tıklayın.
4. Sayfayı aşağı kaydırarak şu değerleri bulun ve tıklayarak yükseltin:
   * `upload_max_filesize` değerini `20M` (20 Megabayt) yapın.
   * `post_max_size` değerini `20M` (20 Megabayt) yapın.
5. Değişiklikler otomatik olarak kaydedilecektir. Sitenizi yenileyip tekrar deneyebilirsiniz.


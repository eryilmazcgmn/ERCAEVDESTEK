# Adım Adım Local (XAMPP İle) Kurulum Kılavuzu

Bu kılavuz, kodlama veya web geliştirme konusunda **hiçbir teknik bilgisi olmayan birinin dahi** ERCA Ev Destek platformunu XAMPP kullanarak kendi Windows bilgisayarında çalıştırıp test edebilmesi için sıfırdan hazırlanmıştır.

---

## 1. Gerekli Programların Kurulumu

Kendi bilgisayarınızda bir web sitesini, PHP kodlarını ve veritabanını çalıştırabilmek için aşağıdaki 3 ücretsiz aracı kurmanız gerekir:

### 1.1: Node.js Kurulumu (Ön Yüz/React İçin)
1. [Node.js Resmi Web Sitesi'ne](https://nodejs.org/) gidin.
2. Ekranda önerilen **LTS (Kararlı Versiyon)** indirme butonuna tıklayarak kurulum dosyasını indirin.
3. İnen dosyayı açıp "Next > Next > Install" diyerek standart bir program kurar gibi kurun.

### 1.2: XAMPP Kurulumu (PHP ve MySQL Veritabanı İçin)
1. [XAMPP Resmi Web Sitesi'ne](https://www.apachefriends.org/download.html) gidin.
2. Windows için olan en güncel sürümü (PHP 8.2+ içeren) indirin.
3. Kurulum dosyasını çalıştırın (UAC uyarısı gelirse "OK" deyin). Kurulum sihirbazında varsayılan ayarları bozmadan "Next" diyerek `C:\xampp` dizinine kurulumu tamamlayın.

### 1.3: Composer Kurulumu (Laravel Bağımlılık Yöneticisi)
Laravel projelerinin çalışabilmesi için PHP paket yöneticisi olan Composer kurulmalıdır.
1. [Composer Web Sitesi'ne](https://getcomposer.org/download/) gidin ve **Composer-Setup.exe** dosyasını indirin.
2. Kurulumu başlatın ("Install for all users" seçin).
3. Kurulum sırasında program sizden PHP yolunu isteyecektir. Otomatik olarak bulamazsa, bilgisayarınızdaki şu yolu gösterin:
   `C:\xampp\php\php.exe`
4. "Next" diyerek kurulumu bitirin.

---

## 2. XAMPP Sunucularını Çalıştırma

1. Masaüstündeki veya Windows Arama çubuğundaki **XAMPP Control Panel** uygulamasını açın.
2. Apache ve MySQL satırlarının hizasındaki **Start** butonlarına tıklayın.
3. Butonların arka planı yeşile döndüğünde ve yanında port numaraları yazmaya başladığında yerel sunucunuz çalışıyor demektir.

---

## 3. Local Veritabanı (MySQL) Oluşturma

1. Tarayıcınızı (Chrome, Edge vb.) açın ve adres satırına şunu yazıp Enter'a basın:
   `http://localhost/phpmyadmin/`
2. Sol menünün en üstündeki **Yeni (New)** butonuna tıklayın.
3. **Veritabanı oluştur** alanındaki veritabanı adı kutusuna tam olarak **`erca_ev_destek`** yazın.
4. Karşılaştırma dilini varsayılan bırakıp sağdaki **Oluştur (Create)** butonuna tıklayın.
5. Veritabanınız oluşturuldu. Tarayıcı sekmesini kapatabilirsiniz.

---

## 4. YÖNTEM A: Geliştirici Sunucusu Kurulumu (Hızlı Test)

Bu yöntem, dosyaları masaüstündeki mevcut konumunda (`ERCAEVDESTEK`) bırakarak iki ayrı terminal/komut satırı penceresi yardımıyla hızlıca test etmek içindir.

### 4.1: Arka Yüzün (Backend - Laravel) Başlatılması
1. Bilgisayarınızda `c:\Users\Eryil\Desktop\ERCAEVDESTEK\backend` klasöründeki `.env` dosyasını açıp veritabanı ayarlarını kontrol edin:
   ```ini
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=erca_ev_destek
   DB_USERNAME=root
   DB_PASSWORD=
   ```
2. Windows Arama çubuğuna **cmd** yazıp **Komut İstemi**'ni açın.
3. Backend klasörüne geçiş yapın:
   ```bash
   cd c:\Users\Eryil\Desktop\ERCAEVDESTEK\backend
   ```
4. Tabloları oluşturun ve sembolik bağı bağlayın:
   ```bash
   php artisan migrate
   php artisan storage:link
   ```
5. Sunucuyu başlatın:
   ```bash
   php artisan serve
   ```
   *Ekranda `Server running on [http://127.0.0.1:8000]` yazacaktır. Bu pencereyi kapatmayın.*

### 4.2: Ön Yüzün (Frontend - React) Başlatılması
1. **İkinci bir cmd (Komut İstemi)** penceresi açın.
2. Frontend dizinine gidin:
   ```bash
   cd c:\Users\Eryil\Desktop\ERCAEVDESTEK\frontend
   ```
3. Paketleri yükleyip arayüzü başlatın:
   ```bash
   npm install
   npm run dev
   ```
   *Ekranda `Local: http://localhost:5173/` yazacaktır. Artık tarayıcınızda bu adrese girerek test edebilirsiniz.*

---

## 5. YÖNTEM B: XAMPP htdocs İçine Kurulum (Kalıcı / Sürekli Çalışan Düzen)

Bu yöntem, terminal pencerelerini sürekli açık tutmak istemiyorsanız, tüm sistemi XAMPP'ın kendi web sunucusuna kopyalayarak kalıcı çalıştırmak içindir.

### 5.1: Dosyaları XAMPP Klasörlerine Dağıtma

Tüm projenizin XAMPP üzerinde çalışabilmesi için dosyaları aşağıdaki düzene göre yerleştirmeniz gerekir:

#### 1. Ön Yüz (Frontend) Dosyaları:
* İlk olarak frontend klasöründe derleme yapın (Bu işlem kodları tarayıcının anlayacağı optimize edilmiş HTML/JS dosyalarına çevirir):
  ```bash
  cd c:\Users\Eryil\Desktop\ERCAEVDESTEK\frontend
  npm run build
  ```
* İşlem bittiğinde `frontend` içerisinde **`dist`** adında bir klasör oluşacaktır.
* `c:\Users\Eryil\Desktop\ERCAEVDESTEK\frontend\dist` klasörünün **içindeki tüm dosyaları** kopyalayın.
* **`C:\xampp\htdocs\`** klasörünün içine yapıştırın. (Eğer htdocs içerisinde varsayılan XAMPP dosyaları varsa, çakışmayı önlemek için htdocs içerisindekileri silebilirsiniz).

#### 2. Arka Yüz (Backend) Dosyaları:
* Masaüstündeki `c:\Users\Eryil\Desktop\ERCAEVDESTEK\backend` klasörünü **komple klasör olarak** kopyalayın.
* **`C:\xampp\htdocs\`** klasörünün içerisine yapıştırın.
* Klasörün XAMPP içerisindeki yeni yolu tam olarak **`C:\xampp\htdocs\backend`** olmalıdır.

---

### 5.2: Storage Bağlantısı (Sembolik Link) Ayarı
XAMPP Apache sunucusunun yüklenen resimlere erişebilmesi için `htdocs` ile backend `storage` arasında sembolik bağ oluşturulmalıdır:
1. Windows Başlat menüsüne **cmd** yazın, sağ tıklayıp **Yönetici Olarak Çalıştır** seçeneğini seçin.
2. Gelen ekrana şu komutu yazıp Enter'a basın:
   ```cmd
   mklink /d "C:\xampp\htdocs\storage" "C:\xampp\htdocs\backend\storage\app\public"
   ```
   *Ekranda "sembolik bağ oluşturuldu" yazısı gelecektir.*

---

### 5.3: Ortam Ayarları (.env) Güncellemesi
1. **`C:\xampp\htdocs\backend\.env`** dosyasını not defteri ile açın.
2. Aşağıdaki satırları XAMPP URLs düzenine göre güncelleyin:
   ```ini
   APP_URL=http://localhost/backend/public
   FRONTEND_URL=http://localhost
   ```
3. Dosyayı kaydedip kapatın.

---

### 5.4: Veritabanı ve Admin Seed Kurulumu
1. Komut istemini (cmd) açın.
2. XAMPP içindeki backend klasörüne gidin:
   ```bash
   cd C:\xampp\htdocs\backend
   ```
3. Veritabanı tablolarını çalıştırın, admin kullanıcısını tohumlayın ve config önbelleğini temizleyin:
   ```bash
   php artisan migrate --force
   php artisan db:seed --class=AdminUserSeeder
   php artisan config:cache
   ```

---

### 5.5: Erişim ve Kullanım
Kurulum tamamlandı!
* Artık herhangi bir terminal veya komut satırı ekranı açık bırakmanıza gerek yoktur.
* Tarayıcınızı açıp doğrudan **`http://localhost`** yazarak uygulamayı kullanabilirsiniz.
* Admin girişi için sağ üstteki **CRM Girişi** butonuna tıklayarak `.env` içinde tanımlanan şifreyle (Varsayılan: `admin` / `ErcaAdmin2026!`) giriş yapabilirsiniz.

---

## 6. Olası Hatalar ve Çözümleri

### 6.1: Büyük Görseller Yüklenirken Hata Oluşması (XAMPP Limitleri)
XAMPP varsayılan olarak maksimum 2MB boyutunda dosya yüklenmesine izin verir. Yüksek çözünürlüklü fotoğrafları yüklediğinizde sunucu hatası alıyorsanız limitleri artırmalısınız:
1. **XAMPP Kontrol Paneli**'ni açın.
2. **Apache** satırındaki **Config** butonuna tıklayın ve açılan listeden **PHP (php.ini)** seçeneğini seçin.
3. Açılan not defterinde `Ctrl + F` yaparak şu iki değeri bulun ve aşağıdaki gibi güncelleyin:
   * `upload_max_filesize = 2M` satırını `upload_max_filesize = 20M` yapın.
   * `post_max_size = 8M` satırını `post_max_size = 20M` yapın.
4. Dosyayı kaydedip kapatın.
5. XAMPP Kontrol Panelinde Apache'yi **Stop** edip ardından tekrar **Start** edin.

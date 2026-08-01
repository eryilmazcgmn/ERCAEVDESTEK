<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('service_prices', function (Blueprint $table) {
            $table->id();
            $table->string('service_type');
            $table->string('question_id');
            $table->string('option_value');
            $table->string('label');
            $table->integer('price')->default(0);
            $table->timestamps();

            // Unique index to prevent duplicate entries
            $table->unique(['service_type', 'question_id', 'option_value'], 'service_price_unique');
        });

        // Seed initial pricing data
        $initialPrices = [
            // PAINT SERVICE
            [
                'service_type' => 'paint',
                'question_id' => 'spaceType',
                'option_value' => 'Ev',
                'label' => 'Alan Tipi: Ev',
                'price' => 0,
            ],
            [
                'service_type' => 'paint',
                'question_id' => 'spaceType',
                'option_value' => 'Ofis',
                'label' => 'Alan Tipi: Ofis',
                'price' => 500,
            ],
            [
                'service_type' => 'paint',
                'question_id' => 'spaceType',
                'option_value' => 'Dükkan/Mağaza',
                'label' => 'Alan Tipi: Dükkan/Mağaza',
                'price' => 1000,
            ],
            [
                'service_type' => 'paint',
                'question_id' => 'spaceType',
                'option_value' => 'Diğer',
                'label' => 'Alan Tipi: Diğer',
                'price' => 0,
            ],
            [
                'service_type' => 'paint',
                'question_id' => 'spaceSize',
                'option_value' => 'Sadece 1 Duvar',
                'label' => 'Alan Büyüklüğü: Sadece 1 Duvar',
                'price' => 1500,
            ],
            [
                'service_type' => 'paint',
                'question_id' => 'spaceSize',
                'option_value' => '1 Oda',
                'label' => 'Alan Büyüklüğü: 1 Oda',
                'price' => 3500,
            ],
            [
                'service_type' => 'paint',
                'question_id' => 'spaceSize',
                'option_value' => '1+1 Komple',
                'label' => 'Alan Büyüklüğü: 1+1 Komple',
                'price' => 8000,
            ],
            [
                'service_type' => 'paint',
                'question_id' => 'spaceSize',
                'option_value' => '2+1 Komple',
                'label' => 'Alan Büyüklüğü: 2+1 Komple',
                'price' => 12000,
            ],
            [
                'service_type' => 'paint',
                'question_id' => 'spaceSize',
                'option_value' => '3+1 Komple',
                'label' => 'Alan Büyüklüğü: 3+1 Komple',
                'price' => 16000,
            ],
            [
                'service_type' => 'paint',
                'question_id' => 'spaceSize',
                'option_value' => 'Daha Büyük',
                'label' => 'Alan Büyüklüğü: Daha Büyük',
                'price' => 20000,
            ],
            [
                'service_type' => 'paint',
                'question_id' => 'furnishing',
                'option_value' => 'Boş',
                'label' => 'Eşya Durumu: Boş',
                'price' => 0,
            ],
            [
                'service_type' => 'paint',
                'question_id' => 'furnishing',
                'option_value' => 'Eşyalı',
                'label' => 'Eşya Durumu: Eşyalı',
                'price' => 2000,
            ],
            [
                'service_type' => 'paint',
                'question_id' => 'plasterRepair',
                'option_value' => 'Gerekmiyor',
                'label' => 'Alçı/Tamirat: Gerekmiyor',
                'price' => 0,
            ],
            [
                'service_type' => 'paint',
                'question_id' => 'plasterRepair',
                'option_value' => 'Hafif tamirat var',
                'label' => 'Alçı/Tamirat: Hafif tamirat var',
                'price' => 1500,
            ],
            [
                'service_type' => 'paint',
                'question_id' => 'plasterRepair',
                'option_value' => 'Yoğun tamirat var',
                'label' => 'Alçı/Tamirat: Yoğun tamirat var',
                'price' => 4000,
            ],
            [
                'service_type' => 'paint',
                'question_id' => 'material',
                'option_value' => 'Firma temin etsin (Malzeme + İşçilik)',
                'label' => 'Malzeme: Firma temin etsin (Malzeme + İşçilik)',
                'price' => 4000,
            ],
            [
                'service_type' => 'paint',
                'question_id' => 'material',
                'option_value' => 'Ben temin edeceğim (Sadece işçilik)',
                'label' => 'Malzeme: Ben temin edeceğim (Sadece işçilik)',
                'price' => 0,
            ],

            // TV MOUNT SERVICE
            [
                'service_type' => 'tv-mount',
                'question_id' => 'tvSize',
                'option_value' => '32 inç ve altı',
                'label' => 'TV Boyutu: 32 inç ve altı',
                'price' => 750,
            ],
            [
                'service_type' => 'tv-mount',
                'question_id' => 'tvSize',
                'option_value' => '40 - 50 inç arası',
                'label' => 'TV Boyutu: 40 - 50 inç arası',
                'price' => 1000,
            ],
            [
                'service_type' => 'tv-mount',
                'question_id' => 'tvSize',
                'option_value' => '55 - 65 inç arası',
                'label' => 'TV Boyutu: 55 - 65 inç arası',
                'price' => 1500,
            ],
            [
                'service_type' => 'tv-mount',
                'question_id' => 'tvSize',
                'option_value' => '70 inç ve üzeri',
                'label' => 'TV Boyutu: 70 inç ve üzeri',
                'price' => 2000,
            ],
            [
                'service_type' => 'tv-mount',
                'question_id' => 'wallType',
                'option_value' => 'Beton / Tuğla',
                'label' => 'Duvar Yapısı: Beton / Tuğla',
                'price' => 0,
            ],
            [
                'service_type' => 'tv-mount',
                'question_id' => 'wallType',
                'option_value' => 'Alçıpan',
                'label' => 'Duvar Yapısı: Alçıpan',
                'price' => 500,
            ],
            [
                'service_type' => 'tv-mount',
                'question_id' => 'wallType',
                'option_value' => 'Ahşap / Panel',
                'label' => 'Duvar Yapısı: Ahşap / Panel',
                'price' => 250,
            ],
            [
                'service_type' => 'tv-mount',
                'question_id' => 'wallType',
                'option_value' => 'Emin değilim',
                'label' => 'Duvar Yapısı: Emin değilim',
                'price' => 250,
            ],
            [
                'service_type' => 'tv-mount',
                'question_id' => 'bracketSupplied',
                'option_value' => 'Evet, askı aparatım var',
                'label' => 'Askı Aparatı: Evet, askı aparatım var',
                'price' => 0,
            ],
            [
                'service_type' => 'tv-mount',
                'question_id' => 'bracketSupplied',
                'option_value' => 'Hayır, firma standart aparat getirsin',
                'label' => 'Askı Aparatı: Firma standart aparat getirsin',
                'price' => 500,
            ],
            [
                'service_type' => 'tv-mount',
                'question_id' => 'bracketSupplied',
                'option_value' => 'Hayır, hareketli aparat istiyorum',
                'label' => 'Askı Aparatı: Hareketli aparat istiyorum',
                'price' => 1500,
            ],
            [
                'service_type' => 'tv-mount',
                'question_id' => 'cableManagement',
                'option_value' => 'İstemiyorum',
                'label' => 'Kablo Gizleme: İstemiyorum',
                'price' => 0,
            ],
            [
                'service_type' => 'tv-mount',
                'question_id' => 'cableManagement',
                'option_value' => 'Evet, sıva üstü kanal ile gizlensin',
                'label' => 'Kablo Gizleme: Sıva üstü kanal ile gizlensin',
                'price' => 400,
            ],

            // PLUMBING SERVICE
            [
                'service_type' => 'plumbing',
                'question_id' => 'issueType',
                'option_value' => 'Su kaçağı tespiti ve onarımı',
                'label' => 'Sorun Türü: Su kaçağı tespiti ve onarımı',
                'price' => 2500,
            ],
            [
                'service_type' => 'plumbing',
                'question_id' => 'issueType',
                'option_value' => 'Musluk / Batarya değişimi',
                'label' => 'Sorun Türü: Musluk / Batarya değişimi',
                'price' => 600,
            ],
            [
                'service_type' => 'plumbing',
                'question_id' => 'issueType',
                'option_value' => 'Tıkanıklık açma (Lavabo/WC)',
                'label' => 'Sorun Türü: Tıkanıklık açma (Lavabo/WC)',
                'price' => 1500,
            ],
            [
                'service_type' => 'plumbing',
                'question_id' => 'issueType',
                'option_value' => 'Klozet iç takım arızası',
                'label' => 'Sorun Türü: Klozet iç takım arızası',
                'price' => 750,
            ],
            [
                'service_type' => 'plumbing',
                'question_id' => 'issueType',
                'option_value' => 'Radyatör / Petek temizliği',
                'label' => 'Sorun Türü: Radyatör / Petek temizliği',
                'price' => 2000,
            ],
            [
                'service_type' => 'plumbing',
                'question_id' => 'issueType',
                'option_value' => 'Diğer sıhhi tesisat işleri',
                'label' => 'Sorun Türü: Diğer sıhhi tesisat işleri',
                'price' => 1000,
            ],
            [
                'service_type' => 'plumbing',
                'question_id' => 'urgency',
                'option_value' => 'Acil (Hemen gelinsin)',
                'label' => 'Aciliyet Durumu: Acil',
                'price' => 1000,
            ],
            [
                'service_type' => 'plumbing',
                'question_id' => 'urgency',
                'option_value' => 'Aynı gün içinde',
                'label' => 'Aciliyet Durumu: Aynı gün',
                'price' => 0,
            ],
            [
                'service_type' => 'plumbing',
                'question_id' => 'urgency',
                'option_value' => 'Uygun bir zamanda',
                'label' => 'Aciliyet Durumu: Uygun zaman',
                'price' => 0,
            ],
            [
                'service_type' => 'plumbing',
                'question_id' => 'materialIncluded',
                'option_value' => 'Ben temin ettim, sadece montaj',
                'label' => 'Malzeme: Ben temin ettim, sadece montaj',
                'price' => 0,
            ],
            [
                'service_type' => 'plumbing',
                'question_id' => 'materialIncluded',
                'option_value' => 'Firma getirsin, fiyata eklensin',
                'label' => 'Malzeme: Firma getirsin, fiyata eklensin',
                'price' => 1500,
            ],
            [
                'service_type' => 'plumbing',
                'question_id' => 'materialIncluded',
                'option_value' => 'Sadece tespit / onarım yapılacak',
                'label' => 'Malzeme: Sadece tespit / onarım',
                'price' => 0,
            ],

            // ELECTRICAL SERVICE
            [
                'service_type' => 'electric',
                'question_id' => 'serviceType',
                'option_value' => 'Avize / Aydınlatma Montajı',
                'label' => 'Hizmet Türü: Avize / Aydınlatma Montajı',
                'price' => 500,
            ],
            [
                'service_type' => 'electric',
                'question_id' => 'serviceType',
                'option_value' => 'Priz / Anahtar değişimi veya ilavesi',
                'label' => 'Hizmet Türü: Priz / Anahtar değişimi',
                'price' => 400,
            ],
            [
                'service_type' => 'electric',
                'question_id' => 'serviceType',
                'option_value' => 'Sigorta atması / Kısa devre arızası',
                'label' => 'Hizmet Türü: Sigorta / Kısa devre arızası',
                'price' => 1500,
            ],
            [
                'service_type' => 'electric',
                'question_id' => 'serviceType',
                'option_value' => 'İnternet / Telefon kablosu çekimi',
                'label' => 'Hizmet Türü: İnternet / Telefon kablosu',
                'price' => 1000,
            ],
            [
                'service_type' => 'electric',
                'question_id' => 'serviceType',
                'option_value' => 'Komple tesisat yenileme',
                'label' => 'Hizmet Türü: Komple tesisat yenileme',
                'price' => 15000,
            ],
            [
                'service_type' => 'electric',
                'question_id' => 'quantity',
                'option_value' => '1 Adet',
                'label' => 'İşlem Adeti: 1 Adet',
                'price' => 0,
            ],
            [
                'service_type' => 'electric',
                'question_id' => 'quantity',
                'option_value' => '2 - 3 Adet',
                'label' => 'İşlem Adeti: 2 - 3 Adet',
                'price' => 500,
            ],
            [
                'service_type' => 'electric',
                'question_id' => 'quantity',
                'option_value' => '4 - 6 Adet',
                'label' => 'İşlem Adeti: 4 - 6 Adet',
                'price' => 1200,
            ],
            [
                'service_type' => 'electric',
                'question_id' => 'quantity',
                'option_value' => 'Belirsiz / Komple Arıza',
                'label' => 'İşlem Adeti: Belirsiz / Komple Arıza',
                'price' => 0,
            ],
            [
                'service_type' => 'electric',
                'question_id' => 'ceilingHeight',
                'option_value' => 'Standart (Max 3 metre)',
                'label' => 'Tavan Yükseklik: Standart',
                'price' => 0,
            ],
            [
                'service_type' => 'electric',
                'question_id' => 'ceilingHeight',
                'option_value' => 'Yüksek tavan / Merdiven boşluğu (Özel iskele/merdiven gerekir)',
                'label' => 'Tavan Yükseklik: Yüksek tavan',
                'price' => 1000,
            ],
            [
                'service_type' => 'electric',
                'question_id' => 'ceilingHeight',
                'option_value' => 'Sadece duvar/zemin işlemi',
                'label' => 'Tavan Yükseklik: Sadece duvar/zemin',
                'price' => 0,
            ],
        ];

        foreach ($initialPrices as $priceRecord) {
            $priceRecord['created_at'] = now();
            $priceRecord['updated_at'] = now();
            DB::table('service_prices')->insert($priceRecord);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_prices');
    }
};

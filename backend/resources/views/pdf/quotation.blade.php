<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Teklif Raporu - ERCA Ev Destek</title>
    <style>
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 11px;
            color: #333;
            line-height: 1.4;
            margin: 0;
            padding: 0;
        }
        .header {
            border-bottom: 2px solid #5b21b6;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        .logo-text {
            font-size: 18px;
            font-weight: bold;
            color: #5b21b6;
        }
        .title {
            font-size: 14px;
            text-transform: uppercase;
            text-align: right;
            margin-top: -25px;
            color: #4b5563;
        }
        .grid {
            width: 100%;
            margin-bottom: 20px;
        }
        .grid td {
            vertical-align: top;
        }
        .col-6 {
            width: 50%;
        }
        .section-title {
            font-size: 11px;
            font-weight: bold;
            background: #f3f4f6;
            padding: 6px 10px;
            border-left: 3px solid #5b21b6;
            margin-top: 15px;
            margin-bottom: 10px;
            text-transform: uppercase;
        }
        table.data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }
        table.data-table th {
            background: #f9fafb;
            font-weight: bold;
            text-align: left;
            padding: 8px;
            border-bottom: 1px solid #e5e7eb;
        }
        table.data-table td {
            padding: 8px;
            border-bottom: 1px solid #e5e7eb;
        }
        .right-text {
            text-align: right;
        }
        .bold {
            font-weight: bold;
        }
        .pricing-box {
            float: right;
            width: 250px;
            margin-top: 10px;
            border: 1px solid #e5e7eb;
            background: #fbfbfb;
            padding: 10px;
            border-radius: 4px;
        }
        .pricing-row {
            clear: both;
            padding: 4px 0;
        }
        .pricing-label {
            float: left;
            color: #6b7280;
        }
        .pricing-value {
            float: right;
            font-weight: bold;
        }
        .total-row {
            border-top: 1px solid #e5e7eb;
            margin-top: 5px;
            padding-top: 5px;
            font-size: 12px;
            color: #111827;
        }
        .footer {
            position: absolute;
            bottom: 30px;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 9px;
            color: #9ca3af;
            border-top: 1px solid #e5e7eb;
            padding-top: 10px;
        }
        .badge {
            background: #dcfce7;
            color: #166534;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: bold;
        }
    </style>
</head>
<body>

    <div class="header">
        <span class="logo-text">{{ mb_strtoupper($settings['company_name'] ?? 'ERCA EV DESTEK MERKEZİ', 'UTF-8') }}</span>
        <div class="title">HİZMET TEKLİF RAPORU</div>
    </div>

    <table class="grid">
        <tr>
            <td class="col-6">
                <span class="bold">Hizmet Sağlayıcı:</span><br>
                {{ $settings['company_name'] ?? 'ERCA Ev Destek Hizmetleri Ltd. Şti.' }}<br>
                {{ $settings['company_address'] ?? 'Kadıköy, İstanbul' }}<br>
                E-posta: {{ $settings['contact_email'] ?? 'destek@ercaevdestek.com' }}<br>
                Tel: {{ $settings['contact_phone'] ?? '0850 123 45 67' }}
            </td>
            <td class="col-6" style="padding-left: 40px;">
                <span class="bold">Müşteri Bilgileri:</span><br>
                Müşteri Adı: {{ $customer['name'] }}<br>
                Telefon: {{ $customer['phone'] }}<br>
                Adres: {{ $customer['address'] ?? 'Belirtilmedi' }}<br>
                Teklif No: #TK-{{ $quotation['id'] }}<br>
                Tarih: {{ date('d.m.Y H:i') }}
            </td>
        </tr>
    </table>

    <div class="section-title">Hizmet Detayları</div>
    <table class="data-table">
        <tr>
            <td class="bold" style="width: 30%;">Talep Edilen Hizmet</td>
            <td>
                @if($quotation['service_type'] === 'tv-mount')
                    Duvara TV Montajı & Askı Kurulumu
                @elseif($quotation['service_type'] === 'paint')
                    Ev / Oda Boyama ve Badana
                @elseif($quotation['service_type'] === 'plumbing')
                    Sıhhi Tesisat Onarımı
                @elseif($quotation['service_type'] === 'electric')
                    Elektrik Hattı & Priz Çekimi
                @else
                    {{ $quotation['service_type'] }}
                @endif
            </td>
        </tr>
        @if(!empty($quotation['details']))
            @foreach($quotation['details'] as $key => $val)
                <tr>
                    <td class="bold">{{ ucfirst(str_replace('-', ' ', $key)) }}</td>
                    <td>{{ is_array($val) ? implode(', ', $val) : $val }}</td>
                </tr>
            @endforeach
        @endif
    </table>

    <div style="clear: both; margin-top: 30px; font-size: 10px; color: #6b7280; max-width: 400px;">
        <span class="bold">Şartlar & Bilgilendirme:</span><br>
        - Bu teklif girmiş olduğunuz detaylar doğrultusunda oluşturulmuş olup 15 gün geçerlidir.<br>
        - %20 Kapora ödemesi Havale / EFT ile tamamlandıktan sonra uzman usta randevusu kesinleşir.<br>
        - Kalan tutar iş bitiminde adreste usta onayından sonra tahsil edilir.
    </div>

    <div class="footer">
        ERCA Ev Destek Platformu tarafından otomatik oluşturulmuştur. Rapor Güvenlik Kodu: {{ hash('crc32', $quotation['id'] . $quotation['created_at']) }}
    </div>

</body>
</html>

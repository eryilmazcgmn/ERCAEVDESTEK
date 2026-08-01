<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>İş Emri Formu - ERCA Ev Destek</title>
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
            border-bottom: 2px solid #2563eb;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        .logo-text {
            font-size: 18px;
            font-weight: bold;
            color: #2563eb;
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
            border-left: 3px solid #2563eb;
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
        .bold {
            font-weight: bold;
        }
        .signature-section {
            margin-top: 40px;
            width: 100%;
        }
        .signature-box {
            width: 45%;
            border-top: 1px solid #9ca3af;
            text-align: center;
            padding-top: 10px;
            font-size: 10px;
            color: #4b5563;
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
        .checkbox {
            width: 12px;
            height: 12px;
            border: 1px solid #4b5563;
            display: inline-block;
            margin-right: 5px;
            vertical-align: middle;
        }
    </style>
</head>
<body>

    <div class="header">
        <span class="logo-text">{{ mb_strtoupper($settings['company_name'] ?? 'ERCA EV DESTEK MERKEZİ', 'UTF-8') }}</span>
        <div class="title">RESMİ İŞ EMRİ FORMU</div>
    </div>

    <table class="grid">
        <tr>
            <td class="col-6">
                <span class="bold">Görevli Teknisyen:</span><br>
                Teknisyen: {{ $work_order['technician_name'] ?? 'Atanmadı' }}<br>
                Planlanan Tarih: {{ $work_order['scheduled_at'] ? \Carbon\Carbon::parse($work_order['scheduled_at'])->format('d.m.Y H:i') : 'Tarih belirlenmedi' }}<br>
                İş Emri Durumu: <span class="bold text-blue-600">{{ strtoupper($work_order['status']) }}</span>
            </td>
            <td class="col-6" style="padding-left: 40px;">
                <span class="bold">Müşteri & Adres:</span><br>
                Müşteri: {{ $customer['name'] }}<br>
                Telefon: {{ $customer['phone'] }}<br>
                Adres: {{ $customer['address'] ?? 'Belirtilmedi' }}<br>
                İş Emri No: #WO-{{ $work_order['id'] }}
            </td>
        </tr>
    </table>

    <div class="section-title">İş Tanımı</div>
    <table class="data-table">
        <tr>
            <td class="bold" style="width: 30%;">Hizmet Türü</td>
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

    @if(!empty($vision_analysis))
        <div class="section-title">Sahada Dikkat Edilmesi Gereken Bulgular & Riskler</div>
        <table class="data-table">
            <tr>
                <td class="bold" style="width: 30%;">Duvar Yapısı</td>
                <td>{{ $vision_analysis['wall_type'] ?? 'Belirlenemedi' }}</td>
            </tr>
            <tr>
                <td class="bold">Priz/Tesisat Konumu</td>
                <td>{{ $vision_analysis['outlets'] ?? 'Belirlenemedi' }}</td>
            </tr>
            <tr>
                <td class="bold" style="color: #ef4444;">Kritik Risk ve Güvenlik Notu</td>
                <td class="bold" style="color: #ef4444;">{{ $vision_analysis['risk_analysis'] ?? 'Normal risk seviyesi.' }}</td>
            </tr>
        </table>
    @endif

    <div class="section-title">Teknisyen Kontrol Listesi (İş Bitiminde İşaretlenecek)</div>
    <div style="padding: 10px 0;">
        <div style="margin-bottom: 8px;"><div class="checkbox"></div> İş güvenliği önlemleri alındı ve çalışma alanı incelendi.</div>
        <div style="margin-bottom: 8px;"><div class="checkbox"></div> Çevredeki priz/tesisat hatları fiziksel dedektörle kontrol edildi.</div>
        <div style="margin-bottom: 8px;"><div class="checkbox"></div> Montaj / onarım işlemi müşteri isteklerine tam uyumlu olarak gerçekleştirildi.</div>
        <div style="margin-bottom: 8px;"><div class="checkbox"></div> Çalışma alanı temizlendi, atıklar toplandı.</div>
        <div style="margin-bottom: 8px;"><div class="checkbox"></div> Müşteriye ürünün / onarımın çalışır durumda olduğu gösterilerek teslim yapıldı.</div>
    </div>

    <table class="signature-section">
        <tr>
            <td class="signature-box" style="float: left;">
                Teknisyen İmza / Tarih
            </td>
            <td class="signature-box" style="float: right;">
                Müşteri Teslim Alındı İmza
            </td>
        </tr>
    </table>

    <div class="footer">
        ERCA Ev Destek Platformu tarafından teknisyen görevlendirmesi için üretilmiştir. Barkod ID: {{ hash('crc32', $work_order['id'] . $work_order['created_at']) }}
    </div>

</body>
</html>

<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>Fiyat Teklifiniz Hazır</title>
</head>
<body style="font-family: sans-serif; background-color: #f8fafc; padding: 20px; color: #0f172a;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 16px; border: 1px solid #e2e8f0;">
        <h2 style="color: #9333ea; margin-top: 0;">ERCA Ev Destek</h2>
        <p>Sayın <strong>{{ $quotation->customer->name ?? 'Müşterimiz' }}</strong>,</p>
        <p>Talebiniz üzerine fiyat teklifiniz başarıyla oluşturulmuştur.</p>
        <div style="background: #f1f5f9; padding: 15px; border-radius: 12px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Hizmet Türü:</strong> {{ strtoupper($quotation->service_type) }}</p>
            <p style="margin: 5px 0;"><strong>Toplam Tutar:</strong> {{ $quotation->price_details['total'] ?? 0 }} TL</p>
            <p style="margin: 5px 0;"><strong>Gerekli Kapora (%20):</strong> {{ $quotation->price_details['deposit_amount'] ?? 0 }} TL</p>
        </div>
        <p>Teklifinizi web sitemizden inceleyip onaylayarak kapora ödemenizi gerçekleştirebilirsiniz.</p>
        <p style="color: #64748b; font-size: 12px; margin-top: 30px;">ERCA Ev Destek Hizmetleri — Ankara Çankaya</p>
    </div>
</body>
</html>

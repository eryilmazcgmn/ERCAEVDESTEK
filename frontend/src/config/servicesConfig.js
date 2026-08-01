export const servicesConfig = {
  'paint': [
    {
      id: 'spaceType',
      label: 'Boyanacak alan nedir?',
      type: 'radio',
      options: ['Ev', 'Ofis', 'Dükkan/Mağaza', 'Diğer'],
      pricing: { 'Ev': 0, 'Ofis': 500, 'Dükkan/Mağaza': 1000, 'Diğer': 0 }
    },
    {
      id: 'spaceSize',
      label: 'Boyanacak alanın büyüklüğü / tipi?',
      type: 'select',
      options: ['Sadece 1 Duvar', '1 Oda', '1+1 Komple', '2+1 Komple', '3+1 Komple', 'Daha Büyük'],
      pricing: { 'Sadece 1 Duvar': 1500, '1 Oda': 3500, '1+1 Komple': 8000, '2+1 Komple': 12000, '3+1 Komple': 16000, 'Daha Büyük': 20000 },
      condition: (answers) => answers.spaceType === 'Ev'
    },
    {
      id: 'spaceSizeM2',
      label: 'Boyanacak alanın yaklaşık büyüklüğü (m²)?',
      type: 'number',
      placeholder: 'Örn: 85',
      pricing: { 'per_unit_price': 80 },
      condition: (answers) => answers.spaceType && answers.spaceType !== 'Ev'
    },
    {
      id: 'furnishing',
      label: 'Mekan eşyalı mı, boş mu?',
      type: 'radio',
      options: ['Boş', 'Eşyalı'],
      pricing: { 'Boş': 0, 'Eşyalı': 2000 }
    },
    {
      id: 'plasterRepair',
      label: 'Duvarlarda alçı tamiri veya çatlak onarımı gerekiyor mu?',
      type: 'radio',
      options: ['Gerekmiyor', 'Hafif tamirat var', 'Yoğun tamirat var'],
      pricing: { 'Gerekmiyor': 0, 'Hafif tamirat var': 1500, 'Yoğun tamirat var': 4000 }
    },
    {
      id: 'material',
      label: 'Boya malzemeleri kim tarafından temin edilecek?',
      type: 'radio',
      options: ['Firma temin etsin (Malzeme + İşçilik)', 'Ben temin edeceğim (Sadece işçilik)'],
      pricing: { 'Firma temin etsin (Malzeme + İşçilik)': 4000, 'Ben temin edeceğim (Sadece işçilik)': 0 }
    }
  ],

  'tv-mount': [
    {
      id: 'tvSize',
      label: 'Televizyonunuzun boyutu (inç) nedir?',
      type: 'select',
      options: ['32 inç ve altı', '40 - 50 inç arası', '55 - 65 inç arası', '70 inç ve üzeri'],
      pricing: { '32 inç ve altı': 750, '40 - 50 inç arası': 1000, '55 - 65 inç arası': 1500, '70 inç ve üzeri': 2000 }
    },
    {
      id: 'wallType',
      label: 'TV\'nin asılacağı duvarın yapısı nedir?',
      type: 'radio',
      options: ['Beton / Tuğla', 'Alçıpan', 'Ahşap / Panel', 'Emin değilim'],
      pricing: { 'Beton / Tuğla': 0, 'Alçıpan': 500, 'Ahşap / Panel': 250, 'Emin değilim': 250 }
    },
    {
      id: 'bracketSupplied',
      label: 'Askı aparatı sizde mevcut mu?',
      type: 'radio',
      options: ['Evet, askı aparatım var', 'Hayır, firma standart aparat getirsin', 'Hayır, hareketli aparat istiyorum'],
      pricing: { 'Evet, askı aparatım var': 0, 'Hayır, firma standart aparat getirsin': 500, 'Hayır, hareketli aparat istiyorum': 1500 }
    },
    {
      id: 'cableManagement',
      label: 'Kablo gizleme (Kanal) işlemi ister misiniz?',
      type: 'radio',
      options: ['İstemiyorum', 'Evet, sıva üstü kanal ile gizlensin'],
      pricing: { 'İstemiyorum': 0, 'Evet, sıva üstü kanal ile gizlensin': 400 }
    }
  ],

  'plumbing': [
    {
      id: 'issueType',
      label: 'Yaşadığınız sorun nedir?',
      type: 'select',
      options: ['Su kaçağı tespiti ve onarımı', 'Musluk / Batarya değişimi', 'Tıkanıklık açma (Lavabo/WC)', 'Klozet iç takım arızası', 'Radyatör / Petek temizliği', 'Diğer sıhhi tesisat işleri'],
      pricing: { 'Su kaçağı tespiti ve onarımı': 2500, 'Musluk / Batarya değişimi': 600, 'Tıkanıklık açma (Lavabo/WC)': 1500, 'Klozet iç takım arızası': 750, 'Radyatör / Petek temizliği': 2000, 'Diğer sıhhi tesisat işleri': 1000 }
    },
    {
      id: 'urgency',
      label: 'Hizmetin aciliyet durumu nedir?',
      type: 'radio',
      options: ['Acil (Hemen gelinsin)', 'Aynı gün içinde', 'Uygun bir zamanda'],
      pricing: { 'Acil (Hemen gelinsin)': 1000, 'Aynı gün içinde': 0, 'Uygun bir zamanda': 0 }
    },
    {
      id: 'materialIncluded',
      label: 'Kullanılacak yedek parça / batarya vb. kim temin edecek?',
      type: 'radio',
      options: ['Ben temin ettim, sadece montaj', 'Firma getirsin, fiyata eklensin', 'Sadece tespit / onarım yapılacak'],
      pricing: { 'Ben temin ettim, sadece montaj': 0, 'Firma getirsin, fiyata eklensin': 1500, 'Sadece tespit / onarım yapılacak': 0 }
    }
  ],

  'electric': [
    {
      id: 'serviceType',
      label: 'İhtiyacınız olan elektrik hizmeti nedir?',
      type: 'select',
      options: ['Avize / Aydınlatma Montajı', 'Priz / Anahtar değişimi veya ilavesi', 'Sigorta atması / Kısa devre arızası', 'İnternet / Telefon kablosu çekimi', 'Komple tesisat yenileme'],
      pricing: { 'Avize / Aydınlatma Montajı': 500, 'Priz / Anahtar değişimi veya ilavesi': 400, 'Sigorta atması / Kısa devre arızası': 1500, 'İnternet / Telefon kablosu çekimi': 1000, 'Komple tesisat yenileme': 15000 }
    },
    {
      id: 'quantity',
      label: 'Kaç adet işlem yapılacak? (Avize sayısı, priz sayısı vb.)',
      type: 'radio',
      options: ['1 Adet', '2 - 3 Adet', '4 - 6 Adet', 'Belirsiz / Komple Arıza'],
      pricing: { '1 Adet': 0, '2 - 3 Adet': 500, '4 - 6 Adet': 1200, 'Belirsiz / Komple Arıza': 0 }
    },
    {
      id: 'ceilingHeight',
      label: 'İşlem yapılacak tavan yüksekliği standart mıdır? (Montaj için)',
      type: 'radio',
      options: ['Standart (Max 3 metre)', 'Yüksek tavan / Merdiven boşluğu (Özel iskele/merdiven gerekir)', 'Sadece duvar/zemin işlemi'],
      pricing: { 'Standart (Max 3 metre)': 0, 'Yüksek tavan / Merdiven boşluğu (Özel iskele/merdiven gerekir)': 1000, 'Sadece duvar/zemin işlemi': 0 }
    }
  ]
};

export const calculateQuotation = (serviceId, formAnswers) => {
  const config = servicesConfig[serviceId];
  if (!config) return { items: [], totalPrice: 500 };

  let total = 0;
  let items = [];
  
  config.forEach(question => {
    if (question.condition && !question.condition(formAnswers)) return;

    const answer = formAnswers[question.id];
    if (!answer) return;

    if (question.type === 'number' && question.pricing && question.pricing.per_unit_price) {
      const price = question.pricing.per_unit_price * parseFloat(answer);
      if (price > 0) {
        items.push({ description: `${question.label} (${answer} m²)`, price });
        total += price;
      }
    } else if (question.pricing && question.pricing[answer]) {
      const price = question.pricing[answer];
      if (price > 0) {
        items.push({ description: `${question.label}: ${answer}`, price });
        total += price;
      }
    }
  });

  return { items, totalPrice: total > 0 ? total : 500 };
};

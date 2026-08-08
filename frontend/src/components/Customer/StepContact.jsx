import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Phone, Mail, ChevronRight, ChevronLeft, ChevronDown, Lock, MapPin, Camera, UploadCloud, Trash2, Image, AlertCircle, Building, Home, Calendar } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { contactSchema } from '../../utils/schemas';

const CANKAYA_NEIGHBORHOODS = [
  '100. Yıl (İşçi Blokları)',
  'Ahlatlıbel',
  'Anıttepe',
  'Aşağı Eğlence / Aşağı Öveçler',
  'Ayrancı (Aşağı / Yukarı)',
  'Bahçelievler',
  'Balgat',
  'Birlik',
  'Beytepe',
  'Büyükesat',
  'Cebeci',
  'Çankaya (Merkez)',
  'Çayyolu',
  'Çiğdem',
  'Dikmen',
  'Emek',
  'Gaziosmanpaşa (GOP)',
  'İlkadım',
  'Kavaklıdere',
  'Kırkkonaklar',
  'Kızılay',
  'Maltepe',
  'Mustafa Kemal',
  'Mutlukent',
  'Oran',
  'Öveçler',
  'Söğütözü',
  'Tunalı Hilmi / Esat',
  'Ümitköy',
  'Yaşamkent',
  'Yıldız',
];

// Clean raw address string from recursive prefixes
function cleanRawAddress(rawAddr) {
  if (!rawAddr) return '';
  // Remove repeated "Ankara / Çankaya / [Mahalle] -" patterns
  let cleaned = rawAddr.replace(/^(Ankara\s*[\/\-]\s*Çankaya\s*[\/\-]\s*)+/gi, '');
  cleaned = cleaned.replace(/^([^\-\-\n]+Mah\.\s*\-?\s*)+/gi, '');
  cleaned = cleaned.replace(/^Bahçelievler\s*[\/\-]\s*/gi, '');
  cleaned = cleaned.replace(/^[\-\/\s;]+/, '').trim();
  return cleaned;
}

export default function StepContact({
  customerName,
  setCustomerName,
  customerPhone,
  setCustomerPhone,
  customerEmail,
  setCustomerEmail,
  customerAddress,
  setCustomerAddress,
  handleUpdateContactAndGetQuote,
  submittingContact,
  submittingQuotation,
  setActiveStep,
  uploadedPhotos = [],
  analyzing = false,
  handlePhotoUpload,
  removePhoto
}) {
  const { settings } = useSettings();
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('Bahçelievler');
  const [showPhotoSection, setShowPhotoSection] = useState(false);

  const [preferredDate, setPreferredDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedSlot, setSelectedSlot] = useState('09:00 - 12:00 (Sabah)');

  const cleanInitialAddress = cleanRawAddress(customerAddress);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: customerName || '',
      phone: customerPhone || '',
      email: customerEmail || '',
      address: cleanInitialAddress || '',
    }
  });

  useEffect(() => {
    if (customerName) setValue('name', customerName);
    if (customerPhone) setValue('phone', customerPhone);
    if (customerEmail) setValue('email', customerEmail);
    if (customerAddress) setValue('address', cleanRawAddress(customerAddress));
  }, [customerName, customerPhone, customerEmail, customerAddress, setValue]);

  const onValidSubmit = (data) => {
    setCustomerName(data.name);
    setCustomerPhone(data.phone);
    setCustomerEmail(data.email || '');

    const streetClean = cleanRawAddress(data.address);
    const fullAddress = `Ankara / Çankaya / ${selectedNeighborhood} Mah. - ${streetClean}`;
    
    setCustomerAddress(fullAddress);
    
    handleUpdateContactAndGetQuote({
      name: data.name,
      phone: data.phone,
      email: data.email || '',
      address: fullAddress,
      preferred_date: preferredDate,
      time_slot: selectedSlot
    });
  };

  const isSubmitting = submittingContact || submittingQuotation;

  return (
    <div className="flex-1 flex flex-col justify-between">
      <div>
        {/* Step Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">İletişim & Adres Bilgileri</h2>
          </div>
          <span className="text-xs text-primary-600 dark:text-primary-400 font-semibold flex items-center gap-1 bg-primary-50 dark:bg-primary-950/40 px-2.5 py-1 rounded-full border border-primary-200 dark:border-primary-500/20">
            <Lock className="w-3.5 h-3.5" />
            256-Bit SSL Güvenli
          </span>
        </div>

        <div className="max-w-xl mx-auto space-y-6">
          {/* Service Area Info */}
          <div className="bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-500/20 rounded-2xl p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="text-xs text-slate-700 dark:text-gray-300">
              <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
                Hizmet Bölgemiz: {settings?.company_address || 'Ankara — Çankaya'}
              </span>
              Uzman ustalarımız Çankaya ve çevre mahallelerine hızlı servis sağlamaktadır.
            </div>
          </div>

          {/* Form */}
          <form id="contactForm" onSubmit={handleSubmit(onValidSubmit)} className="space-y-5">
            
            {/* Section 1: Kişisel ve İletişim Bilgileri */}
            <div className="space-y-4 bg-white dark:bg-gray-950 p-5 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-gray-800">
                <User className="w-3.5 h-3.5 text-primary-500" />
                Kişisel İletişim Bilgileri
              </h3>

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-gray-300 block">
                  Adınız Soyadınız <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <User className="h-4 w-4 text-slate-400" />
                  </span>
                  <input
                    type="text"
                    {...register('name')}
                    placeholder="Örn: Ahmet Erdem"
                    className={`w-full bg-slate-50 dark:bg-gray-900 border ${
                      errors.name ? 'border-red-500 ring-2 ring-red-500/10' : 'border-slate-200 dark:border-gray-800'
                    } rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-primary-500 dark:text-white transition`}
                  />
                </div>
                {errors.name && (
                  <p className="text-xs text-red-500 flex items-center gap-1 font-medium mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-gray-300 block">
                  Telefon Numaranız <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <Phone className="h-4 w-4 text-slate-400" />
                  </span>
                  <input
                    type="tel"
                    {...register('phone')}
                    placeholder="0532 123 45 67"
                    className={`w-full bg-slate-50 dark:bg-gray-900 border ${
                      errors.phone ? 'border-red-500 ring-2 ring-red-500/10' : 'border-slate-200 dark:border-gray-800'
                    } rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-primary-500 dark:text-white transition`}
                  />
                </div>
                {errors.phone ? (
                  <p className="text-xs text-red-500 flex items-center gap-1 font-medium mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {errors.phone.message}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400 dark:text-gray-500">Teklif bilgilendirmesi SMS olarak gönderilir.</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-gray-300 block">
                  E-posta Adresi <span className="font-normal text-slate-400">(İsteğe bağlı)</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-400" />
                  </span>
                  <input
                    type="email"
                    {...register('email')}
                    placeholder="ahmet@example.com"
                    className={`w-full bg-slate-50 dark:bg-gray-900 border ${
                      errors.email ? 'border-red-500 ring-2 ring-red-500/10' : 'border-slate-200 dark:border-gray-800'
                    } rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-primary-500 dark:text-white transition`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500 flex items-center gap-1 font-medium mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            {/* Section 2: Hizmet Adresi */}
            <div className="space-y-4 bg-white dark:bg-gray-950 p-5 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-gray-800">
                <Building className="w-3.5 h-3.5 text-primary-500" />
                Hizmet Yapılacak Adres
              </h3>

              {/* Neighborhood */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-gray-300 block">
                  Mahalle Seçiniz <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedNeighborhood}
                  onChange={(e) => setSelectedNeighborhood(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary-500 dark:text-white transition"
                >
                  {CANKAYA_NEIGHBORHOODS.map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              {/* Street / Building Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-gray-300 block">
                  Sokak / Bina / Daire No <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute top-3.5 left-0 flex items-start pl-4 pointer-events-none">
                    <Home className="h-4 w-4 text-slate-400" />
                  </span>
                  <input
                    type="text"
                    {...register('address')}
                    placeholder="Örn: 7. Cadde, Menekşe Apt. No: 12/4"
                    className={`w-full bg-slate-50 dark:bg-gray-900 border ${
                      errors.address ? 'border-red-500 ring-2 ring-red-500/10' : 'border-slate-200 dark:border-gray-800'
                    } rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-primary-500 dark:text-white transition`}
                  />
                </div>
                {errors.address ? (
                  <p className="text-xs text-red-500 flex items-center gap-1 font-medium mt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {errors.address.message}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400 dark:text-gray-500">Ustanın adrese ulaşabilmesi için sokak ve bina nosunu giriniz.</p>
                )}
              </div>
            </div>

            {/* Section 3: Tercih Edilen Servis Zamanı */}
            <div className="space-y-4 bg-white dark:bg-gray-950 p-5 rounded-2xl border border-slate-200 dark:border-gray-800 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-gray-800">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                Tercih Edilen Servis Zamanı (Randevu)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-gray-300 block">Servis Günü</label>
                  <input
                    type="date"
                    value={preferredDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-blue-500 dark:text-white transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-gray-300 block">Saat Dilimi</label>
                  <div className="grid grid-cols-1 gap-2">
                    {['09:00 - 12:00 (Sabah)', '12:00 - 15:00 (Öğle)', '15:00 - 18:00 (Akşamüstü)', '18:00 - 21:00 (Mesai Sonrası)'].map(slot => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-2.5 rounded-xl text-xs font-semibold text-left border transition ${
                          selectedSlot === slot
                            ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-600 dark:text-blue-400 font-bold shadow-sm'
                            : 'bg-slate-50 dark:bg-gray-900 border-slate-200 dark:border-gray-800 text-slate-600 dark:text-gray-400 hover:border-slate-300'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </form>

          {/* Collapsible Photo Section */}
          {handlePhotoUpload && (
            <div className="border border-slate-200 dark:border-gray-800 rounded-2xl overflow-hidden bg-white dark:bg-gray-950 shadow-sm">
              <button
                type="button"
                onClick={() => setShowPhotoSection(!showPhotoSection)}
                className="w-full flex items-center justify-between p-4 bg-slate-50/80 dark:bg-gray-900/40 text-left hover:bg-slate-100 dark:hover:bg-gray-800/40 transition"
              >
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-primary-500" />
                  <span className="text-xs font-bold text-slate-700 dark:text-gray-300">
                    İş Alanı Fotoğrafı Ekle
                    <span className="text-[11px] font-normal text-slate-400 ml-1.5">(İsteğe bağlı)</span>
                  </span>
                  {uploadedPhotos.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 text-[10px] font-bold">
                      {uploadedPhotos.length} Fotoğraf
                    </span>
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showPhotoSection ? 'rotate-180' : ''}`} />
              </button>

              {showPhotoSection && (
                <div className="p-4 border-t border-slate-200 dark:border-gray-800 space-y-3">
                  <div className="border border-dashed border-slate-300 dark:border-gray-700 rounded-xl p-4 flex flex-col items-center justify-center text-center relative bg-slate-50/50 dark:bg-gray-900/20 hover:border-primary-400 transition">
                    <input 
                      type="file" 
                      accept="image/*,application/pdf" 
                      onChange={handlePhotoUpload} 
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      aria-label="Fotoğraf yükle"
                    />
                    <UploadCloud className="w-6 h-6 text-primary-400 mb-1.5" />
                    <span className="text-xs font-semibold text-slate-600 dark:text-gray-400">
                      Fotoğraf yüklemek için tıklayın
                    </span>
                  </div>

                  {analyzing && (
                    <div className="flex items-center gap-2 text-xs text-primary-500 font-medium justify-center p-2 rounded-lg bg-primary-50 dark:bg-primary-950/20">
                      <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-primary-500 border-t-transparent"></span>
                      Yükleniyor...
                    </div>
                  )}

                  {uploadedPhotos.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {uploadedPhotos.map((url, i) => (
                        <div key={i} className="h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-gray-800 relative group bg-slate-100 dark:bg-gray-900">
                          <img src={url} alt={`Fotoğraf ${i + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5">
                            <a href={url} target="_blank" rel="noreferrer" className="p-1 rounded bg-white/20 hover:bg-white/40 text-white transition">
                              <Image className="w-3 h-3" />
                            </a>
                            <button type="button" onClick={() => removePhoto(i)} className="p-1 rounded bg-red-600/80 hover:bg-red-600 text-white transition">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-3 pt-6 border-t border-slate-200 dark:border-gray-800 mt-6 md:relative fixed bottom-0 left-0 right-0 p-4 md:p-0 bg-white dark:bg-gray-950 md:bg-transparent border-t md:border-t-0 border-slate-200 dark:border-gray-800 z-30">
        <button 
          type="button" 
          onClick={() => setActiveStep(2)} 
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 text-sm font-semibold text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-800 transition flex items-center justify-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          Geri
        </button>
        <button 
          type="submit" 
          form="contactForm"
          disabled={isSubmitting}
          className={`w-full sm:w-auto px-8 py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 ${
            isSubmitting 
              ? 'bg-primary-600 text-white cursor-wait opacity-80' 
              : 'bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-500 hover:to-blue-500 text-white shadow-primary-900/15 font-bold text-sm'
          }`}
        >
          {isSubmitting ? (
            <div className="flex items-center gap-3 py-0.5">
              <span className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></span>
              <span className="font-semibold animate-pulse text-sm">Fiyat teklifiniz hazırlanıyor...</span>
            </div>
          ) : (
            <>
              Fiyat Teklifimi Hazırla
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

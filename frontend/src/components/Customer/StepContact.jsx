import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Phone, Mail, ChevronRight, ChevronLeft, ChevronDown, Lock, MapPin, Camera, UploadCloud, Trash2, Image } from 'lucide-react';
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
  // Photo upload props (merged from StepAnalysis)
  uploadedPhotos = [],
  analyzing = false,
  handlePhotoUpload,
  removePhoto
}) {
  const { settings } = useSettings();
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('Bahçelievler');
  const [showPhotoSection, setShowPhotoSection] = useState(false);

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
      address: customerAddress || '',
    }
  });

  useEffect(() => {
    if (customerName) setValue('name', customerName);
    if (customerPhone) setValue('phone', customerPhone);
    if (customerEmail) setValue('email', customerEmail);
    if (customerAddress) setValue('address', customerAddress);
  }, [customerName, customerPhone, customerEmail, customerAddress, setValue]);

  const onValidSubmit = (data) => {
    setCustomerName(data.name);
    setCustomerPhone(data.phone);
    setCustomerEmail(data.email || '');

    const fullAddress = data.address.includes('Çankaya') 
      ? data.address 
      : `${settings?.company_address || 'Ankara / Çankaya'} / ${selectedNeighborhood} - ${data.address}`;
    
    setCustomerAddress(fullAddress);
    
    handleUpdateContactAndGetQuote({
      name: data.name,
      phone: data.phone,
      email: data.email || '',
      address: fullAddress
    });
  };

  const isSubmitting = submittingContact || submittingQuotation;

  return (
    <div className="flex-1 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">İletişim & Adres</h2>
          </div>
          <span className="text-xs text-primary-400 font-medium flex items-center gap-1">
            <Lock className="w-3.5 h-3.5" />
            Güvenli
          </span>
        </div>

        <div className="max-w-lg mx-auto space-y-5 mt-2">
          {/* Service area info — compact */}
          <div className="bg-primary-50/80 dark:bg-primary-950/30 border border-primary-200/60 dark:border-primary-500/20 rounded-xl p-3 flex items-center gap-2.5">
            <MapPin className="w-4 h-4 text-primary-500 shrink-0" />
            <span className="text-xs text-primary-700 dark:text-primary-300">
              <strong className="text-slate-900 dark:text-white">{settings?.company_address || 'Ankara — Çankaya'}</strong> bölgesi hizmet ağı
            </span>
          </div>

          {/* Contact Form */}
          <form id="contactForm" onSubmit={handleSubmit(onValidSubmit)} className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-gray-400 block ml-1">Adınız Soyadınız *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <User className="h-4 w-4 text-slate-400 dark:text-gray-500" />
                </span>
                <input
                  type="text"
                  {...register('name')}
                  placeholder="Ahmet Yılmaz"
                  className={`w-full bg-white dark:bg-gray-950 border ${
                    errors.name ? 'border-red-500' : 'border-slate-200 dark:border-gray-800'
                  } rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 text-slate-800 dark:text-gray-200 transition`}
                />
              </div>
              {errors.name && <p className="text-xs text-red-500 ml-1">{errors.name.message}</p>}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-gray-400 block ml-1">Telefon Numaranız *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <Phone className="h-4 w-4 text-slate-400 dark:text-gray-500" />
                </span>
                <input
                  type="tel"
                  {...register('phone')}
                  placeholder="0555 123 4567"
                  className={`w-full bg-white dark:bg-gray-950 border ${
                    errors.phone ? 'border-red-500' : 'border-slate-200 dark:border-gray-800'
                  } rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 text-slate-800 dark:text-gray-200 transition`}
                />
              </div>
              {errors.phone && <p className="text-xs text-red-500 ml-1">{errors.phone.message}</p>}
            </div>

            {/* Neighborhood + Address */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-gray-400 block ml-1">Mahalle *</label>
                <select
                  value={selectedNeighborhood}
                  onChange={(e) => setSelectedNeighborhood(e.target.value)}
                  className="w-full bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 text-slate-800 dark:text-gray-200 transition"
                >
                  {CANKAYA_NEIGHBORHOODS.map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-gray-400 block ml-1">Sokak / Bina / Daire *</label>
                <input
                  type="text"
                  {...register('address')}
                  placeholder="7. Cad. No:12/4"
                  className={`w-full bg-white dark:bg-gray-950 border ${
                    errors.address ? 'border-red-500' : 'border-slate-200 dark:border-gray-800'
                  } rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 text-slate-800 dark:text-gray-200 transition`}
                />
                {errors.address && <p className="text-xs text-red-500 ml-1">{errors.address.message}</p>}
              </div>
            </div>

            {/* Email — optional, collapsed */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-gray-400 block ml-1">E-posta <span className="font-normal">(isteğe bağlı)</span></label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400 dark:text-gray-500" />
                </span>
                <input
                  type="email"
                  {...register('email')}
                  placeholder="ahmet@example.com"
                  className={`w-full bg-white dark:bg-gray-950 border ${
                    errors.email ? 'border-red-500' : 'border-slate-200 dark:border-gray-800'
                  } rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 text-slate-800 dark:text-gray-200 transition`}
                />
              </div>
              {errors.email && <p className="text-xs text-red-500 ml-1">{errors.email.message}</p>}
            </div>
          </form>

          {/* ─── Photo Upload — Collapsible Section ─── */}
          {handlePhotoUpload && (
            <div className="border border-slate-200 dark:border-gray-800 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowPhotoSection(!showPhotoSection)}
                className="w-full flex items-center justify-between p-3.5 bg-slate-50/80 dark:bg-gray-900/40 text-left hover:bg-slate-100 dark:hover:bg-gray-800/40 transition"
              >
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-primary-400" />
                  <span className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                    Fotoğraf Ekle
                    <span className="text-xs font-normal text-slate-400 dark:text-gray-500 ml-1.5">(isteğe bağlı)</span>
                  </span>
                  {uploadedPhotos.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-md bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 text-[10px] font-bold">
                      {uploadedPhotos.length}
                    </span>
                  )}
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showPhotoSection ? 'rotate-180' : ''}`} />
              </button>

              {showPhotoSection && (
                <div className="p-4 border-t border-slate-200 dark:border-gray-800 space-y-3">
                  {/* Upload zone */}
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
                      Fotoğraf sürükleyin veya tıklayın
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-gray-500 mt-0.5">İşlem alanının fotoğrafı daha doğru teklif sağlar</span>
                  </div>

                  {/* Mobile camera */}
                  <label className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 dark:bg-gray-800 text-[11px] font-bold text-white hover:bg-slate-800 transition cursor-pointer sm:hidden">
                    <Camera className="w-3.5 h-3.5 text-primary-400" />
                    Kamera ile Çek
                    <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} className="hidden" />
                  </label>

                  {analyzing && (
                    <div className="flex items-center gap-2 text-xs text-primary-400 font-medium justify-center p-2 rounded-lg bg-primary-50 dark:bg-primary-950/20 border border-primary-200 dark:border-primary-500/20">
                      <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary-500"></span>
                      Yükleniyor...
                    </div>
                  )}

                  {/* Uploaded photos grid */}
                  {uploadedPhotos.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {uploadedPhotos.map((url, i) => (
                        <div key={i} className="h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-gray-800 relative group bg-slate-100 dark:bg-gray-900">
                          <img src={url} alt={`Fotoğraf ${i + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5">
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded bg-white/20 hover:bg-white/40 text-white transition"
                            >
                              <Image className="w-3 h-3" />
                            </a>
                            <button 
                              type="button"
                              onClick={() => removePhoto(i)}
                              className="p-1 rounded bg-red-600/80 hover:bg-red-600 text-white transition"
                            >
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

      {/* Navigation */}
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
              ? 'bg-primary-600 text-white cursor-wait' 
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

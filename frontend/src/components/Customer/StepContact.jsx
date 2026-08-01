import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Phone, Mail, ChevronRight, Lock, MapPin } from 'lucide-react';
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
  setActiveStep
}) {
  const { settings } = useSettings();
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('Bahçelievler');

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
    
    // Pass form data directly to avoid stale closure
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
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">4. İletişim & Adres Bilgileri</h2>
          </div>
          <span className="text-xs text-primary-400 font-medium flex items-center gap-1">
            <Lock className="w-3.5 h-3.5" />
            Güvenli Adım
          </span>
        </div>

        <div className="max-w-md mx-auto space-y-6 mt-4">
          <div className="bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-500/30 rounded-2xl p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary-100 dark:bg-primary-600/20 text-primary-600 dark:text-primary-300 shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-primary-700 dark:text-primary-200 uppercase tracking-wider">Hizmet Bölgesi</h4>
              <p className="text-xs text-primary-600 dark:text-primary-300/80">
                <span className="font-bold text-slate-900 dark:text-white">{settings?.company_address || 'Ankara - Çankaya'}</span> ve çevresi için usta yönlendirmesi yapılmaktadır.
              </p>
            </div>
          </div>

          <div className="text-center space-y-1 mb-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Son Bir Adım Kaldı! 🎯</h3>
            <p className="text-sm text-slate-500 dark:text-gray-400">Size özel fiyat teklifini hesaplamak ve Usta yönlendirmek için iletişim bilgilerinizi giriniz.</p>
          </div>

          <form id="contactForm" onSubmit={handleSubmit(onValidSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-gray-400 block ml-1">Adınız Soyadınız *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <User className="h-5 w-5 text-slate-400 dark:text-gray-500" />
                </span>
                <input
                  type="text"
                  {...register('name')}
                  placeholder="Ahmet Yılmaz"
                  className={`w-full bg-white dark:bg-gray-950 border ${
                    errors.name ? 'border-red-500' : 'border-slate-200 dark:border-gray-800'
                  } rounded-2xl py-3.5 pl-12 pr-4 text-base focus:outline-none focus:border-primary-500 text-slate-800 dark:text-gray-200 transition-all shadow-inner`}
                />
              </div>
              {errors.name && <p className="text-xs text-red-500 ml-1">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-gray-400 block ml-1">Telefon Numaranız *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <Phone className="h-5 w-5 text-slate-400 dark:text-gray-500" />
                </span>
                <input
                  type="tel"
                  {...register('phone')}
                  placeholder="0555 123 4567"
                  className={`w-full bg-white dark:bg-gray-950 border ${
                    errors.phone ? 'border-red-500' : 'border-slate-200 dark:border-gray-800'
                  } rounded-2xl py-3.5 pl-12 pr-4 text-base focus:outline-none focus:border-primary-500 text-slate-800 dark:text-gray-200 transition-all shadow-inner`}
                />
              </div>
              {errors.phone && <p className="text-xs text-red-500 ml-1">{errors.phone.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-gray-400 block ml-1">E-posta Adresiniz (İsteğe Bağlı)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400 dark:text-gray-500" />
                </span>
                <input
                  type="email"
                  {...register('email')}
                  placeholder="ahmet@example.com"
                  className={`w-full bg-white dark:bg-gray-950 border ${
                    errors.email ? 'border-red-500' : 'border-slate-200 dark:border-gray-800'
                  } rounded-2xl py-3.5 pl-12 pr-4 text-base focus:outline-none focus:border-primary-500 text-slate-800 dark:text-gray-200 transition-all shadow-inner`}
                />
              </div>
              {errors.email && <p className="text-xs text-red-500 ml-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-gray-400 block ml-1">Çankaya Mahalleniz *</label>
              <select
                value={selectedNeighborhood}
                onChange={(e) => setSelectedNeighborhood(e.target.value)}
                className="w-full bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-800 rounded-2xl py-3.5 px-4 text-sm focus:outline-none focus:border-primary-500 text-slate-800 dark:text-gray-200 transition-all shadow-inner"
              >
                {CANKAYA_NEIGHBORHOODS.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-gray-400 block ml-1">Sokak / Bina / Daire Detayı *</label>
              <div className="relative">
                <textarea
                  {...register('address')}
                  placeholder="Örn: 7. Cadde 142. Sokak No: 12/4..."
                  className={`w-full bg-white dark:bg-gray-950 border ${
                    errors.address ? 'border-red-500' : 'border-slate-200 dark:border-gray-800'
                  } rounded-2xl py-3 px-4 text-sm focus:outline-none focus:border-primary-500 text-slate-800 dark:text-gray-200 transition-all shadow-inner min-h-[80px]`}
                ></textarea>
              </div>
              {errors.address && <p className="text-xs text-red-500 ml-1">{errors.address.message}</p>}
            </div>
          </form>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-3 pt-6 border-t border-slate-200 dark:border-gray-800 mt-6 md:relative fixed bottom-0 left-0 right-0 p-4 md:p-0 bg-white dark:bg-gray-950 md:bg-transparent border-t md:border-t-0 border-slate-200 dark:border-gray-800 z-30">
        <button 
          type="button" 
          onClick={() => setActiveStep(3)} 
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 text-sm font-semibold text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800 transition flex items-center justify-center"
        >
          Geri
        </button>
        <button 
          type="submit" 
          form="contactForm"
          disabled={isSubmitting}
          className={`w-full sm:w-auto px-8 py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 ${
            isSubmitting 
              ? 'bg-blue-600 text-white shadow-blue-900/20 cursor-wait' 
              : 'bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-500 hover:to-blue-500 text-white shadow-primary-900/20 font-bold text-sm'
          }`}
        >
          {isSubmitting ? (
            <div className="flex items-center gap-3 py-0.5">
              <span className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></span>
              <span className="font-semibold animate-pulse text-sm">Sizin için fiyat teklifinizi hazırlıyoruz...</span>
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

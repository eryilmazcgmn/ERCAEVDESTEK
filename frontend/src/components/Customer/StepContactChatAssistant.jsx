import React, { useState, useEffect, useRef } from 'react';
import { User, Phone, Mail, MapPin, Building, Calendar, Bot, ChevronLeft, ChevronRight, Lock, Sparkles, CheckCircle2, AlertCircle, Camera, UploadCloud, Image as ImageIcon, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSettings } from '../../context/SettingsContext';

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

function cleanRawAddress(rawAddr) {
  if (!rawAddr) return '';
  let cleaned = rawAddr.replace(/^(Ankara\s*[\/\-]\s*Çankaya\s*[\/\-]\s*)+/gi, '');
  cleaned = cleaned.replace(/^([^\-\-\n]+Mah\.\s*\-?\s*)+/gi, '');
  cleaned = cleaned.replace(/^Bahçelievler\s*[\/\-]\s*/gi, '');
  cleaned = cleaned.replace(/^[\-\/\s;]+/, '').trim();
  return cleaned;
}

export default function StepContactChatAssistant({
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
  const [currentStep, setCurrentStep] = useState(1);
  const [isTyping, setIsTyping] = useState(false);
  const [showPhotoSection, setShowPhotoSection] = useState(false);
  const chatEndRef = useRef(null);

  // Local form inputs state
  const [name, setName] = useState(customerName || '');
  const [phone, setPhone] = useState(customerPhone || '');
  const [email, setEmail] = useState(customerEmail || '');
  const [neighborhood, setNeighborhood] = useState('Bahçelievler');
  const [streetAddress, setStreetAddress] = useState(cleanRawAddress(customerAddress) || '');
  const [preferredDate, setPreferredDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState('09:00 - 12:00 (Sabah)');

  // Validation Error States
  const [errors, setErrors] = useState({});

  const chatContainerRef = useRef(null);

  // Auto-scroll on step change or typing
  useEffect(() => {
    if (currentStep === 1) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = 0;
      }
    } else {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentStep, isTyping]);

  // Determine initial step based on existing session data
  useEffect(() => {
    if (customerName && customerPhone && customerAddress) {
      setCurrentStep(6);
    } else if (customerName && customerPhone) {
      setCurrentStep(4);
    } else if (customerName) {
      setCurrentStep(2);
    }
  }, []);

  const triggerNextStep = (nextStepNum) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setCurrentStep(nextStepNum);
    }, 450);
  };

  // Step 1: Submit Name
  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      setErrors({ name: 'Lütfen adınızı ve soyadınızı en az 2 karakter olacak şekilde giriniz.' });
      return;
    }
    setErrors({});
    setCustomerName(name.trim());
    triggerNextStep(2);
  };

  // Step 2: Submit Phone
  const handlePhoneSubmit = (e) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setErrors({ phone: 'Lütfen geçerli bir telefon numarası giriniz (Örn: 0532 123 45 67).' });
      return;
    }
    setErrors({});
    setCustomerPhone(phone.trim());
    triggerNextStep(3);
  };

  // Step 3: Submit Email (Optional)
  const handleEmailSubmit = (e) => {
    e?.preventDefault();
    if (email.trim() && !/\S+@\S+\.\S+/.test(email.trim())) {
      setErrors({ email: 'Geçerli bir e-posta adresi giriniz veya boş bırakınız.' });
      return;
    }
    setErrors({});
    setCustomerEmail(email.trim());
    triggerNextStep(4);
  };

  // Step 4: Submit Neighborhood
  const handleNeighborhoodSelect = (selectedNeigh) => {
    setNeighborhood(selectedNeigh);
    triggerNextStep(5);
  };

  // Step 5: Submit Street Address
  const handleAddressSubmit = (e) => {
    e.preventDefault();
    if (!streetAddress.trim() || streetAddress.trim().length < 3) {
      setErrors({ address: 'Lütfen sokak, bina ve daire bilgilerinizi eksiksiz giriniz.' });
      return;
    }
    setErrors({});
    const fullAddr = `Ankara / Çankaya / ${neighborhood} Mah. - ${streetAddress.trim()}`;
    setCustomerAddress(fullAddr);
    triggerNextStep(6);
  };

  // Step 6: Submit Final Quotation Request
  const handleFinalSubmit = () => {
    const fullAddr = `Ankara / Çankaya / ${neighborhood} Mah. - ${streetAddress.trim()}`;
    setCustomerName(name);
    setCustomerPhone(phone);
    setCustomerEmail(email);
    setCustomerAddress(fullAddr);

    handleUpdateContactAndGetQuote({
      name,
      phone,
      email: email || '',
      address: fullAddr,
      preferred_date: preferredDate,
      time_slot: selectedSlot
    });
  };

  // Edit previous answer
  const handleRevertToStep = (stepNum) => {
    setCurrentStep(stepNum);
    toast.info('Bilginiz güncellenebilir duruma getirildi.');
  };

  const isSubmitting = submittingContact || submittingQuotation;

  return (
    <div className="flex-1 flex flex-col justify-between max-w-2xl mx-auto w-full">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-primary-500/20">
            <Bot className="w-5.5 h-5.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">İletişim & Randevu Asistanı</h2>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-xs text-slate-500 dark:text-gray-400">Teklifinizin iletileceği iletişim bilgileri alınıyor</p>
          </div>
        </div>

        <span className="text-xs text-primary-600 dark:text-primary-400 font-semibold flex items-center gap-1 bg-primary-50 dark:bg-primary-950/40 px-2.5 py-1 rounded-full border border-primary-200 dark:border-primary-500/20">
          <Lock className="w-3.5 h-3.5" />
          256-Bit SSL
        </span>
      </div>

      {/* ─── Service Area Info ─── */}
      <div className="mb-4 bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-500/20 rounded-2xl p-3 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 shrink-0">
          <MapPin className="w-4 h-4" />
        </div>
        <div className="text-xs text-slate-700 dark:text-gray-300">
          <span className="font-bold text-slate-900 dark:text-white block">
            Hizmet Bölgemiz: {settings?.company_address || 'Ankara — Çankaya'}
          </span>
          Çankaya ve bağlı tüm mahallelerde hızlı servis verilmektedir.
        </div>
      </div>

      {/* ─── Chat Stream ─── */}
      <div ref={chatContainerRef} className="space-y-4 min-h-[320px] max-h-[520px] overflow-y-auto pr-1 pb-4">
        {/* Welcome Bot Message */}
        <div className="flex items-start gap-3 animate-fade-in-up">
          <div className="w-8 h-8 rounded-xl bg-primary-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Bot className="w-4 h-4" />
          </div>
          <div className="bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-gray-800 rounded-2xl rounded-tl-none p-4 shadow-sm max-w-[85%] text-sm text-slate-800 dark:text-gray-200">
            <p className="font-semibold text-primary-600 dark:text-primary-400 text-xs mb-1">ERCA Asistan</p>
            <p>Harika! Hizmetiniz için gerekli tüm teknik detayları aldım. 👏</p>
            <p className="mt-1">Şimdi fiyat teklifinizi oluşturup size ulaştırabilmemiz için iletişim bilgilerinizi alalım.</p>
          </div>
        </div>

        {/* ─── STEP 1: Name ─── */}
        <div className="space-y-3 pt-1">
          <div className="flex items-start gap-3 animate-fade-in-up">
            <div className="w-8 h-8 rounded-xl bg-primary-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-gray-800 rounded-2xl rounded-tl-none p-4 shadow-sm max-w-[85%] text-sm text-slate-800 dark:text-gray-200">
              <p className="font-medium">Size nasıl hitap edelim? (Adınız Soyadınız)</p>
            </div>
          </div>

          {currentStep === 1 && !isTyping && (
            <form onSubmit={handleNameSubmit} className="pl-11 pr-2 space-y-2 animate-fade-in-up">
              <div className="relative max-w-md">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Örn: Ahmet Erdem"
                  autoFocus
                  className={`w-full bg-white dark:bg-gray-900 border ${
                    errors.name ? 'border-red-500' : 'border-slate-200 dark:border-gray-800'
                  } rounded-xl py-3 pl-11 pr-4 text-sm text-slate-800 dark:text-gray-200 focus:outline-none focus:border-primary-500`}
                />
              </div>
              {errors.name && (
                <p className="text-xs text-red-500 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.name}
                </p>
              )}
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs transition"
              >
                Devam Et
              </button>
            </form>
          )}

          {currentStep > 1 && (
            <div className="flex items-start justify-end gap-3 animate-fade-in-up">
              <div className="bg-gradient-to-r from-primary-600 to-blue-600 text-white rounded-2xl rounded-tr-none p-3.5 shadow-md max-w-[80%] text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold">{name}</span>
                  <button
                    type="button"
                    onClick={() => handleRevertToStep(1)}
                    className="text-[11px] font-medium bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 rounded-lg transition"
                  >
                    Değiştir
                  </button>
                </div>
              </div>
              <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-gray-800 text-slate-700 dark:text-gray-300 flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
            </div>
          )}
        </div>

        {/* ─── STEP 2: Phone ─── */}
        {currentStep >= 2 && (
          <div className="space-y-3 pt-1">
            <div className="flex items-start gap-3 animate-fade-in-up">
              <div className="w-8 h-8 rounded-xl bg-primary-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-gray-800 rounded-2xl rounded-tl-none p-4 shadow-sm max-w-[85%] text-sm text-slate-800 dark:text-gray-200">
                <p className="font-medium">Memnun olduk <strong>{name}</strong>! Size ulaşabileceğimiz telefon numaranız nedir?</p>
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">Teklif detayları ve SMS bilgilendirmesi bu numaraya gönderilir.</p>
              </div>
            </div>

            {currentStep === 2 && !isTyping && (
              <form onSubmit={handlePhoneSubmit} className="pl-11 pr-2 space-y-2 animate-fade-in-up">
                <div className="relative max-w-md">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0532 123 45 67"
                    autoFocus
                    className={`w-full bg-white dark:bg-gray-900 border ${
                      errors.phone ? 'border-red-500' : 'border-slate-200 dark:border-gray-800'
                    } rounded-xl py-3 pl-11 pr-4 text-sm text-slate-800 dark:text-gray-200 focus:outline-none focus:border-primary-500`}
                  />
                </div>
                {errors.phone && (
                  <p className="text-xs text-red-500 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.phone}
                  </p>
                )}
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs transition"
                >
                  Devam Et
                </button>
              </form>
            )}

            {currentStep > 2 && (
              <div className="flex items-start justify-end gap-3 animate-fade-in-up">
                <div className="bg-gradient-to-r from-primary-600 to-blue-600 text-white rounded-2xl rounded-tr-none p-3.5 shadow-md max-w-[80%] text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{phone}</span>
                    <button
                      type="button"
                      onClick={() => handleRevertToStep(2)}
                      className="text-[11px] font-medium bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 rounded-lg transition"
                    >
                      Değiştir
                    </button>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-gray-800 text-slate-700 dark:text-gray-300 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── STEP 3: Email (Optional) ─── */}
        {currentStep >= 3 && (
          <div className="space-y-3 pt-1">
            <div className="flex items-start gap-3 animate-fade-in-up">
              <div className="w-8 h-8 rounded-xl bg-primary-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-gray-800 rounded-2xl rounded-tl-none p-4 shadow-sm max-w-[85%] text-sm text-slate-800 dark:text-gray-200">
                <p className="font-medium">E-posta adresiniz var mı? <span className="font-normal text-xs text-slate-400">(İsteğe bağlı)</span></p>
              </div>
            </div>

            {currentStep === 3 && !isTyping && (
              <form onSubmit={handleEmailSubmit} className="pl-11 pr-2 space-y-2 animate-fade-in-up">
                <div className="relative max-w-md">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ahmet@example.com"
                    autoFocus
                    className={`w-full bg-white dark:bg-gray-900 border ${
                      errors.email ? 'border-red-500' : 'border-slate-200 dark:border-gray-800'
                    } rounded-xl py-3 pl-11 pr-4 text-sm text-slate-800 dark:text-gray-200 focus:outline-none focus:border-primary-500`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.email}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs transition"
                  >
                    Kaydet & Devam Et
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('');
                      triggerNextStep(4);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-300 font-semibold text-xs transition hover:bg-slate-200"
                  >
                    Atla / Belirtmeyeceğim
                  </button>
                </div>
              </form>
            )}

            {currentStep > 3 && (
              <div className="flex items-start justify-end gap-3 animate-fade-in-up">
                <div className="bg-gradient-to-r from-primary-600 to-blue-600 text-white rounded-2xl rounded-tr-none p-3.5 shadow-md max-w-[80%] text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{email || 'Belirtilmedi'}</span>
                    <button
                      type="button"
                      onClick={() => handleRevertToStep(3)}
                      className="text-[11px] font-medium bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 rounded-lg transition"
                    >
                      Değiştir
                    </button>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-gray-800 text-slate-700 dark:text-gray-300 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── STEP 4: Neighborhood ─── */}
        {currentStep >= 4 && (
          <div className="space-y-3 pt-1">
            <div className="flex items-start gap-3 animate-fade-in-up">
              <div className="w-8 h-8 rounded-xl bg-primary-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-gray-800 rounded-2xl rounded-tl-none p-4 shadow-sm max-w-[85%] text-sm text-slate-800 dark:text-gray-200">
                <p className="font-medium">Hizmet verilecek mahalle hangisidir?</p>
              </div>
            </div>

            {currentStep === 4 && !isTyping && (
              <div className="pl-11 pr-2 space-y-2 max-w-md animate-fade-in-up">
                <select
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="w-full bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl py-3 px-4 text-sm font-semibold text-slate-800 dark:text-gray-200 focus:outline-none focus:border-primary-500"
                >
                  {CANKAYA_NEIGHBORHOODS.map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => handleNeighborhoodSelect(neighborhood)}
                  className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs transition"
                >
                  Mahalleyi Onayla & Devam Et
                </button>
              </div>
            )}

            {currentStep > 4 && (
              <div className="flex items-start justify-end gap-3 animate-fade-in-up">
                <div className="bg-gradient-to-r from-primary-600 to-blue-600 text-white rounded-2xl rounded-tr-none p-3.5 shadow-md max-w-[80%] text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{neighborhood} Mah.</span>
                    <button
                      type="button"
                      onClick={() => handleRevertToStep(4)}
                      className="text-[11px] font-medium bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 rounded-lg transition"
                    >
                      Değiştir
                    </button>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-gray-800 text-slate-700 dark:text-gray-300 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── STEP 5: Street / Building Address ─── */}
        {currentStep >= 5 && (
          <div className="space-y-3 pt-1">
            <div className="flex items-start gap-3 animate-fade-in-up">
              <div className="w-8 h-8 rounded-xl bg-primary-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-gray-800 rounded-2xl rounded-tl-none p-4 shadow-sm max-w-[85%] text-sm text-slate-800 dark:text-gray-200">
                <p className="font-medium">Sokak, Bina ve Daire bilgilerinizi alabilir miyiz?</p>
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">Ustanın adrese kolayca ulaşabilmesi için detaylı yazınız.</p>
              </div>
            </div>

            {currentStep === 5 && !isTyping && (
              <form onSubmit={handleAddressSubmit} className="pl-11 pr-2 space-y-2 animate-fade-in-up">
                <div className="relative max-w-md">
                  <span className="absolute top-3 left-0 flex items-start pl-4 pointer-events-none text-slate-400">
                    <Building className="w-4 h-4" />
                  </span>
                  <textarea
                    rows={2}
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    placeholder="Örn: 7. Cadde, Menekşe Apt. No: 12/4"
                    autoFocus
                    className={`w-full bg-white dark:bg-gray-900 border ${
                      errors.address ? 'border-red-500' : 'border-slate-200 dark:border-gray-800'
                    } rounded-xl py-3 pl-11 pr-4 text-sm text-slate-800 dark:text-gray-200 focus:outline-none focus:border-primary-500`}
                  />
                </div>
                {errors.address && (
                  <p className="text-xs text-red-500 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.address}
                  </p>
                )}
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-xs transition"
                >
                  Adresi Onayla & Devam Et
                </button>
              </form>
            )}

            {currentStep > 5 && (
              <div className="flex items-start justify-end gap-3 animate-fade-in-up">
                <div className="bg-gradient-to-r from-primary-600 to-blue-600 text-white rounded-2xl rounded-tr-none p-3.5 shadow-md max-w-[80%] text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{streetAddress}</span>
                    <button
                      type="button"
                      onClick={() => handleRevertToStep(5)}
                      className="text-[11px] font-medium bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 rounded-lg transition"
                    >
                      Değiştir
                    </button>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-gray-800 text-slate-700 dark:text-gray-300 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── STEP 6: Date & Time Slot (Final) ─── */}
        {currentStep >= 6 && (
          <div className="space-y-3 pt-1">
            <div className="flex items-start gap-3 animate-fade-in-up">
              <div className="w-8 h-8 rounded-xl bg-primary-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-gray-800 rounded-2xl rounded-tl-none p-4 shadow-sm max-w-[85%] text-sm text-slate-800 dark:text-gray-200 space-y-2">
                <p className="font-medium">Son olarak: Tercih ettiğiniz servis zamanı nedir?</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500">Servis Günü</label>
                    <input
                      type="date"
                      value={preferredDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-gray-950 border border-slate-200 dark:border-gray-800 rounded-xl py-2 px-3 text-xs font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500">Saat Dilimi</label>
                    <div className="space-y-1">
                      {['09:00 - 12:00 (Sabah)', '12:00 - 15:00 (Öğle)', '15:00 - 18:00 (Akşamüstü)', '18:00 - 21:00 (Mesai Sonrası)'].map(slot => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          className={`w-full p-2 rounded-xl text-xs text-left border transition ${
                            selectedSlot === slot
                              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-600 dark:text-blue-400 font-bold'
                              : 'bg-slate-50 dark:bg-gray-950 border-slate-200 dark:border-gray-800 text-slate-600 dark:text-gray-400'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Typing Animation Indicator */}
        {isTyping && (
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-xl bg-primary-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}

        {/* Final Completion Box */}
        {currentStep >= 6 && !isTyping && (
          <div className="space-y-4 pt-2 animate-fade-in-up">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl rounded-tl-none p-4 shadow-sm text-sm text-emerald-900 dark:text-emerald-200 space-y-2">
                <p className="font-bold">Tüm bilgileriniz başarıyla alındı! 🎉</p>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  Size özel detaylı fiyat teklif belgesini hazırlamak için aşağıdaki butona tıklayabilirsiniz.
                </p>
              </div>
            </div>
          </div>
        )}

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

        <div ref={chatEndRef} />
      </div>

      {/* ─── Navigation Footer ─── */}
      <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-200 dark:border-gray-800 mt-4">
        <button
          type="button"
          onClick={() => setActiveStep(2)}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 text-sm font-semibold text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-800 transition flex items-center justify-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          Hizmet Sorularına Dön
        </button>

        <button
          type="button"
          onClick={() => {
            if (currentStep < 6) {
              if (currentStep === 1) handleNameSubmit({ preventDefault: () => {} });
              else if (currentStep === 2) handlePhoneSubmit({ preventDefault: () => {} });
              else if (currentStep === 3) handleEmailSubmit();
              else if (currentStep === 4) handleNeighborhoodSelect(neighborhood);
              else if (currentStep === 5) handleAddressSubmit({ preventDefault: () => {} });
            } else {
              handleFinalSubmit();
            }
          }}
          disabled={isSubmitting}
          className={`w-full sm:w-auto px-8 py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 ${
            isSubmitting
              ? 'bg-primary-600 text-white cursor-wait opacity-80'
              : currentStep >= 6
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/20 font-bold text-sm animate-pulse'
              : 'bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-500 hover:to-blue-500 text-white shadow-primary-900/15 font-bold text-sm'
          }`}
        >
          {isSubmitting ? (
            <div className="flex items-center gap-3 py-0.5">
              <span className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></span>
              <span className="font-semibold animate-pulse text-sm">Fiyat teklifiniz hazırlanıyor...</span>
            </div>
          ) : currentStep >= 6 ? (
            <>
              Fiyat Teklifimi Hazırla
              <ChevronRight className="w-5 h-5" />
            </>
          ) : (
            <>
              İlerle & Onayla
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

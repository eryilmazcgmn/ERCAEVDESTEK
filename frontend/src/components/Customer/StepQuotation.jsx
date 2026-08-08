import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, FileText, ChevronRight, Copy, Building, MessageSquare, ExternalLink, CreditCard, ThumbsUp, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../services/api';

function formatIban(ibanStr) {
  if (!ibanStr) return 'TR00 0000 0000 0000 0000 0000 00';
  const clean = ibanStr.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return clean.match(/.{1,4}/g)?.join(' ') || ibanStr;
}

export default function StepQuotation({
  sessionId,
  selectedService,
  services = [],
  compiledQuotation,
  compiledWorkOrder,
  setActiveStep,
  handleDeclareDeposit,
  depositDeclared,
  declaringDeposit,
  handleApproveQuotation,
  approvingQuotation,
  backendUrl
}) {
  const serviceObj = services.find(s => s.id === selectedService || s.slug === selectedService);
  const serviceName = serviceObj?.name || compiledQuotation?.service_name || (
    selectedService === 'tv-mount' ? 'TV Montajı' : 
    selectedService === 'paint' ? 'Boyama & Dekorasyon' :
    selectedService === 'plumbing' ? 'Sıhhi Tesisat' : 
    selectedService === 'electric' ? 'Elektrik İşleri' : selectedService
  );
  const [copied, setCopied] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [bankInfo, setBankInfo] = useState({
    bankName: "Ziraat Bankası",
    accountName: "ERCA Ev Destek Ltd. Şti.",
    iban: "TR00 0000 0000 0000 0000 0000 00",
    whatsapp_number: "905551234567"
  });

  useEffect(() => {
    const loadBankInfo = async () => {
      try {
        const res = await api.fetchBankInfo();
        const data = res?.data || res;
        const bank = data?.bank || {};
        if (bank) {
          setBankInfo({
            bankName: bank.bankName || "Ziraat Bankası",
            accountName: bank.accountName || "ERCA Ev Destek Ltd. Şti.",
            iban: bank.iban || "TR00 0000 0000 0000 0000 0000 00",
            whatsapp_number: data.whatsapp_number || "905551234567"
          });
        }
      } catch (err) {
        console.error("Bank info loading failed", err);
      }
    };
    loadBankInfo();
  }, []);

  const fallbackCopy = (text, type) => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      toast.success(`${type} kopyalandı!`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Kopyalama başarısız oldu. Lütfen manuel seçip kopyalayın.');
    }
  };

  const copyText = (text, type = 'IBAN') => {
    const cleanText = text.replace(/\s+/g, '');
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(cleanText)
        .then(() => {
          toast.success(`${type} kopyalandı!`);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => fallbackCopy(cleanText, type));
    } else {
      fallbackCopy(cleanText, type);
    }
  };

  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  const initialTotal = compiledQuotation?.price_details?.total || 0;
  const discountVal = appliedCoupon?.discount_amount || 0;
  const totalAmount = appliedCoupon?.new_total !== undefined ? appliedCoupon.new_total : initialTotal;
  const depositAmount = appliedCoupon?.new_deposit !== undefined ? appliedCoupon.new_deposit : (parseFloat(totalAmount) * 0.20).toFixed(2);

  const handleApplyCoupon = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!couponInput.trim()) return;
    setValidatingCoupon(true);
    try {
      const res = await api.validateCoupon(couponInput.trim(), initialTotal);
      const data = res.data?.data || res.data;
      if (data && data.discount_amount !== undefined) {
        setAppliedCoupon(data);
        toast.success(`Kupon uygulandı! ₺${data.discount_amount} indirim kazandınız.`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Geçersiz indirim kodu.');
    } finally {
      setValidatingCoupon(false);
    }
  };
  const workOrderId = compiledWorkOrder?.id || compiledWorkOrder?.work_order_id;
  const workOrderCode = workOrderId ? `WO-${workOrderId}` : (sessionId ? `SES-${sessionId.slice(-6)}` : 'WO-1001');
  const isApproved = !!compiledWorkOrder;
  const woStatus = compiledWorkOrder?.status || (compiledQuotation?.status === 'approved' ? 'deposit_pending' : 'pending');

  const getStatusInfo = (status) => {
    switch (status) {
      case 'deposit_pending':
        return {
          title: 'KAPORA ÖDEMESİ BEKLENİYOR',
          badgeText: 'KAPORA BEKLENİYOR',
          badgeClass: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/30',
          bannerClass: 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-500/30 text-amber-900 dark:text-amber-200',
          bannerText: 'Sipariş kaydınız oluşturuldu. Hizmetinizin kesinleşebilmesi için lütfen %20 kaporayı yukarıdaki IBAN hesabına yatırınız.'
        };
      case 'deposit_declared':
        return {
          title: 'DEKONT İNCELENİYOR',
          badgeText: 'ÖDEME KONTROLÜNDE',
          badgeClass: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-500/30',
          bannerClass: 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-500/30 text-blue-900 dark:text-blue-200',
          bannerText: 'Kapora ödeme bildiriminiz alındı! Finans ekibimiz ödemeyi kontrol ettikten sonra randevunuz onaylanacaktır.'
        };
      case 'deposit_paid':
      case 'approved':
      case 'accepted':
      case 'scheduled':
      case 'in_progress':
        return {
          title: 'ONAYLANDI - USTA YOLDA',
          badgeText: 'KAPORA ONAYLANDI',
          badgeClass: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30',
          bannerClass: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-200',
          bannerText: 'Kaporanız onaylandı! Uzman ustamız belirlenen randevu saatinde adresinizde olacaktır.'
        };
      case 'completed':
        return {
          title: 'İŞLEM TAMAMLANDI',
          badgeText: 'TAMAMLANDI',
          badgeClass: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-300',
          bannerClass: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-900',
          bannerText: 'Hizmet tamamlanmıştır. Bizi tercih ettiğiniz için teşekkür ederiz!'
        };
      case 'cancelled':
        return {
          title: 'İPTAL EDİLDİ',
          badgeText: 'İPTAL EDİLDİ',
          badgeClass: 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border-red-300',
          bannerClass: 'bg-red-50 dark:bg-red-950/40 border-red-300 text-red-900',
          bannerText: 'Bu teklif veya iş emri iptal edilmiştir.'
        };
      default:
        return {
          title: 'TEKLİF HAZIR',
          badgeText: 'TEKLİF HAZIR',
          badgeClass: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-300',
          bannerClass: 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-900',
          bannerText: 'Teklif detaylarını inceleyip "Teklifi Onayla" butonuna tıklayarak kapora ödemenizi yapabilirsiniz.'
        };
    }
  };

  const statusInfo = getStatusInfo(woStatus);

  const openWhatsAppDekont = () => {
    const message = encodeURIComponent(
      `Merhaba ERCA Ev Destek,\nTakip No: ${workOrderCode}\nKapora Tutarı: ${depositAmount} TL Havale/EFT ödememi gerçekleştirdim. Dekontumu paylaşıyorum.`
    );
    window.open(`https://wa.me/${bankInfo.whatsapp_number}?text=${message}`, '_blank');
  };

  return (
    <div className="flex-1 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Fiyat Teklifi ve Ödeme Takibi</h2>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${statusInfo.badgeClass}`}>
            {statusInfo.badgeText}
          </span>
        </div>

        {/* Top Status Alert Banner */}
        <div className={`mb-6 p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${statusInfo.bannerClass}`}>
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 opacity-80" />
            <div>
              <h4 className="text-sm font-bold">{statusInfo.title}</h4>
              <p className="text-xs mt-0.5 opacity-90">{statusInfo.bannerText}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sol Kolon: Fiyatlandırma ve Hizmet Özeti */}
          <div className="lg:col-span-5 space-y-4 font-sans">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-gray-900/60 border border-slate-200 dark:border-gray-800 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-gray-800 pb-3">
                <CheckCircle2 className="w-5 h-5 text-primary-400" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Hizmet Detayı</h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-gray-400">Takip Kodu:</span>
                  <span className="text-slate-900 dark:text-white font-mono font-bold">{workOrderCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-gray-400">Hizmet:</span>
                  <span className="font-bold text-slate-900 dark:text-white uppercase">
                    {serviceName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-gray-400">Durum:</span>
                  <span className={`font-bold uppercase px-2 py-0.5 rounded text-[11px] border ${statusInfo.badgeClass}`}>
                    {statusInfo.badgeText}
                  </span>
                </div>
              </div>
            </div>

            {/* Kalem Kalem Fiyat Dökümü */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-gray-900/60 border border-slate-200 dark:border-gray-800 space-y-3">
              <h3 className="font-bold text-xs text-primary-400 uppercase tracking-wider">Hizmet Kalemleri</h3>
              {compiledQuotation?.price_details?.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs text-slate-700 dark:text-gray-300 py-1 border-b border-slate-200 dark:border-gray-800/50">
                  <span>{item.description}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{item.price} TL</span>
                </div>
              ))}
              <div className="pt-2 space-y-1.5 text-xs border-t border-slate-200 dark:border-gray-800">
                <div className="flex justify-between text-slate-500 dark:text-gray-400">
                  <span>Hizmet Tutarı:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{initialTotal} TL</span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span>İndirim Kuponu ({appliedCoupon.code}):</span>
                    <span>-₺{discountVal} TL</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-900 dark:text-white font-bold text-sm">
                  <span>Toplam Bedel:</span>
                  <span>{totalAmount} TL</span>
                </div>

                <div className="flex justify-between text-primary-500 font-bold text-sm pt-1 border-t border-slate-200 dark:border-gray-800">
                  <span>Kapora (%20):</span>
                  <span className="text-green-500">{depositAmount} TL</span>
                </div>
              </div>

              {/* İndirim Kodu Giriş Alanı */}
              {!appliedCoupon && (
                <form onSubmit={handleApplyCoupon} className="pt-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="İndirim Kodu Girin (Örn: HOSGELDIN50)"
                    className="flex-1 bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs font-mono uppercase focus:outline-none focus:border-primary-500"
                  />
                  <button
                    type="submit"
                    disabled={validatingCoupon || !couponInput.trim()}
                    className="px-3 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-bold transition disabled:opacity-50"
                  >
                    {validatingCoupon ? '...' : 'Uygula'}
                  </button>
                </form>
              )}
            </div>

            {/* PDF Rapor İndirme */}
            {compiledQuotation?.pdf_path && (
              <a 
                href={`${backendUrl}/${compiledQuotation.pdf_path}`} 
                target="_blank" 
                rel="noreferrer"
                className="p-3 rounded-xl border border-slate-200 dark:border-gray-800 hover:border-primary-500/50 bg-white dark:bg-gray-950 text-left flex items-center justify-between text-xs transition"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary-400" />
                  <span className="font-semibold text-slate-700 dark:text-gray-300">Teklif Raporunu İndir (PDF)</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-gray-500" />
              </a>
            )}
          </div>

          {/* Sağ Kolon: Onay Kutusu veya Banka IBAN */}
          <div className="lg:col-span-7 space-y-4">
            {!isApproved ? (
              /* Teklif Onay Kartı */
              <div className="glass-card p-6 rounded-2xl border border-primary-300 dark:border-primary-500/40 bg-gradient-to-b from-primary-500/10 to-transparent space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-600/20 flex items-center justify-center text-primary-400 shrink-0">
                    <ThumbsUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">Teklifi Kabul Ediyor musunuz?</h3>
                    <p className="text-xs text-slate-500 dark:text-gray-400">
                      Onayladıktan sonra kapora ödeme bilgileri oluşturulacaktır.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-800 space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-0.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span>
                      {totalAmount} TL tutarındaki hizmet bedelini ve kapora koşullarını okudum, kabul ediyorum.
                    </span>
                  </label>
                </div>

                <button
                  type="button"
                  disabled={!agreedToTerms || approvingQuotation}
                  onClick={handleApproveQuotation}
                  className={`w-full py-4 px-6 rounded-xl font-bold text-sm text-white transition flex items-center justify-center gap-2 shadow-lg ${
                    agreedToTerms && !approvingQuotation
                      ? 'bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-500 hover:to-blue-500 shadow-primary-950/40 cursor-pointer'
                      : 'bg-gray-400 dark:bg-gray-800 opacity-50 cursor-not-allowed'
                  }`}
                >
                  {approvingQuotation ? (
                    <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                  ) : (
                    <>
                      <ThumbsUp className="w-4 h-4" />
                      Teklifi Onayla & Sipariş Oluştur
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* Onaylandıktan Sonra: Banka IBAN & Kapora Ödeme Bildirimi */
              <div className="glass-card p-6 rounded-2xl border border-primary-200 dark:border-primary-500/30 bg-primary-50 dark:bg-primary-950/10 flex flex-col justify-between font-sans space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-blue-400" />
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">Havale / EFT Bilgileri</h3>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-green-100 dark:bg-green-950/60 border border-green-300 dark:border-green-500/30 text-[11px] font-bold text-green-700 dark:text-green-400">
                      %20 Kapora: {depositAmount} TL
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-800 space-y-4 shadow-sm">
                    {/* Banka Adı */}
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-gray-800 pb-2.5">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Banka Adı</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Building className="w-4 h-4 text-blue-500" />
                        {bankInfo.bankName}
                      </span>
                    </div>

                    {/* Alıcı Adı / Firma Adı */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider block">Alıcı Adı / Firma Unvanı</span>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-2.5 text-xs font-bold text-slate-900 dark:text-white">
                          {bankInfo.accountName}
                        </div>
                        <button 
                          type="button"
                          onClick={() => copyText(bankInfo.accountName, 'Alıcı Adı')}
                          className="p-2.5 rounded-xl bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-500 transition text-slate-600 dark:text-gray-300 shrink-0"
                          title="Alıcı Adını Kopyala"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* TR IBAN */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider block">TR IBAN Numarası</span>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-2.5 font-mono text-xs font-bold text-slate-900 dark:text-white tracking-widest">
                          {formatIban(bankInfo.iban)}
                        </div>
                        <button 
                          type="button"
                          onClick={() => copyText(bankInfo.iban, 'IBAN')}
                          className={`p-2.5 rounded-xl border transition shrink-0 flex items-center justify-center ${
                            copied 
                              ? 'bg-green-50 dark:bg-green-950/40 border-green-300 text-green-600'
                              : 'bg-primary-600 hover:bg-primary-500 text-white border-primary-600 shadow-sm'
                          }`}
                          title="IBAN'ı Kopyala"
                        >
                          {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-200 text-xs leading-relaxed">
                    📌 <strong>Önemli:</strong> EFT/Havale açıklamasına <strong>{workOrderCode}</strong> kodunu yazınız.
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={openWhatsAppDekont}
                      className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4" />
                      WhatsApp Dekont Gönder
                      <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                    </button>

                    <button
                      type="button"
                      onClick={handleDeclareDeposit}
                      disabled={depositDeclared || declaringDeposit}
                      className={`py-3 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg ${
                        depositDeclared 
                          ? 'bg-green-600 text-white cursor-default'
                          : 'bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-500 hover:to-blue-500 text-white cursor-pointer'
                      }`}
                    >
                      {declaringDeposit ? (
                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                      ) : depositDeclared ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-white" />
                          Ödeme Bildirildi
                        </>
                      ) : (
                        'Havale / EFT Yaptım (Bildir)'
                      )}
                    </button>
                  </div>

                  {depositDeclared && (
                    <div className="p-3 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-300 dark:border-green-500/40 text-center text-xs text-green-700 dark:text-green-300 font-medium animate-pulse">
                      ✅ Ödeme bildiriminiz alındı. Usta ataması en kısa sürede yapılacaktır.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-3 pt-6 border-t border-slate-200 dark:border-gray-800 mt-6 md:relative fixed bottom-0 left-0 right-0 p-4 md:p-0 bg-white dark:bg-gray-950 md:bg-transparent border-t md:border-t-0 border-slate-200 dark:border-gray-800 z-30">
        <button 
          type="button"
          onClick={() => setActiveStep(3)} 
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 text-sm font-semibold text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-800 transition flex items-center justify-center"
        >
          İletişim Bilgilerini Düzenle
        </button>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { Bot, User, ShieldCheck, CheckCircle2, FileText, ChevronRight, Copy, Building, MessageSquare, ExternalLink, CreditCard, ThumbsUp, AlertCircle, Sparkles, Tag, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../services/api';

function formatIban(ibanStr) {
  if (!ibanStr) return 'TR00 0000 0000 0000 0000 0000 00';
  const clean = ibanStr.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return clean.match(/.{1,4}/g)?.join(' ') || ibanStr;
}

export default function StepQuotationChatAssistant({
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
  const chatEndRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isTyping, setIsTyping] = useState(true);

  // Bank Info State
  const [bankInfo, setBankInfo] = useState({
    bankName: "Ziraat Bankası",
    accountName: "ERCA Ev Destek Ltd. Şti.",
    iban: "TR00 0000 0000 0000 0000 0000 00",
    whatsapp_number: "905551234567"
  });

  // Coupon State
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Fetch Bank Info on Mount
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

    // Short typing transition
    const timer = setTimeout(() => setIsTyping(false), 450);
    return () => clearTimeout(timer);
  }, []);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [compiledQuotation, compiledWorkOrder, isTyping, appliedCoupon, depositDeclared]);

  // Service Name Display
  const serviceObj = services.find(s => s.id === selectedService || s.slug === selectedService);
  const serviceName = serviceObj?.name || compiledQuotation?.service_name || (
    selectedService === 'tv-mount' ? 'TV Montajı & Askı Aparatı' : 
    selectedService === 'paint' ? 'Boyama & Dekorasyon' :
    selectedService === 'plumbing' ? 'Sıhhi Tesisat' : 
    selectedService === 'electric' ? 'Elektrik İşleri' : selectedService
  );

  // Customer Name Display
  const customerName = compiledQuotation?.customer_name || compiledQuotation?.customer?.name || 'Değerli Müşterimiz';

  // Fiyat Hesaplamaları (Backend verisinden)
  const initialTotal = compiledQuotation?.price_details?.total || 0;
  const discountVal = appliedCoupon?.discount_amount || 0;
  const totalAmount = appliedCoupon?.new_total !== undefined ? appliedCoupon.new_total : initialTotal;
  const depositAmount = appliedCoupon?.new_deposit !== undefined ? appliedCoupon.new_deposit : (parseFloat(totalAmount) * 0.20).toFixed(2);

  // Sipariş & WorkOrder Kodu
  const workOrderId = compiledWorkOrder?.id || compiledWorkOrder?.work_order_id;
  const workOrderCode = workOrderId ? `WO-${workOrderId}` : (sessionId ? `SES-${sessionId.slice(-6)}` : 'WO-1001');
  const isApproved = !!compiledWorkOrder;
  const woStatus = compiledWorkOrder?.status || (compiledQuotation?.status === 'approved' ? 'deposit_pending' : 'pending');

  // Status Info Resolver
  const getStatusInfo = (status) => {
    switch (status) {
      case 'deposit_pending':
        return {
          title: 'KAPORA ÖDEMESİ BEKLENİYOR',
          badgeText: 'KAPORA BEKLENİYOR',
          badgeClass: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/30',
        };
      case 'deposit_declared':
        return {
          title: 'DEKONT İNCELENİYOR',
          badgeText: 'ÖDEME KONTROLÜNDE',
          badgeClass: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-500/30',
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
        };
      case 'completed':
        return {
          title: 'İŞLEM TAMAMLANDI',
          badgeText: 'TAMAMLANDI',
          badgeClass: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-300',
        };
      default:
        return {
          title: 'TEKLİF HAZIR',
          badgeText: 'TEKLİF HAZIR',
          badgeClass: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-300',
        };
    }
  };

  const statusInfo = getStatusInfo(woStatus);

  // Copy Clipboard Helper
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
    } catch {
      toast.error('Kopyalama başarısız oldu.');
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

  // Coupon Application
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

  // WhatsApp Dekont Opener
  const openWhatsAppDekont = () => {
    const message = encodeURIComponent(
      `Merhaba ERCA Ev Destek,\nTakip No: ${workOrderCode}\nKapora Tutarı: ${depositAmount} TL Havale/EFT ödememi gerçekleştirdim. Dekontumu paylaşıyorum.`
    );
    window.open(`https://wa.me/${bankInfo.whatsapp_number}?text=${message}`, '_blank');
  };

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
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Teklif & Sipariş Asistanı</h2>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-xs text-slate-500 dark:text-gray-400">{serviceName} teklif raporu ve sipariş onayı</p>
          </div>
        </div>

        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${statusInfo.badgeClass}`}>
          {statusInfo.badgeText}
        </span>
      </div>

      {/* ─── Chat Stream ─── */}
      <div className="space-y-4 min-h-[320px] max-h-[540px] overflow-y-auto pr-1 pb-4">
        {/* Welcome & Quotation Intro Bot Message */}
        <div className="flex items-start gap-3 animate-fade-in-up">
          <div className="w-8 h-8 rounded-xl bg-primary-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Bot className="w-4 h-4" />
          </div>
          <div className="bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-gray-800 rounded-2xl rounded-tl-none p-4 shadow-sm max-w-[85%] text-sm text-slate-800 dark:text-gray-200 space-y-2">
            <p className="font-semibold text-primary-600 dark:text-primary-400 text-xs mb-1">ERCA Asistan</p>
            <p>Harika <strong>{customerName}</strong>!</p>
            <p>Verdiğiniz bilgilere göre <strong>{serviceName}</strong> hizmetiniz için resmi fiyat teklifinizi hazırladım. Detayları aşağıda inceleyebilirsiniz.</p>
          </div>
        </div>

        {/* ─── Quotation Details Card ─── */}
        <div className="pl-11 pr-2 animate-fade-in-up space-y-3">
          <div className="bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary-500" />
                <span className="font-bold text-sm text-slate-900 dark:text-white uppercase">{serviceName}</span>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500">{workOrderCode}</span>
            </div>

            {/* Price Items Breakdown */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px]">Hizmet Kalemleri</span>
              {compiledQuotation?.price_details?.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between text-slate-700 dark:text-gray-300 py-1 border-b border-slate-100 dark:border-gray-900">
                  <span>{item.description}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{item.price} TL</span>
                </div>
              ))}
            </div>

            {/* Price Subtotal / Discount / Total */}
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
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{depositAmount} TL</span>
              </div>
            </div>

            {/* Coupon Code Input */}
            {!appliedCoupon && (
              <form onSubmit={handleApplyCoupon} className="pt-2 flex items-center gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="İndirim Kodu (Örn: HOSGELDIN50)"
                  className="flex-1 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs font-mono uppercase focus:outline-none focus:border-primary-500"
                />
                <button
                  type="submit"
                  disabled={validatingCoupon || !couponInput.trim()}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-bold transition disabled:opacity-50"
                >
                  {validatingCoupon ? '...' : 'Uygula'}
                </button>
              </form>
            )}

            {/* PDF Report Link */}
            {compiledQuotation?.pdf_path && (
              <a
                href={`${backendUrl}/${compiledQuotation.pdf_path}`}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl border border-slate-200 dark:border-gray-800 hover:border-primary-500/50 bg-slate-50/50 dark:bg-gray-900/40 text-left flex items-center justify-between text-xs transition group"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary-500" />
                  <span className="font-semibold text-slate-700 dark:text-gray-300 group-hover:text-primary-600">Teklif Raporunu Gör / İndir (PDF)</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            )}
          </div>
        </div>

        {/* ─── UNAPPROVED STATE: Terms Checkbox & Approval Bot Message ─── */}
        {!isApproved && (
          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3 animate-fade-in-up">
              <div className="w-8 h-8 rounded-xl bg-primary-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white dark:bg-gray-900 border border-slate-200/80 dark:border-gray-800 rounded-2xl rounded-tl-none p-4 shadow-sm max-w-[85%] text-sm text-slate-800 dark:text-gray-200">
                <p className="font-medium">Teklifinizi onaylayıp siparişinizi oluşturmak ister misiniz?</p>
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">Onayladıktan sonra %20 kapora ödeme bilgileri gösterilecektir.</p>
              </div>
            </div>

            {/* Approval Checkbox & Button */}
            <div className="pl-11 pr-2 space-y-3 animate-fade-in-up">
              <div className="p-4 rounded-2xl bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-800 space-y-3 shadow-sm">
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
                className={`w-full py-4 px-6 rounded-2xl font-bold text-sm text-white transition flex items-center justify-center gap-2 shadow-lg ${
                  agreedToTerms && !approvingQuotation
                    ? 'bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-500 hover:to-blue-500 shadow-primary-900/20 cursor-pointer animate-pulse'
                    : 'bg-gray-400 dark:bg-gray-800 opacity-50 cursor-not-allowed'
                }`}
              >
                {approvingQuotation ? (
                  <div className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></span>
                    <span>Sipariş Oluşturuluyor...</span>
                  </div>
                ) : (
                  <>
                    <ThumbsUp className="w-4 h-4" />
                    TEKLİFİ ONAYLA & SİPARİŞ OLUŞTUR
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ─── APPROVED STATE: Post-Approval Chat & IBAN Card ─── */}
        {isApproved && (
          <div className="space-y-4 pt-2 animate-fade-in-up">
            {/* User Confirmation Message */}
            <div className="flex items-start justify-end gap-3">
              <div className="bg-gradient-to-r from-primary-600 to-blue-600 text-white rounded-2xl rounded-tr-none p-3.5 shadow-md max-w-[80%] text-sm">
                <span className="font-semibold">Teklifi Onaylıyorum 👍</span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-gray-800 text-slate-700 dark:text-gray-300 flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
            </div>

            {/* Bot Approved Confirmation */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl rounded-tl-none p-4 shadow-sm text-sm text-emerald-900 dark:text-emerald-200 space-y-2 max-w-[85%]">
                <p className="font-bold text-base">Harika! Teklifiniz onaylandı. 🎉</p>
                <p className="text-xs">Sipariş Numaranız: <strong className="font-mono underline text-sm">{workOrderCode}</strong></p>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  Hizmetinizin kesinleşebilmesi için %20 kapora tutarınız: <strong className="font-bold text-sm">💰 {depositAmount} TL</strong>
                </p>
              </div>
            </div>

            {/* IBAN Card in Chat Stream */}
            <div className="pl-11 pr-2 space-y-3">
              <div className="bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-gray-800 pb-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-500" />
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Havale / EFT Ödeme Bilgileri</h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/30 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    Kapora: {depositAmount} TL
                  </span>
                </div>

                {/* Bank Name */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-gray-800 pb-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Banka</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-gray-200 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-blue-500" />
                    {bankInfo.bankName}
                  </span>
                </div>

                {/* Account Name */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Alıcı Adı / Firma Unvanı</span>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-2.5 text-xs font-bold text-slate-800 dark:text-gray-200">
                      {bankInfo.accountName}
                    </div>
                    <button
                      type="button"
                      onClick={() => copyText(bankInfo.accountName, 'Alıcı Adı')}
                      className="p-2.5 rounded-xl bg-slate-100 dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-600 dark:text-gray-300 text-xs font-semibold shrink-0"
                    >
                      Kopyala
                    </button>
                  </div>
                </div>

                {/* IBAN */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">TR IBAN Numarası</span>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-2.5 font-mono text-xs font-bold text-slate-800 dark:text-gray-200 tracking-wider">
                      {formatIban(bankInfo.iban)}
                    </div>
                    <button
                      type="button"
                      onClick={() => copyText(bankInfo.iban, 'IBAN')}
                      className={`p-2.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1 ${
                        copied
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-600'
                          : 'bg-primary-600 hover:bg-primary-500 text-white shadow-sm'
                      }`}
                    >
                      {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Kopyalandı' : 'Kopyala'}
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-200 text-xs">
                  📌 <strong>Önemli:</strong> Açıklama kısmına <strong className="font-mono text-sm underline">{workOrderCode}</strong> kodunu yazınız.
                </div>

                {/* Post Approval Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={openWhatsAppDekont}
                    className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20"
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
                        ? 'bg-emerald-600 text-white cursor-default'
                        : 'bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-500 hover:to-blue-500 text-white cursor-pointer'
                    }`}
                  >
                    {declaringDeposit ? (
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></span>
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
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/40 text-center text-xs text-emerald-700 dark:text-emerald-300 font-semibold animate-pulse">
                    ✅ Ödeme bildiriminiz alındı. Finans kontrolü sonrası usta atanacaktır.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Typing Animation */}
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

        <div ref={chatEndRef} />
      </div>

      {/* ─── Footer Navigation ─── */}
      <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-200 dark:border-gray-800 mt-4">
        <button
          type="button"
          onClick={() => setActiveStep(3)}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 text-sm font-semibold text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-800 transition flex items-center justify-center gap-1"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          İletişim Bilgilerini Düzenle
        </button>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, FileText, ChevronRight, Copy, Building, MessageSquare, ExternalLink, CreditCard, ThumbsUp, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

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

  const copyIban = () => {
    navigator.clipboard.writeText(bankInfo.iban.replace(/\s+/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalAmount = compiledQuotation?.price_details?.total || 0;
  const depositAmount = compiledQuotation?.price_details?.deposit_amount || (parseFloat(totalAmount) * 0.20).toFixed(2);
  const workOrderId = compiledWorkOrder?.id || compiledWorkOrder?.work_order_id;
  const workOrderCode = workOrderId ? `WO-${workOrderId}` : (sessionId ? `SES-${sessionId.slice(-6)}` : 'WO-1001');
  const isApproved = !!compiledWorkOrder;

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
            <ShieldCheck className="w-5 h-5 text-green-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Fiyat Teklifi ve Onay</h2>
          </div>
          <span className="text-xs text-green-400 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>
            {isApproved ? 'Teklif Onaylandı' : 'Teklif Hazır'}
          </span>
        </div>

        {/* Top Alert if quote needs approval */}
        {!isApproved && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">Teklifiniz Hazır!</h4>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                  Detayları inceleyip <strong>"Teklifi Onayla"</strong> butonuna tıklayarak kaporayı ödeyebilirsiniz.
                </p>
              </div>
            </div>
          </div>
        )}

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
                  <span className={`font-bold uppercase ${isApproved ? 'text-green-400' : 'text-amber-400'}`}>
                    {isApproved ? 'Onaylandı' : 'Onay Bekliyor'}
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
              <div className="pt-2 space-y-1 text-xs">
                <div className="flex justify-between text-slate-500 dark:text-gray-400">
                  <span>Toplam Hizmet Bedeli:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{totalAmount} TL</span>
                </div>
                <div className="flex justify-between text-primary-500 font-bold text-sm pt-1 border-t border-slate-200 dark:border-gray-800">
                  <span>Kapora (%20):</span>
                  <span className="text-green-500">{depositAmount} TL</span>
                </div>
              </div>
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

                  <div className="p-4 rounded-xl bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 pb-2">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-slate-500 dark:text-gray-400" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{bankInfo.bankName}</span>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-gray-400">{bankInfo.accountName}</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider block">TR IBAN</span>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl p-3 font-mono text-xs text-slate-900 dark:text-white tracking-widest">
                          {bankInfo.iban}
                        </div>
                        <button 
                          type="button"
                          onClick={copyIban}
                          className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/40 border border-primary-200 dark:border-primary-500/30 hover:bg-primary-200 dark:hover:bg-primary-800 transition text-primary-600 dark:text-primary-300 shrink-0"
                          title="Kopyala"
                        >
                          {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
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

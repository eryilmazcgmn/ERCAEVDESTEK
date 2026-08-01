import React, { useState, useEffect } from 'react';
import { CreditCard, Copy, CheckCircle2, Building, MessageSquare, ExternalLink } from 'lucide-react';
import { api } from '../../services/api';

export default function StepDeposit({
  compiledQuotation,
  compiledWorkOrder,
  setActiveStep,
  handleDeclarePayment,
  declared
}) {
  const [copied, setCopied] = useState(false);
  const [bankInfo, setBankInfo] = useState({
    bankName: "Garanti BBVA",
    accountName: "ERCA Ev Destek Hizmetleri A.Ş.",
    iban: "TR12 0006 2000 0001 2345 6789 01",
    whatsapp_number: "905551234567"
  });

  useEffect(() => {
    const loadBankInfo = async () => {
      try {
        const data = await api.fetchBankInfo();
        const bankData = data.data || data;
        const bank = bankData.bank || bankData;
        if (bank && bank.bankName) {
          setBankInfo({
            bankName: bank.bankName || bankInfo.bankName,
            accountName: bank.accountName || bankInfo.accountName,
            iban: bank.iban || bankInfo.iban,
            whatsapp_number: bankData.whatsapp_number || bank.whatsapp_number || '905551234567'
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

  const depositAmount = compiledQuotation?.price_details?.deposit_amount || 
    (parseFloat(compiledQuotation?.price_details?.total || 0) * 0.20).toFixed(2);

  const workOrderId = compiledWorkOrder?.id || compiledWorkOrder?.work_order_id;

  const openWhatsAppDekont = () => {
    const message = encodeURIComponent(
      `Merhaba ERCA Ev Destek,\nİş Emri Kodu: WO-${workOrderId || ''}\nTeklif No: #${compiledQuotation?.id || ''}\nKapora Tutarı: ${depositAmount} TL Havale/EFT ödememi gerçekleştirdim. Dekontumu bilgilerinize sunarım.`
    );
    window.open(`https://wa.me/${bankInfo.whatsapp_number}?text=${message}`, '_blank');
  };

  return (
    <div className="flex-1 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Kapora (Ön Ödeme) İşlemi</h2>
          </div>
          <span className="text-xs text-blue-400 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
            Güvenli Ödeme
          </span>
        </div>

        <div className="max-w-xl mx-auto space-y-6 mt-4">
          <div className="p-5 rounded-2xl bg-slate-100 dark:bg-gray-900/80 border border-slate-200 dark:border-gray-800 text-center space-y-2">
            <p className="text-sm text-slate-500 dark:text-gray-400">İş emrinizin ustalarımıza atanabilmesi için lütfen %20 ön ödeme (kapora) işlemini gerçekleştirin.</p>
            <div className="text-3xl font-black text-slate-900 dark:text-white pt-2">{depositAmount} TL</div>
            <p className="text-xs text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1">ÖDENECEK TUTAR (%20 KAPORA)</p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-gray-800 space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-gray-800 pb-4">
              <Building className="w-6 h-6 text-slate-500 dark:text-gray-400" />
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">{bankInfo.bankName}</div>
                <div className="text-xs text-slate-500 dark:text-gray-400">{bankInfo.accountName}</div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider block">TR IBAN Numarası</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-800 rounded-xl p-4 font-mono text-sm text-slate-900 dark:text-white tracking-widest">
                  {bankInfo.iban}
                </div>
                <button 
                  onClick={copyIban}
                  className="p-4 rounded-xl bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 hover:bg-slate-100 dark:hover:bg-gray-800 transition text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white shrink-0"
                  title="Kopyala"
                >
                  {copied ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs leading-relaxed">
              <strong>Önemli Not:</strong> Lütfen EFT/Havale yaparken açıklama kısmına <strong>WO-{workOrderId}</strong> iş emri numaranızı yazmayı unutmayın.
            </div>

            {/* Direct WhatsApp Dekont Sharing */}
            <div className="pt-2">
              <button
                type="button"
                onClick={openWhatsAppDekont}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40"
              >
                <MessageSquare className="w-4 h-4" />
                WhatsApp ile Dekont / Bilgi Gönder
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-3 pt-6 border-t border-slate-200 dark:border-gray-800 mt-6 md:relative fixed bottom-0 left-0 right-0 p-4 md:p-0 bg-white dark:bg-gray-950 md:bg-transparent border-t md:border-t-0 border-slate-200 dark:border-gray-800 z-30">
        <button 
          type="button" 
          onClick={() => setActiveStep(5)} 
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 text-sm font-semibold text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800 transition flex items-center justify-center"
        >
          Teklife Dön
        </button>
        <button 
          type="button" 
          onClick={handleDeclarePayment}
          disabled={declared}
          className={`w-full sm:w-auto px-8 py-3 rounded-xl text-sm font-bold shadow-lg transition flex items-center justify-center gap-2 ${
            declared 
              ? 'bg-green-600 text-white cursor-default' 
              : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white'
          }`}
        >
          {declared ? (
            <>
              Ödeme Bildirildi
              <CheckCircle2 className="w-5 h-5" />
            </>
          ) : (
            'Ödeme Yaptım (Sisteme Bildir)'
          )}
        </button>
      </div>
    </div>
  );
}

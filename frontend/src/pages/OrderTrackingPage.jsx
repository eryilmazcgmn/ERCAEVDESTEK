import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Search, ShieldCheck, CheckCircle2, Copy, Building, Clock, MapPin, Wrench, Phone, FileText, ExternalLink, ChevronLeft, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { api } from '../services/api';
import { toast } from 'sonner';

function formatIban(ibanStr) {
  if (!ibanStr) return 'TR00 0000 0000 0000 0000 0000 00';
  const clean = ibanStr.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return clean.match(/.{1,4}/g)?.join(' ') || ibanStr;
}

export default function OrderTrackingPage() {
  const { code: routeCode } = useParams();
  const [searchInput, setSearchInput] = useState(routeCode || '');
  const [loading, setLoading] = useState(false);
  const [trackingData, setTrackingData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchTracking = async (searchVal) => {
    if (!searchVal || !searchVal.trim()) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const apiUrl = api.getApiUrl();
      const isPhone = /^[0-9\+\s]{10,}$/.test(searchVal.trim());
      const endpoint = isPhone
        ? `${apiUrl}/tracking-by-phone/${encodeURIComponent(searchVal.trim())}`
        : `${apiUrl}/tracking-code/${encodeURIComponent(searchVal.trim())}`;

      const res = await axios.get(endpoint);
      setTrackingData(res.data?.data || null);
    } catch (err) {
      setTrackingData(null);
      setErrorMsg(err.response?.data?.message || 'Belirtilen sipariş kodu veya telefon numarası bulunamadı.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (routeCode) {
      fetchTracking(routeCode);
    }
  }, [routeCode]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTracking(searchInput);
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
      toast.error('Kopyalama başarısız oldu.');
    }
  };

  const activeWo = trackingData?.active_work_order || trackingData?.work_orders?.[0];
  const quotation = trackingData?.quotations?.[0];
  const customer = trackingData?.customer;

  const getTimelineStep = (status) => {
    switch (status) {
      case 'pending': return 1;
      case 'deposit_pending': return 2;
      case 'deposit_declared': return 3;
      case 'deposit_paid':
      case 'approved':
      case 'accepted':
      case 'scheduled':
      case 'in_progress': return 4;
      case 'completed': return 5;
      default: return 1;
    }
  };

  const currentStep = getTimelineStep(activeWo?.status);

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-black tracking-tight text-lg text-white">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
              E
            </div>
            <span>ERCA EV DESTEK</span>
          </Link>

          <Link to="/" className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" />
            Ana Sayfaya Dön
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 space-y-6">
        {/* Search Bar */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 bg-slate-950/60 shadow-2xl space-y-4">
          <div className="text-center space-y-1">
            <h1 className="text-xl md:text-2xl font-black text-white">Canlı Sipariş & Hizmet Takibi</h1>
            <p className="text-xs text-slate-400">
              Takip kodunuzu (Örn: WO-1005) veya kayıtta kullandığınız telefon numarasını giriniz.
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-lg mx-auto">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Sipariş Kodu (WO-1005) veya Telefon No"
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !searchInput.trim()}
              className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition disabled:opacity-50"
            >
              {loading ? 'Aranıyor...' : 'Sorgula'}
            </button>
          </form>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-400 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tracking Details */}
        {trackingData && (
          <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            {/* Timeline Bar */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 bg-slate-950/60 space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Hizmet Takip Kodu</span>
                  <h2 className="text-lg font-mono font-bold text-white">
                    WO-{activeWo?.id || quotation?.id || '1001'}
                  </h2>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Tarih</span>
                  <span className="text-xs text-slate-300 font-semibold">
                    {activeWo?.created_at ? new Date(activeWo.created_at).toLocaleDateString('tr-TR') : 'Bugün'}
                  </span>
                </div>
              </div>

              {/* Step Progress Bar */}
              <div className="relative pt-4">
                <div className="grid grid-cols-5 text-center text-[10px] font-bold space-y-1">
                  <div className={currentStep >= 1 ? 'text-blue-400' : 'text-slate-600'}>
                    1. Teklif Oluşturuldu
                  </div>
                  <div className={currentStep >= 2 ? 'text-amber-400' : 'text-slate-600'}>
                    2. Kapora Bekleniyor
                  </div>
                  <div className={currentStep >= 3 ? 'text-indigo-400' : 'text-slate-600'}>
                    3. Ödeme Kontrolünde
                  </div>
                  <div className={currentStep >= 4 ? 'text-emerald-400' : 'text-slate-600'}>
                    4. Usta Yolda
                  </div>
                  <div className={currentStep >= 5 ? 'text-green-400' : 'text-slate-600'}>
                    5. Tamamlandı
                  </div>
                </div>

                <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden flex">
                  <div 
                    className="bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 h-full transition-all duration-500"
                    style={{ width: `${(currentStep / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Order Info */}
              <div className="glass-panel p-6 rounded-3xl border border-slate-800 bg-slate-950/60 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
                  Müşteri & Hizmet Özeti
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Müşteri Adı:</span>
                    <span className="font-bold text-white">{customer?.name || 'Müşteri'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Telefon:</span>
                    <span className="font-bold text-white">{customer?.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Adres:</span>
                    <span className="font-semibold text-slate-300 text-right max-w-xs">{customer?.address}</span>
                  </div>
                  {activeWo?.preferred_date && (
                    <div className="flex justify-between border-t border-slate-800/80 pt-2">
                      <span className="text-slate-400">Servis Zamanı:</span>
                      <span className="font-bold text-blue-400">
                        {new Date(activeWo.preferred_date).toLocaleDateString('tr-TR')} {activeWo.time_slot}
                      </span>
                    </div>
                  )}
                  {activeWo?.technician_name && (
                    <div className="flex justify-between border-t border-slate-800/80 pt-2">
                      <span className="text-slate-400">Atanan Usta:</span>
                      <span className="font-bold text-emerald-400">{activeWo.technician_name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bank & Payment Card */}
              <div className="glass-panel p-6 rounded-3xl border border-blue-500/20 bg-blue-950/20 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 border-b border-slate-800 pb-2 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-blue-400" />
                  Havale / EFT Kapora Bilgileri
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Banka Adı:</span>
                    <span className="font-bold text-white">Ziraat Bankası</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Alıcı Adı:</span>
                    <span className="font-bold text-white">ERCA Ev Destek Ltd. Şti.</span>
                  </div>
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">TR IBAN</span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-2.5 font-mono text-xs text-white tracking-widest">
                        {formatIban('TR00 0000 0000 0000 0000 0000 00')}
                      </div>
                      <button
                        type="button"
                        onClick={() => copyText('TR00 0000 0000 0000 0000 0000 00', 'IBAN')}
                        className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition shrink-0"
                        title="IBAN'ı Kopyala"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

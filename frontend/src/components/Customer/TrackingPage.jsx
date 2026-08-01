import React, { useState, useEffect } from 'react';
import { Search, CheckCircle2, Clock, Calendar, Wrench, FileText, MapPin, MessageSquare, ExternalLink, ShieldCheck, Phone, Hash } from 'lucide-react';
import { api } from '../../services/api';

export default function TrackingPage({ initialSessionId, onBack }) {
  const [searchMode, setSearchMode] = useState('session'); // 'session' | 'phone'
  const [searchInput, setSearchInput] = useState(initialSessionId || '');
  const [activeQuery, setActiveQuery] = useState({ mode: 'session', value: initialSessionId || '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [trackingData, setTrackingData] = useState(null);
  const [whatsappNumber, setWhatsappNumber] = useState('905551234567');

  // Load WhatsApp number from settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch(`${api.getApiUrl()}/settings`);
        const json = await res.json();
        const settings = json.data || json;
        if (settings.whatsapp_number) {
          setWhatsappNumber(settings.whatsapp_number);
        }
      } catch (err) {
        console.error('Settings load error:', err);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    if (activeQuery.value) {
      fetchTracking(activeQuery.mode, activeQuery.value);

      // Auto-poll every 10 seconds for status changes
      const interval = setInterval(() => {
        fetchTracking(activeQuery.mode, activeQuery.value, true);
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [activeQuery]);

  const fetchTracking = async (mode, value, isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError('');
    try {
      const endpoint = mode === 'phone'
        ? `${api.getBackendUrl()}/api/tracking-by-phone/${encodeURIComponent(value)}`
        : `${api.getBackendUrl()}/api/tracking/${encodeURIComponent(value)}`;

      const response = await fetch(endpoint);
      const data = await response.json();

      if (data.status || data.success) {
        const rawData = data.data || data;
        const normalizedData = {
          ...rawData,
          quotation: rawData.quotation || (rawData.quotations && rawData.quotations.length > 0 ? rawData.quotations[0] : null),
          work_order: rawData.work_order || rawData.active_work_order || (rawData.work_orders && rawData.work_orders.length > 0 ? rawData.work_orders[0] : null),
        };
        setTrackingData(normalizedData);
      } else {
        if (!isSilent) setError(data.message || 'Sipariş bilgisi bulunamadı.');
      }
    } catch (err) {
      if (!isSilent) setError('Bağlantı hatası oluştu. Lütfen bilgilerinizi kontrol ediniz.');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setActiveQuery({ mode: searchMode, value: searchInput.trim() });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'deposit_pending':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Kapora Bekleniyor</span>;
      case 'deposit_declared':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-500/30 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Havale Bildirildi (Onay Bekliyor)</span>;
      case 'deposit_paid':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Kapora Onaylandı (Usta Atama Aşamasında)</span>;
      case 'scheduled':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary-100 dark:bg-primary-950/80 text-primary-700 dark:text-primary-300 border border-primary-300 dark:border-primary-500/30 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Randevu Planlandı (Usta Atandı)</span>;
      case 'active':
      case 'in_progress':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/30 flex items-center gap-1.5"><Wrench className="w-3.5 h-3.5" /> Usta Adreste / İş Devam Ediyor</span>;
      case 'completed':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 dark:bg-green-950/80 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-500/30 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> İş Tamamlandı</span>;
      case 'cancelled':
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-500/30 flex items-center gap-1.5">İptal Edildi</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300">İşlemde</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header Search Bar */}
      <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-gray-800 text-center space-y-4">
        <div className="inline-flex p-3 rounded-2xl bg-primary-600/20 text-primary-400 mb-1">
          <Search className="w-8 h-8" />
        </div>
        <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">Sipariş & Teklif Durum Takibi</h2>
        <p className="text-xs md:text-sm text-slate-500 dark:text-gray-400 max-w-lg mx-auto">
          Oturum kodunuz veya telefon numaranız ile teklifinizin ve usta randevunuzun durumunu canlı takip edebilirsiniz.
        </p>

        {/* Tab switcher: Session ID vs Phone */}
        <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-800">
          <button
            type="button"
            onClick={() => { setSearchMode('session'); setSearchInput(''); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              searchMode === 'session'
                ? 'bg-primary-600 text-white shadow'
                : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            Oturum Kodu ile
          </button>
          <button
            type="button"
            onClick={() => { setSearchMode('phone'); setSearchInput(''); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              searchMode === 'phone'
                ? 'bg-primary-600 text-white shadow'
                : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            Telefon Numarası ile
          </button>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto pt-2">
          <input
            type={searchMode === 'phone' ? 'tel' : 'text'}
            required
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={searchMode === 'phone' ? 'Telefon Numarası (05xx xxx xx xx)' : 'Oturum Kodunuz (SES_...)'}
            className="flex-1 bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:border-primary-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 font-bold text-sm text-white transition flex items-center justify-center gap-2"
          >
            {loading ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span> : 'Sorgula'}
          </button>
        </form>

        {onBack && (
          <button
            onClick={onBack}
            className="text-xs text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white underline pt-2 block mx-auto"
          >
            ← Ana Sihirbaza Dön
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300 text-center text-sm font-semibold">
          {error}
        </div>
      )}

      {trackingData && (
        <div className="space-y-6">
          {/* Main Status Banner */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-gray-800 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-gray-800 pb-4">
              <div>
                <span className="text-xs font-bold text-primary-400 uppercase tracking-widest block mb-1">OTURUM KODU</span>
                <h3 className="text-lg font-mono font-bold text-slate-900 dark:text-white">{trackingData.session_id}</h3>
              </div>
              {getStatusBadge(trackingData.work_order?.status || trackingData.quotation?.status)}
            </div>

            {/* Customer & Address Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-100 dark:bg-gray-900/60 border border-slate-200 dark:border-gray-800 space-y-1">
                <span className="text-[10px] text-slate-400 dark:text-gray-500 font-bold uppercase block">MÜŞTERİ BİLGİSİ</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{trackingData.customer?.name || 'Müşteri'}</p>
                <p className="text-xs text-slate-500 dark:text-gray-400">{trackingData.customer?.phone || '-'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-100 dark:bg-gray-900/60 border border-slate-200 dark:border-gray-800 space-y-1">
                <span className="text-[10px] text-slate-400 dark:text-gray-500 font-bold uppercase block">HİZMET ADRESİ (ANKARA - ÇANKAYA)</span>
                <p className="text-xs font-medium text-slate-700 dark:text-gray-300 flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-primary-400 shrink-0 mt-0.5" />
                  {trackingData.customer?.address || 'Belirtilmedi'}
                </p>
              </div>
            </div>
          </div>

          {/* Quotation & Pricing Summary */}
          {trackingData.quotation && (
            <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-gray-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 pb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary-400" />
                  Teklif & Fiyat Detayı (#{trackingData.quotation.id})
                </h3>
                {trackingData.quotation.pdf_url && (
                  <a
                    href={trackingData.quotation.pdf_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary-400 font-bold hover:underline flex items-center gap-1"
                  >
                    PDF İndir <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div className="space-y-2">
                {trackingData.quotation.price_details?.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs text-slate-700 dark:text-gray-300 py-1 border-b border-slate-200 dark:border-gray-800/40">
                    <span>{item.description}</span>
                    <span className="font-bold">{item.price} TL</span>
                  </div>
                ))}

                <div className="pt-2 flex justify-between text-sm font-black text-slate-900 dark:text-white">
                  <span>Genel Toplam:</span>
                  <span className="text-primary-400">{trackingData.quotation.price_details?.total} TL</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-emerald-400">
                  <span>Ödenecek Kapora (%20):</span>
                  <span>{trackingData.quotation.price_details?.deposit_amount} TL</span>
                </div>
              </div>
            </div>
          )}

          {/* Technician & Appointment Info */}
          {trackingData.work_order && (
            <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-gray-800 space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-blue-400" />
                Usta ve Randevu Durumu
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-gray-900/60 border border-slate-200 dark:border-gray-800">
                  <span className="text-[10px] text-slate-400 dark:text-gray-500 font-bold uppercase block mb-1">ATANAN USTA</span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {trackingData.work_order.technician_name || 'Henüz Usta Atanmadı'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-gray-900/60 border border-slate-200 dark:border-gray-800">
                  <span className="text-[10px] text-slate-400 dark:text-gray-500 font-bold uppercase block mb-1">RANDEVU SAATİ</span>
                  <p className="text-sm font-bold text-primary-300">
                    {trackingData.work_order.scheduled_at 
                      ? new Date(trackingData.work_order.scheduled_at).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })
                      : 'Kapora onaylandıktan sonra randevu saati belirlenecektir.'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Uploaded Photos */}
          {trackingData.photos?.length > 0 && (
            <div className="glass-panel p-6 rounded-3xl border border-slate-200 dark:border-gray-800 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Gönderdiğiniz Referans Fotoğrafları</h3>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {trackingData.photos.map(p => (
                  <a key={p.id} href={p.url} target="_blank" rel="noreferrer" className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-gray-800 shrink-0 block hover:opacity-80 transition">
                    <img src={p.url} alt="" className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Direct WhatsApp Support */}
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-300 text-xs">
              <ShieldCheck className="w-6 h-6 shrink-0" />
              <span>Sorunuz veya ek talebiniz mi var? ERCA Destek Ekibi Çankaya merkezinde hizmetinizdedir.</span>
            </div>
            <a
              href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Merhaba, ${trackingData.session_id} kodlu siparişim hakkında bilgi almak istiyorum.`)}`}
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white shrink-0 transition flex items-center gap-1.5"
            >
              <MessageSquare className="w-4 h-4" />
              WhatsApp Destek
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

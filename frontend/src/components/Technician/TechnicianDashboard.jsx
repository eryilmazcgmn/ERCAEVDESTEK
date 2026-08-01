import React, { useState } from 'react';
import { LogOut, Wrench, CheckCircle2, Clock, Calendar, MapPin, Phone, MessageSquare, Image, ExternalLink, Navigation, CheckSquare } from 'lucide-react';

export default function TechnicianDashboard({
  crmWorkOrders,
  handleUpdateWoStatus,
  handleLogout,
  loggedUser,
  backendUrl
}) {
  const [selectedPhotos, setSelectedPhotos] = useState(null);
  const [completeModalWo, setCompleteModalWo] = useState(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [completionPhoto, setCompletionPhoto] = useState('');
  const [submittingComplete, setSubmittingComplete] = useState(false);

  const myWorkOrders = crmWorkOrders.filter(wo => wo.technician_id == loggedUser?.id);
  const pendingOrScheduled = myWorkOrders.filter(wo => wo.status === 'scheduled' || wo.status === 'active' || wo.status === 'in_progress');
  const completed = myWorkOrders.filter(wo => wo.status === 'completed');

  const openGoogleMaps = (address) => {
    if (!address) return;
    const query = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const openYandexNavi = (address) => {
    if (!address) return;
    const query = encodeURIComponent(address);
    window.open(`https://yandex.com.tr/harita/?text=${query}`, '_blank');
  };

  const openCustomerWhatsApp = (phone, name, woId) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('0') ? '9' + cleanPhone : cleanPhone;
    const text = encodeURIComponent(`Merhaba Sayın ${name},\nERCA Ev Destek (#WO-${woId}) hizmetiniz için adrese ulaşıyorum. Bilgilerinize sunarım.`);
    window.open(`https://wa.me/${formattedPhone}?text=${text}`, '_blank');
  };

  const submitCompletion = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!completeModalWo) return;

    setSubmittingComplete(true);
    try {
      await handleUpdateWoStatus(completeModalWo.id, 'completed', completionNotes, completionPhoto);
      setCompleteModalWo(null);
      setCompletionNotes('');
      setCompletionPhoto('');
    } finally {
      setSubmittingComplete(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090a0f] text-slate-800 dark:text-gray-200 p-4 md:p-8">
      <header className="max-w-4xl mx-auto flex items-center justify-between mb-8 pb-4 border-b border-slate-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-900/50 flex items-center justify-center border border-primary-500/20">
            <Wrench className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Ankara Çankaya — Usta Saha Paneli</h1>
            <p className="text-xs text-slate-500 dark:text-gray-400">Hoş geldin Usta, {loggedUser?.name || loggedUser?.username}</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 hover:bg-slate-100 dark:hover:bg-gray-800 transition text-red-400 hover:text-red-300 flex items-center gap-2 text-sm font-semibold"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:block">Çıkış Yap</span>
        </button>
      </header>

      <main className="max-w-4xl mx-auto space-y-8">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-primary-50 dark:bg-primary-950/20 border border-primary-200 dark:border-primary-800/40">
            <div className="text-xs font-bold text-primary-600 dark:text-primary-400 mb-1 uppercase">Aktif İşlerim</div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">{pendingOrScheduled.length}</div>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40">
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1 uppercase">Tamamlanan İlerleme</div>
            <div className="text-3xl font-black text-emerald-400">{completed.length}</div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-400" />
            Atanmış Çankaya İş Emirlerim
          </h2>
          {pendingOrScheduled.length === 0 ? (
            <div className="p-8 text-center text-slate-400 dark:text-gray-500 bg-slate-100 dark:bg-gray-900/30 rounded-2xl border border-slate-200 dark:border-gray-800 border-dashed">
              Şu an için atanan bekleyen işiniz bulunmuyor.
            </div>
          ) : (
            <div className="grid gap-4">
              {pendingOrScheduled.map(wo => (
                <div key={wo.id} className="p-6 rounded-3xl bg-slate-100 dark:bg-gray-900/90 border border-slate-200 dark:border-gray-800 space-y-4 shadow-xl">
                  <div className="flex justify-between items-start border-b border-slate-200 dark:border-gray-800 pb-4">
                    <div>
                      <span className="text-[10px] font-bold text-primary-400 uppercase tracking-widest block mb-1">MÜŞTERİ BİLGİSİ</span>
                      <div className="text-base font-bold text-slate-900 dark:text-white">{wo.customer?.name}</div>
                      
                      <div className="flex items-center gap-3 mt-2">
                        <a 
                          href={`tel:${wo.customer?.phone}`} 
                          className="text-xs text-blue-400 hover:underline font-bold flex items-center gap-1 bg-blue-950/40 px-2.5 py-1 rounded-lg border border-blue-500/20"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          {wo.customer?.phone}
                        </a>
                      </div>

                      <div className="text-xs text-primary-700 dark:text-primary-200 mt-2 font-medium bg-primary-50 dark:bg-primary-950/40 p-2.5 rounded-xl border border-primary-200 dark:border-primary-500/20 flex items-start gap-1.5">
                        <MapPin className="w-4 h-4 text-primary-400 shrink-0 mt-0.5" />
                        <span>{wo.customer?.address || 'Çankaya / Ankara'}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono text-primary-300 font-bold">#WO-{wo.id}</div>
                      <div className="text-xs font-bold text-emerald-400 mt-2 bg-emerald-950/40 px-3 py-1.5 rounded-xl border border-emerald-500/20 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {wo.scheduled_at ? new Date(wo.scheduled_at).toLocaleString('tr-TR') : 'Randevu Zamanlandı'}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => openGoogleMaps(wo.customer?.address)}
                      className="px-3 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 font-bold text-xs text-white transition flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      Google Maps
                    </button>

                    <button
                      type="button"
                      onClick={() => openYandexNavi(wo.customer?.address)}
                      className="px-3 py-2.5 rounded-xl bg-yellow-600 hover:bg-yellow-500 font-bold text-xs text-white transition flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      Yandex Nav
                    </button>

                    <button
                      type="button"
                      onClick={() => openCustomerWhatsApp(wo.customer?.phone, wo.customer?.name, wo.id)}
                      className="px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white transition flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      WhatsApp
                    </button>

                    {wo.photos?.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedPhotos(wo.photos)}
                        className="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-gray-800 hover:bg-gray-700 font-bold text-xs text-slate-800 dark:text-gray-200 transition flex items-center justify-center gap-1.5"
                      >
                        <Image className="w-3.5 h-3.5 text-primary-400" />
                        Foto ({wo.photos.length})
                      </button>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200 dark:border-gray-800">
                    {wo.pdf_path ? (
                      <a 
                        href={`${backendUrl}/${wo.pdf_path}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="px-3 py-2 rounded-xl bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-800 text-xs font-semibold text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800 transition flex items-center gap-1"
                      >
                        İş Emri PDF <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-gray-500">PDF Yok</span>
                    )}

                    <div className="flex items-center gap-2">
                      {wo.status !== 'in_progress' && (
                        <button 
                          onClick={() => handleUpdateWoStatus(wo.id, 'in_progress')}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center gap-1"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          Yoldayım
                        </button>
                      )}
                      
                      <button 
                        onClick={() => {
                          setCompleteModalWo(wo);
                          setCompletionNotes('');
                          setCompletionPhoto('');
                        }}
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg transition flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        İş Tamamlandı
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Photo Modal */}
      {selectedPhotos && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setSelectedPhotos(null)}>
          <div className="glass-panel p-6 rounded-3xl max-w-2xl w-full space-y-4 border border-slate-200 dark:border-gray-800" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-gray-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Müşterinin Yüklediği Keşif Fotoğrafları</h3>
              <button onClick={() => setSelectedPhotos(null)} className="text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white font-bold">✕</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto">
              {selectedPhotos.map(p => (
                <a key={p.id} href={p.url} target="_blank" rel="noreferrer" className="rounded-xl overflow-hidden border border-slate-200 dark:border-gray-800 block hover:opacity-80">
                  <img src={p.url} alt="" className="w-full h-36 object-cover" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Completion Modal for Technician */}
      {completeModalWo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setCompleteModalWo(null)}>
          <div className="glass-panel p-6 rounded-3xl max-w-lg w-full space-y-4 border border-emerald-300 dark:border-emerald-500/30 bg-white dark:bg-slate-900" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                İş Emrini Tamamla (#WO-{completeModalWo.id})
              </h3>
              <button onClick={() => setCompleteModalWo(null)} className="text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white font-bold">✕</button>
            </div>
            
            <form onSubmit={submitCompletion} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-gray-300 uppercase mb-1">Tamamlama Notları & Yapılan İşlem</label>
                <textarea
                  rows={3}
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="Montaj/Tesisat işlemi başarıyla tamamlandı. Müşteriye teslim edildi..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-gray-300 uppercase mb-1">Bitirme Fotoğrafı Bağlantısı / URL (Opsiyonel)</label>
                <input
                  type="text"
                  value={completionPhoto}
                  onChange={(e) => setCompletionPhoto(e.target.value)}
                  placeholder="https://... (veya fotoğraf adresi)"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCompleteModalWo(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-gray-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={submittingComplete}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg transition flex items-center gap-1.5"
                >
                  {submittingComplete ? 'Kaydediliyor...' : 'İşi Onayla ve Tamamla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

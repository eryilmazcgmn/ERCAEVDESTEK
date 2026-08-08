import React, { useState } from 'react';
import { MessageSquare, ExternalLink, Image, UserCheck, Calendar, AlertCircle, Wrench, RefreshCw, Download, Search, Eye, FileText } from 'lucide-react';
import { api } from '../../services/api';
import WorkOrderDetailsModal from './WorkOrderDetailsModal';

export default function WorkOrdersTab({ 
  crmWorkOrders = [],
  crmTechnicians = [],
  crmServices = [],
  handleUpdateWoStatus,
  handleAssignTechnician,
  backendUrl,
  targetWoId,
  setTargetWoId
}) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [selectedDetailsWo, setSelectedDetailsWo] = useState(null);
  const [quickAssignWo, setQuickAssignWo] = useState(null);
  const [selectedTechId, setSelectedTechId] = useState('');
  const [selectedScheduleAt, setSelectedScheduleAt] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState(null);
  const [submittingAssign, setSubmittingAssign] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  React.useEffect(() => {
    if (targetWoId && crmWorkOrders.length > 0) {
      const match = crmWorkOrders.find(w => w.id === targetWoId || w.quotation_id === targetWoId);
      if (match) {
        setQuickAssignWo(match);
        setSelectedTechId(match.technician_id || (crmTechnicians[0]?.id || ''));
        setSelectedScheduleAt(match.scheduled_at ? new Date(match.scheduled_at).toISOString().slice(0, 16) : '');
        if (setTargetWoId) setTargetWoId(null);
      }
    }
  }, [targetWoId, crmWorkOrders]);

  const sendWhatsAppCustomer = (wo) => {
    const phone = wo.customer?.phone?.replace(/\D/g, '');
    if (!phone) return alert('Müşteri telefon numarası bulunamadı.');
    const text = encodeURIComponent(
      `Merhaba Sayın ${wo.customer?.name},\nERCA Ev Destek (#WO-${wo.id}) numaralı iş emrinizin durumu güncellenmiştir.\nRandevu Saatiniz: ${wo.scheduled_at ? new Date(wo.scheduled_at).toLocaleString('tr-TR') : 'Belirleniyor'}\nAtanan Usta: ${wo.technician_name || 'Atanıyor'}\nDetaylı bilgi için WhatsApp'tan yazabilirsiniz.`
    );
    window.open(`https://wa.me/${phone.startsWith('0') ? '9' + phone : phone}?text=${text}`, '_blank');
  };

  const sendWhatsAppTechnician = (wo) => {
    const text = encodeURIComponent(
      `Sayın Usta,\nYeni İş Emri Atandı (#WO-${wo.id}):\nMüşteri: ${wo.customer?.name}\nTelefon: ${wo.customer?.phone}\nAdres (Çankaya): ${wo.customer?.address}\nTarih/Saat: ${wo.scheduled_at ? new Date(wo.scheduled_at).toLocaleString('tr-TR') : 'Hemen'}\nİyi çalışmalar!`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleOpenAssignModal = (wo) => {
    setQuickAssignWo(wo);
    setSelectedTechId(wo.technician_id || (crmTechnicians[0]?.id || ''));
    setSelectedScheduleAt(wo.scheduled_at ? new Date(wo.scheduled_at).toISOString().slice(0, 16) : '');
  };

  const handleConfirmAssignment = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedTechId) {
      alert('Lütfen görevlendirilecek bir usta seçiniz.');
      return;
    }

    setSubmittingAssign(true);
    try {
      if (quickAssignWo.status === 'deposit_pending' || quickAssignWo.status === 'deposit_declared') {
        await handleUpdateWoStatus(quickAssignWo.id, 'deposit_paid');
      }

      await handleAssignTechnician(quickAssignWo.id, selectedTechId, selectedScheduleAt || null);
      setQuickAssignWo(null);
    } catch (err) {
      console.error(err);
      alert('Usta atanırken bir hata oluştu: ' + (err.message || 'Lütfen bilgileri kontrol ediniz.'));
    } finally {
      setSubmittingAssign(false);
    }
  };

  const handleStatusChangeInline = async (woId, newStatus) => {
    setUpdatingStatusId(woId);
    try {
      await handleUpdateWoStatus(woId, newStatus);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleDownloadCsv = () => {
    const token = sessionStorage.getItem('adminToken');
    window.open(`${api.getBackendUrl()}/api/admin/export/work-orders?token=${token}`, '_blank');
  };

  const filteredWorkOrders = crmWorkOrders.filter(wo => {
    const matchesSearch =
      !searchTerm ||
      (wo.customer?.name && wo.customer.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (wo.technician_name && wo.technician_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (wo.id && wo.id.toString().includes(searchTerm));

    if (!matchesSearch) return false;

    if (activeFilter === 'pending') return wo.status === 'deposit_pending' || wo.status === 'deposit_declared';
    if (activeFilter === 'unassigned') return wo.status === 'deposit_paid' || !wo.technician_name;
    if (activeFilter === 'scheduled') return wo.status === 'scheduled' || wo.status === 'in_progress' || wo.status === 'active';
    if (activeFilter === 'completed') return wo.status === 'completed';
    return true;
  });

  const getServiceName = (wo) => {
    const slug = wo.quotation?.service_type || wo.service_type;
    const match = crmServices.find(s => s.slug === slug || s.id === slug || String(s.id) === String(slug));
    if (match) return match.name;
    if (slug === 'tv-mount') return 'TV Montajı';
    if (slug === 'paint') return 'İç Cephe Boyama';
    if (slug === 'plumbing') return 'Sıhhi Tesisat';
    if (slug === 'electric') return 'Elektrik İşleri';
    if (slug === 'chandelier') return 'Avize Montajı';
    return slug || 'Genel Hizmet';
  };

  const totalPages = Math.ceil(filteredWorkOrders.length / itemsPerPage);
  const currentItems = filteredWorkOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-gray-800/80 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-primary-400" />
            İş Emirleri Yönetimi & Detayları
          </h2>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
            Gelen işlerin üzerine tıklayarak müşteri form cevaplarını, yüklenen fotoğrafları ve randevu saatlerini detaylı görün.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Müşteri, usta veya WO # ara..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-primary-500"
            />
          </div>

          <button
            type="button"
            onClick={handleDownloadCsv}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition flex items-center gap-1.5 shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            CSV İndir
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-200 dark:border-gray-800 pb-3 scrollbar-none">
        <button
          type="button"
          onClick={() => { setActiveFilter('all'); setCurrentPage(1); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeFilter === 'all'
              ? 'bg-primary-600 text-white shadow-md'
              : 'bg-slate-100 dark:bg-gray-900 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Tüm İş Emirleri ({crmWorkOrders.length})
        </button>

        <button
          type="button"
          onClick={() => { setActiveFilter('pending'); setCurrentPage(1); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeFilter === 'pending'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-slate-100 dark:bg-gray-900 text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-white'
          }`}
        >
          Kapora / Havale Bekleyenler ({crmWorkOrders.filter(w => w.status === 'deposit_pending' || w.status === 'deposit_declared').length})
        </button>

        <button
          type="button"
          onClick={() => { setActiveFilter('unassigned'); setCurrentPage(1); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeFilter === 'unassigned'
              ? 'bg-cyan-600 text-white shadow-md'
              : 'bg-slate-100 dark:bg-gray-900 text-cyan-600 dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-white'
          }`}
        >
          Usta Ataması Bekleyenler ({crmWorkOrders.filter(w => w.status === 'deposit_paid' || (!w.technician_name && w.status !== 'completed')).length})
        </button>

        <button
          type="button"
          onClick={() => { setActiveFilter('scheduled'); setCurrentPage(1); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeFilter === 'scheduled'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-100 dark:bg-gray-900 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-white'
          }`}
        >
          Planlanan & Sahadakiler ({crmWorkOrders.filter(w => w.status === 'scheduled' || w.status === 'in_progress').length})
        </button>

        <button
          type="button"
          onClick={() => { setActiveFilter('completed'); setCurrentPage(1); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeFilter === 'completed'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-100 dark:bg-gray-900 text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-white'
          }`}
        >
          Tamamlananlar ({crmWorkOrders.filter(w => w.status === 'completed').length})
        </button>
      </div>

      {/* Main Table or Empty State */}
      {filteredWorkOrders.length === 0 ? (
        <div className="p-12 text-center space-y-4 bg-slate-100/50 dark:bg-gray-900/30 rounded-3xl border border-slate-200 dark:border-gray-800 border-dashed max-w-xl mx-auto my-6">
          <div className="w-12 h-12 rounded-2xl bg-primary-950/50 text-primary-400 flex items-center justify-center mx-auto border border-primary-500/20">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Henüz Kayıtlı İş Emri Bulunmuyor</h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 leading-relaxed">
              Müşterileriniz sihirbazı doldurup teklif onayladığında veya kapora ödemesi bildirdiğinde iş emirleri bu ekranda otomatik listelenecektir.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-500 dark:text-gray-400">
            <thead>
              <tr className="border-b border-slate-200 dark:border-gray-800 text-slate-800 dark:text-gray-200">
                <th className="py-3 px-4 min-w-[150px]">İş Emri & Müşteri</th>
                <th className="py-3 px-4 min-w-[200px]">Adres & Fotoğraflar</th>
                <th className="py-3 px-4 min-w-[220px]">Atanan Usta & Tarih</th>
                <th className="py-3 px-4 min-w-[160px]">Durumu Değiştir / Yönet</th>
                <th className="py-3 px-4 min-w-[180px]">Hızlı İşlem / Atama</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((wo, i) => (
                <tr key={i} className="border-b border-slate-200 dark:border-gray-800/50 hover:bg-slate-50 dark:hover:bg-gray-900/20">
                  <td className="py-3 px-4 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-gray-800/40 transition rounded-l-xl" onClick={() => setSelectedDetailsWo(wo)}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="font-mono text-xs text-primary-500 font-bold">#WO-{wo.id}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
                        {getServiceName(wo)}
                      </span>
                    </div>
                    <div className="font-bold text-slate-900 dark:text-white text-sm hover:text-blue-500 transition flex items-center gap-1">
                      {wo.customer?.name || 'Müşteri'}
                      <Eye className="w-3 h-3 text-slate-400 opacity-60" />
                    </div>
                    <div className="text-xs text-slate-500 dark:text-gray-400">{wo.customer?.phone || '-'}</div>
                  </td>

                  <td className="py-3 px-4 max-w-xs cursor-pointer" onClick={() => setSelectedDetailsWo(wo)}>
                    <div className="text-xs text-slate-700 dark:text-gray-300 font-medium truncate">{wo.customer?.address || 'Çankaya / Ankara'}</div>
                    {(wo.photos?.length > 0 || wo.quotation?.photos?.length > 0) && (
                      <span
                        className="mt-1.5 px-2 py-1 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold inline-flex items-center gap-1"
                      >
                        <Image className="w-3 h-3" />
                        {(wo.photos || wo.quotation?.photos).length} Fotoğraf Var
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    {wo.technician_name ? (
                      <div>
                        <div className="text-slate-900 dark:text-white font-bold text-xs flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-green-400" />
                          {wo.technician_name}
                        </div>
                        <div className="text-[11px] text-primary-300 font-semibold mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {wo.scheduled_at ? new Date(wo.scheduled_at).toLocaleString('tr-TR') : 'Randevu zamanı bekleniyor'}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-amber-400 font-bold bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-500/30 inline-block">
                        ⚠️ Usta Atanmadı
                      </span>
                    )}
                  </td>

                  {/* Interactive Status Selector Dropdown */}
                  <td className="py-3 px-4 space-y-1.5">
                    <select
                      disabled={updatingStatusId === wo.id}
                      value={wo.status}
                      onChange={(e) => handleStatusChangeInline(wo.id, e.target.value)}
                      className={`w-full text-xs font-bold rounded-xl p-2 border focus:outline-none transition cursor-pointer ${
                        wo.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40' :
                        wo.status === 'cancelled' ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-300 dark:border-red-500/40' : 
                        wo.status === 'deposit_pending' ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/40' :
                        wo.status === 'deposit_declared' ? 'bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-500/40 animate-pulse' :
                        wo.status === 'deposit_paid' ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-500/40' : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      <option value="deposit_pending">⏳ Havale Bekliyor</option>
                      <option value="deposit_declared">📣 Havale Bildirildi (Müşteri)</option>
                      <option value="deposit_paid">💳 Havale Onaylandı</option>
                      <option value="scheduled">👷 Usta Atandı</option>
                      <option value="in_progress">🔨 İşlemde / Sahada</option>
                      <option value="completed">✅ Tamamlandı</option>
                      <option value="cancelled">❌ İptal Edildi</option>
                    </select>

                    {updatingStatusId === wo.id && (
                      <span className="text-[10px] text-primary-400 flex items-center gap-1 font-semibold">
                        <RefreshCw className="w-3 h-3 animate-spin" /> Durum Güncelleniyor...
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedDetailsWo(wo)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-500" />
                      Detayları Gör
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenAssignModal(wo)}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-500 hover:to-blue-500 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      {wo.technician_name ? 'Ustayı Değiştir' : 'Tek Tıkla Usta Ata'}
                    </button>

                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => sendWhatsAppCustomer(wo)}
                        className="flex-1 px-2 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/60 text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                        title="Müşteriye WhatsApp"
                      >
                        <MessageSquare className="w-3 h-3" />
                        Müşteri
                      </button>

                      {wo.technician_name && (
                        <button
                          type="button"
                          onClick={() => sendWhatsAppTechnician(wo)}
                          className="flex-1 px-2 py-1 rounded-lg bg-blue-950/60 border border-blue-500/30 text-blue-300 hover:bg-blue-900/60 text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                          title="Ustaya WhatsApp"
                        >
                          <MessageSquare className="w-3 h-3" />
                          Usta
                        </button>
                      )}
                    </div>

                    {wo.pdf_path && (
                      <a 
                        href={`${backendUrl}/${wo.pdf_path}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 text-[10px] text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800 text-center flex items-center justify-center transition gap-1"
                      >
                        İş Emri PDF <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-gray-800 text-xs">
          <span className="text-slate-500 dark:text-gray-400">
            Sayfa {currentPage} / {totalPages} (Toplam {filteredWorkOrders.length} iş emri)
          </span>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-gray-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-gray-800 transition"
            >
              Önceki
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-gray-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-gray-800 transition"
            >
              Sonraki
            </button>
          </div>
        </div>
      )}

      {/* Quick Technician Assignment Modal */}
      {quickAssignWo && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setQuickAssignWo(null)}>
          <div className="glass-panel p-6 rounded-3xl max-w-md w-full space-y-5 border border-primary-300 dark:border-primary-500/30 bg-white dark:bg-slate-900" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                Hızlı Usta Atama (#WO-{quickAssignWo.id})
              </h3>
              <button onClick={() => setQuickAssignWo(null)} className="text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white font-bold">✕</button>
            </div>

            <div className="p-3.5 rounded-xl bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-500/20 text-xs text-primary-700 dark:text-primary-200 space-y-1">
              <div><strong>Müşteri:</strong> {quickAssignWo.customer?.name} ({quickAssignWo.customer?.phone})</div>
              <div><strong>Adres:</strong> {quickAssignWo.customer?.address || 'Çankaya / Ankara'}</div>
            </div>

            <form onSubmit={handleConfirmAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-gray-300 uppercase mb-1">Görevlendirilecek Usta *</label>
                <select
                  required
                  value={selectedTechId}
                  onChange={(e) => setSelectedTechId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="">-- Listeden Usta Seçiniz --</option>
                  {crmTechnicians.map(tech => (
                    <option key={tech.id} value={tech.id}>{tech.name} (@{tech.username})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-gray-300 uppercase mb-1">Randevu Tarih & Saati (Opsiyonel)</label>
                <input
                  type="datetime-local"
                  value={selectedScheduleAt}
                  onChange={(e) => setSelectedScheduleAt(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setQuickAssignWo(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-gray-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={submittingAssign || !selectedTechId}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submittingAssign ? 'Atanıyor...' : 'Usta Atamayı Onayla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Photo Modal */}
      {selectedPhotos && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedPhotos(null)}>
          <div className="glass-panel p-6 rounded-3xl max-w-2xl w-full space-y-4 border border-slate-200 dark:border-gray-800 bg-white dark:bg-slate-900" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Müşteri Referans Fotoğrafları</h3>
              <button onClick={() => setSelectedPhotos(null)} className="text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white font-bold">✕</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto">
              {selectedPhotos.map(p => (
                <a key={p.id} href={p.url} target="_blank" rel="noreferrer" className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 block hover:opacity-80">
                  <img src={p.url} alt="" className="w-full h-36 object-cover" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Work Order Details Modal */}
      {selectedDetailsWo && (
        <WorkOrderDetailsModal
          workOrder={selectedDetailsWo}
          onClose={() => setSelectedDetailsWo(null)}
          crmServices={crmServices}
          crmTechnicians={crmTechnicians}
          handleUpdateWoStatus={handleUpdateWoStatus}
          handleAssignTechnician={handleAssignTechnician}
          backendUrl={backendUrl}
        />
      )}
    </div>
  );
}

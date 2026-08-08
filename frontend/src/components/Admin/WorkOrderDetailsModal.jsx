import React, { useState } from 'react';
import { X, User, Phone, Mail, MapPin, Calendar, Clock, DollarSign, FileText, Image, MessageSquare, Wrench, HardHat, CheckCircle2, AlertCircle, ShieldCheck, Tag, ExternalLink, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function WorkOrderDetailsModal({
  workOrder,
  onClose,
  crmServices = [],
  crmTechnicians = [],
  handleUpdateWoStatus,
  handleAssignTechnician,
  backendUrl
}) {
  if (!workOrder) return null;

  const [selectedTechnician, setSelectedTechnician] = useState(workOrder.technician_id || '');
  const [assigning, setAssigning] = useState(false);

  const quotation = workOrder.quotation || {};
  const customer = workOrder.customer || {};

  const serviceSlug = quotation.service_type || workOrder.service_type;
  const serviceObj = crmServices.find(s => s.slug === serviceSlug || s.id === serviceSlug || String(s.id) === String(serviceSlug));
  const serviceName = serviceObj?.name || (
    serviceSlug === 'tv-mount' ? 'TV Montajı & Askı' :
    serviceSlug === 'paint' ? 'İç Cephe Boyama' :
    serviceSlug === 'plumbing' ? 'Sıhhi Tesisat' :
    serviceSlug === 'electric' ? 'Elektrik İşleri' :
    serviceSlug === 'chandelier' ? 'Avize Montajı' : (serviceSlug || 'Genel Hizmet')
  );

  const details = quotation.details || {};
  const priceDetails = quotation.price_details || {};
  const photos = workOrder.photos || quotation.photos || details.uploadedPhotos || [];
  const preferredDate = workOrder.preferred_date || quotation.preferred_date;
  const timeSlot = workOrder.time_slot || quotation.time_slot;

  const phoneClean = customer.phone?.replace(/\D/g, '') || '';
  const totalAmount = priceDetails.total || quotation.total_amount || 0;
  const depositAmount = priceDetails.deposit_amount || (parseFloat(totalAmount) * 0.20).toFixed(2);

  const handleAssign = async () => {
    if (!selectedTechnician) return;
    setAssigning(true);
    try {
      if (handleAssignTechnician) {
        await handleAssignTechnician(workOrder.id, selectedTechnician, workOrder.scheduled_at);
      }
      toast.success('Usta başarıyla atandı.');
    } catch (err) {
      toast.error('Usta atanırken hata oluştu.');
    } finally {
      setAssigning(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'deposit_pending': return { text: 'Havale Bekliyor', bg: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
      case 'deposit_declared': return { text: 'Müşteri Havale Bildirdi!', bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' };
      case 'deposit_paid': return { text: 'Havale Onaylandı', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
      case 'scheduled': return { text: 'Usta Atandı', bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' };
      case 'in_progress': return { text: 'Saha İşleminde', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20' };
      case 'completed': return { text: 'Tamamlandı', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
      case 'cancelled': return { text: 'İptal Edildi', bg: 'bg-red-500/10 text-red-400 border-red-500/20' };
      default: return { text: status, bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
    }
  };

  const statusInfo = getStatusBadge(workOrder.status);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-800 rounded-3xl max-w-3xl w-full p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in duration-200 my-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-gray-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-primary-500 bg-primary-50 dark:bg-primary-950/40 px-2.5 py-1 rounded-lg border border-primary-500/20">
                #WO-{workOrder.id}
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-white px-3 py-1 rounded-lg bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-blue-500" />
                {serviceName}
              </span>
              <span className={`text-xs font-bold px-3 py-1 rounded-lg border ${statusInfo.bg}`}>
                {statusInfo.text}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Oluşturulma: {new Date(workOrder.created_at).toLocaleString('tr-TR')}
            </p>
          </div>

          <button 
            type="button" 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sol Kolon: Müşteri & Adres & Randevu */}
          <div className="space-y-4">
            {/* Customer Details */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-gray-900/60 border border-slate-200 dark:border-gray-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-500" />
                Müşteri & İletişim Bilgileri
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-gray-400">Ad Soyad:</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{customer.name || 'İsimsiz Müşteri'}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-gray-400">Telefon:</span>
                  <div className="flex items-center gap-2">
                    <a 
                      href={`tel:${phoneClean}`}
                      className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      {customer.phone}
                    </a>
                    <a
                      href={`https://wa.me/${phoneClean.startsWith('0') ? '9' + phoneClean : phoneClean}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 rounded bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition"
                      title="WhatsApp Mesaj Gönder"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {customer.email && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-gray-400">E-posta:</span>
                    <span className="font-medium text-slate-700 dark:text-gray-300">{customer.email}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200 dark:border-gray-800/60 space-y-1">
                  <span className="text-slate-500 dark:text-gray-400 block font-semibold flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-red-400" />
                    Hizmet Adresi:
                  </span>
                  <p className="font-medium text-slate-800 dark:text-gray-200 bg-white dark:bg-gray-950 p-2.5 rounded-xl border border-slate-200 dark:border-gray-800">
                    {workOrder.customer_address || customer.address || 'Adres Girilmemiş'}
                  </p>
                </div>
              </div>
            </div>

            {/* Appointment & Date Slot */}
            {(preferredDate || timeSlot) && (
              <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-500/20 space-y-2">
                <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  Tercih Edilen Randevu Zamanı
                </h4>
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>📅 {preferredDate ? new Date(preferredDate).toLocaleDateString('tr-TR') : 'Tarih Belirtilmedi'}</span>
                  {timeSlot && <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-md font-mono">{timeSlot}</span>}
                </div>
              </div>
            )}
          </div>

          {/* Sağ Kolon: Soru Cevaplar & Fiyat Dökümü & Ustalar */}
          <div className="space-y-4">
            {/* Answered Questions Breakdown */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-gray-900/60 border border-slate-200 dark:border-gray-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-purple-500" />
                Müşterinin Seçtiği Detaylar
              </h4>

              <div className="space-y-1.5 text-xs max-h-40 overflow-y-auto pr-1">
                {priceDetails.items && priceDetails.items.length > 0 ? (
                  priceDetails.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between py-1 border-b border-slate-200 dark:border-gray-800/40 text-slate-700 dark:text-gray-300">
                      <span>{item.description}</span>
                      <span className="font-bold text-slate-900 dark:text-white">₺{item.price}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 italic">Form detayları otomatik hesaplandı.</p>
                )}
              </div>

              {/* Price Summary */}
              <div className="pt-2 border-t border-slate-200 dark:border-gray-800 space-y-1 text-xs">
                <div className="flex justify-between text-slate-500 dark:text-gray-400">
                  <span>Toplam Hizmet Bedeli:</span>
                  <span className="font-bold text-slate-900 dark:text-white">₺{totalAmount} TL</span>
                </div>
                <div className="flex justify-between text-green-600 dark:text-green-400 font-bold">
                  <span>Ödenecek Kapora (%20):</span>
                  <span>₺{depositAmount} TL</span>
                </div>
              </div>
            </div>

            {/* Technician Assignment Box */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-gray-900/60 border border-slate-200 dark:border-gray-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <HardHat className="w-4 h-4 text-amber-500" />
                Atanan Saha Ustası
              </h4>

              <div className="flex items-center gap-2">
                <select
                  value={selectedTechnician}
                  onChange={(e) => setSelectedTechnician(e.target.value)}
                  className="flex-1 bg-white dark:bg-gray-950 border border-slate-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- Usta Seçilmedi --</option>
                  {crmTechnicians.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.username})</option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleAssign}
                  disabled={assigning || !selectedTechnician}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition disabled:opacity-50"
                >
                  {assigning ? '...' : 'Atamayı Kaydet'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Uploaded Customer Photos Gallery */}
        {photos && photos.length > 0 && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-gray-900/60 border border-slate-200 dark:border-gray-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Image className="w-4 h-4 text-emerald-500" />
              📸 Müşterinin Yüklediği Çalışma Alanı / Arıza Fotoğrafları ({photos.length})
            </h4>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {photos.map((photoUrl, idx) => (
                <a
                  key={idx}
                  href={photoUrl.startsWith('data:') ? photoUrl : `${backendUrl}/${photoUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-gray-800 bg-black/40 hover:opacity-90 transition shadow-sm"
                >
                  <img src={photoUrl.startsWith('data:') ? photoUrl : `${backendUrl}/${photoUrl}`} alt={`Görsel ${idx + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <ExternalLink className="w-4 h-4 text-white" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Status Change Bar & Downloads */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-slate-200 dark:border-gray-800">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-500 dark:text-gray-400">Durumu Değiştir:</span>
            <select
              value={workOrder.status}
              onChange={(e) => handleUpdateWoStatus && handleUpdateWoStatus(workOrder.id, e.target.value)}
              className="bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            >
              <option value="pending">Beklemede</option>
              <option value="deposit_pending">Havale Bekliyor</option>
              <option value="deposit_declared">Müşteri Havale Bildirdi!</option>
              <option value="deposit_paid">Havale Onaylandı</option>
              <option value="scheduled">Usta Atandı</option>
              <option value="in_progress">Saha İşleminde</option>
              <option value="completed">Tamamlandı</option>
              <option value="cancelled">İptal Edildi</option>
            </select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <a
              href={`${backendUrl}/api/admin/work-orders/${workOrder.id}/pdf?token=${sessionStorage.getItem('adminToken') || ''}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-blue-500" />
              İş Emri PDF İndir / Aç
            </a>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

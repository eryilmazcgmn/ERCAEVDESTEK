import React from 'react';
import { ExternalLink, UserCheck, ArrowRight, Download } from 'lucide-react';

export default function QuotationsTab({ crmQuotations = [], crmServices = [], backendUrl, setActiveAdminTab, handleNavigateToWorkOrder }) {
  const getServiceTitle = (q) => {
    if (q.service_name) return q.service_name;
    const match = crmServices?.find(s => s.slug === q.service_type || s.id === q.service_type);
    if (match) return match.name;
    if (q.service_type === 'tv-mount') return 'TV Montajı';
    if (q.service_type === 'paint') return 'Boyama';
    if (q.service_type === 'plumbing') return 'Sıhhi Tesisat';
    if (q.service_type === 'electric') return 'Elektrik';
    return q.service_type;
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-gray-800/80 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Tüm Teklif Raporları</h2>
          <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
            Müşterilerin oluşturduğu tekliflerin ayrıntılarını görebilir ve tek tıkla iş emrine geçip usta atayabilirsiniz.
          </p>
        </div>
        <span className="text-xs text-primary-400 font-semibold px-3 py-1 rounded-full bg-primary-950/40 border border-primary-500/20">
          Toplam: {crmQuotations.length} Teklif
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-500 dark:text-gray-400">
          <thead>
            <tr className="border-b border-slate-200 dark:border-gray-800 text-slate-800 dark:text-gray-200">
              <th className="py-3 px-4 whitespace-nowrap">Teklif No</th>
              <th className="py-3 px-4 min-w-[150px]">Müşteri Bilgileri</th>
              <th className="py-3 px-4 whitespace-nowrap">Hizmet Türü</th>
              <th className="py-3 px-4 whitespace-nowrap">Toplam Tutar</th>
              <th className="py-3 px-4 whitespace-nowrap">Teklif Durumu</th>
              <th className="py-3 px-4 whitespace-nowrap">Oluşturulma Tarihi</th>
              <th className="py-3 px-4 min-w-[180px]">Eylem / İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {crmQuotations.map((q, i) => (
              <tr key={i} className="border-b border-slate-200 dark:border-gray-800/50 hover:bg-slate-50 dark:hover:bg-gray-900/20">
                <td className="py-3 px-4 font-mono text-xs text-primary-400 font-bold">#TK-{q.id}</td>
                <td className="py-3 px-4">
                  <div className="font-bold text-slate-900 dark:text-white">{q.customer?.name || 'Müşteri'}</div>
                  <div className="text-xs text-slate-500 dark:text-gray-400">{q.customer?.phone || '-'}</div>
                </td>
                <td className="py-3 px-4 text-xs font-semibold text-primary-300">
                  {getServiceTitle(q)}
                </td>
                <td className="py-3 px-4 text-emerald-400 font-bold">{Number(q.price_details?.total || 0).toLocaleString('tr-TR')} TL</td>
                <td className="py-3 px-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    q.status === 'approved' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20' : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/20'
                  }`}>
                    {q.status === 'approved' ? 'Onaylandı (Sipariş)' : 'Beklemede'}
                  </span>
                </td>
                <td className="py-3 px-4 text-xs">{new Date(q.created_at).toLocaleDateString('tr-TR')}</td>
                <td className="py-3 px-4 flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleNavigateToWorkOrder ? handleNavigateToWorkOrder(q.id) : (setActiveAdminTab && setActiveAdminTab('work-orders'))}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-500 hover:to-blue-500 text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow-md"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    İş Emrine Git & Usta Ata
                  </button>

                  <a 
                    href={`${backendUrl}/api/admin/quotations/${q.id}/pdf?token=${sessionStorage.getItem('adminToken') || ''}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 text-[10px] text-slate-700 dark:text-gray-300 hover:bg-slate-200 dark:hover:bg-gray-800 text-center flex items-center justify-center transition gap-1 cursor-pointer"
                    title="Teklif PDF İndir"
                  >
                    Teklif PDF <Download className="w-3 h-3 text-emerald-500" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

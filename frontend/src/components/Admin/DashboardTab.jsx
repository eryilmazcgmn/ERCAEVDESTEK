import React from 'react';
import { 
  Users, 
  DollarSign, 
  Briefcase, 
  ArrowRight, 
  ChevronRight,
  UserCheck,
  Zap,
  TrendingUp,
  PieChart as PieChartIcon
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#a855f7', '#3b82f6', '#ef4444', '#eab308', '#10b981'];

export default function DashboardTab({
  crmStats,
  crmQuotations = [],
  crmWorkOrders = [],
  backendUrl,
  setActiveAdminTab,
  handleUpdateWoStatus
}) {
  // Action Required Orders
  const actionRequiredOrders = crmWorkOrders.filter(wo => 
    wo.status === 'deposit_pending' || 
    wo.status === 'deposit_declared' || 
    wo.status === 'deposit_paid' || 
    (!wo.technician_name && wo.status !== 'completed' && wo.status !== 'cancelled')
  );

  const getStatusLabel = (status) => {
    switch (status) {
      case 'deposit_pending': return { text: 'Havale Bekliyor', style: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/30' };
      case 'deposit_declared': return { text: 'Müşteri Havale Bildirdi!', style: 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400 border-cyan-300 dark:border-cyan-500/30 animate-pulse' };
      case 'deposit_paid': return { text: 'Havale Onaylandı (Usta Bekliyor)', style: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-500/30' };
      case 'pending': return { text: 'Beklemede', style: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-gray-400 border-slate-300 dark:border-gray-700' };
      case 'scheduled': return { text: 'Usta Atandı', style: 'bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-400 border-primary-300 dark:border-primary-500/30' };
      case 'active': return { text: 'Aktif İş', style: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border-indigo-300 dark:border-indigo-500/30' };
      case 'completed': return { text: 'Tamamlandı', style: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30' };
      case 'cancelled': return { text: 'İptal Edildi', style: 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border-red-300 dark:border-red-500/30' };
      default: return { text: status, style: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-gray-300' };
    }
  };

  // Format daily revenue data for Recharts
  const revenueChartData = crmStats?.daily_revenue
    ? Object.entries(crmStats.daily_revenue).map(([date, total]) => ({
        date: date.slice(5), // 'MM-DD'
        amount: total
      }))
    : [];

  // Format service distribution for PieChart
  const servicePieData = crmStats?.service_distribution
    ? Object.entries(crmStats.service_distribution).map(([service, count]) => {
        const labels = {
          'tv-mount': 'TV Montajı',
          'paint': 'Boyama',
          'plumbing': 'Sıhhi Tesisat',
          'electric': 'Elektrik'
        };
        return { name: labels[service] || service, value: count };
      })
    : [];

  return (
    <div className="space-y-8 font-sans">
      {/* 1. Action Alert Banner */}
      {actionRequiredOrders.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-slate-900 dark:text-white">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" />
              <h2 className="text-base font-bold tracking-tight">Eylem Bekleyen Siparişler ({actionRequiredOrders.length})</h2>
            </div>
            <button
              onClick={() => setActiveAdminTab('work-orders')}
              className="text-xs text-primary-400 font-bold hover:underline flex items-center gap-1"
            >
              İş Emirleri Sekmesine Git <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {actionRequiredOrders.slice(0, 4).map((wo, i) => (
              <div 
                key={`action-${i}`} 
                className="glass-panel p-4 rounded-2xl border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-950/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:border-amber-400 dark:hover:border-amber-500/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 font-bold font-mono text-xs">
                    #WO-{wo.id}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{wo.customer?.name || 'Müşteri'}</h4>
                      <span className="text-xs text-slate-400">({wo.customer?.phone || '-'})</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                      Adres: <strong>{wo.customer?.address || 'Çankaya / Ankara'}</strong> — Durum: <span className="font-bold text-amber-600 dark:text-amber-400">{getStatusLabel(wo.status).text}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
                  {(wo.status === 'deposit_pending' || wo.status === 'deposit_declared') && (
                    <button
                      onClick={() => handleUpdateWoStatus(wo.id, 'deposit_paid')}
                      className="flex-1 md:flex-initial px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-md transition"
                    >
                      Ödemeyi Onayla
                    </button>
                  )}

                  <button
                    onClick={() => setActiveAdminTab('work-orders')}
                    className="flex-1 md:flex-initial px-4 py-2 rounded-xl bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-500 hover:to-blue-500 text-xs font-bold text-white shadow-md transition flex items-center justify-center gap-1.5"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Tek Tıkla Usta Ata
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Interactive Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { 
            label: 'Toplam Müşteri', 
            value: crmStats?.total_customers ?? 0, 
            icon: Users, 
            color: 'from-blue-600 to-cyan-500',
            tab: 'customers',
            hint: 'Müşterileri Listele'
          },
          { 
            label: 'Oluşturulan Teklif', 
            value: crmStats?.total_quotations ?? 0, 
            icon: DollarSign, 
            color: 'from-primary-600 to-pink-500',
            tab: 'quotations',
            hint: 'Teklifleri Yönet'
          },
          { 
            label: 'Aktif / Bekleyen İş Emri', 
            value: crmWorkOrders.filter(wo => wo.status !== 'completed' && wo.status !== 'cancelled').length, 
            icon: Briefcase, 
            color: 'from-amber-600 to-yellow-500',
            tab: 'work-orders',
            hint: 'İş Emirlerini Görüntüle'
          },
          { 
            label: 'Toplam Gelir (Onaylı)', 
            value: `${crmStats?.total_revenue ? Number(crmStats.total_revenue).toLocaleString('tr-TR') : 0} TL`, 
            icon: DollarSign, 
            color: 'from-emerald-600 to-green-500',
            tab: 'quotations',
            hint: 'Gelir Raporu'
          }
        ].map((card, i) => {
          const IconComp = card.icon;
          return (
            <div 
              key={i} 
              onClick={() => setActiveAdminTab(card.tab)}
              className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-gray-800/80 relative overflow-hidden flex items-center justify-between cursor-pointer hover:border-blue-500/40 hover:bg-slate-100 dark:hover:bg-gray-800/10 group transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <div className="space-y-1">
                <span className="text-xs text-slate-500 dark:text-gray-400 font-semibold block">{card.label}</span>
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white block">{card.value}</span>
                <span className="text-[10px] text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mt-1">
                  {card.hint} <ChevronRight className="w-3 h-3" />
                </span>
              </div>
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${card.color} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200`}>
                <IconComp className="w-6 h-6 text-white" />
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Recharts Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Revenue Area Chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-200 dark:border-gray-800/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Son 30 Günlük Gelir Trendi (TL)
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold">Canlı Veri</span>
          </div>

          <div className="h-64 w-full">
            {revenueChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#090a0f', borderColor: '#1f2937', borderRadius: '0.75rem', fontSize: '12px', color: '#fff' }}
                    formatter={(value) => [`${Number(value).toLocaleString('tr-TR')} TL`, 'Gelir']}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#revenueGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Gelir verisi henüz oluşmadı.
              </div>
            )}
          </div>
        </div>

        {/* Service Type Distribution Pie Chart */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-gray-800/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 pb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-primary-400" />
              Hizmet Dağılımı
            </h3>
          </div>

          <div className="h-64 w-full">
            {servicePieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={servicePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {servicePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#090a0f', borderColor: '#1f2937', borderRadius: '0.75rem', fontSize: '12px', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Hizmet verisi henüz bulunmuyor.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Detailed Data Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Recent quotations */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-gray-800/80 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Son Teklif İstekleri</h3>
              <button 
                onClick={() => setActiveAdminTab('quotations')}
                className="text-[10px] text-blue-400 font-semibold hover:underline flex items-center gap-1"
              >
                Tümünü Gör <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            
            <div className="space-y-3 overflow-y-auto max-h-[350px] pr-1">
              {crmQuotations.length > 0 ? (
                crmQuotations.slice(0, 5).map((q, i) => (
                  <div 
                    key={i} 
                    onClick={() => setActiveAdminTab('quotations')}
                    className="p-3 bg-slate-50 dark:bg-gray-900/40 border border-slate-200 dark:border-gray-800/50 rounded-xl flex items-center justify-between cursor-pointer hover:border-slate-300 dark:hover:border-gray-700 hover:bg-slate-100 dark:hover:bg-gray-800/20 transition-all group"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block group-hover:text-blue-400 transition-colors">
                        {q.customer?.name}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-gray-500">
                        {q.service_type === 'tv-mount' ? 'TV Montajı' : 
                         q.service_type === 'paint' ? 'Boyama' : 
                         q.service_type === 'plumbing' ? 'Sıhhi Tesisat' : 'Elektrik'}
                      </span>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <span className="text-xs font-bold text-emerald-400">
                        {Number(q.price_details?.total || 0).toLocaleString('tr-TR')} TL
                      </span>
                      {q.pdf_path && (
                        <a 
                          href={`${backendUrl}/${q.pdf_path}`} 
                          onClick={(e) => e.stopPropagation()} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-[9px] text-blue-400 hover:underline"
                        >
                          PDF İndir
                        </a>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-gray-500">
                  Henüz oluşturulmuş teklif bulunmuyor.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent work orders */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-gray-800/80 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-gray-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">İş Emirleri Durumu</h3>
              <button 
                onClick={() => setActiveAdminTab('work-orders')}
                className="text-[10px] text-blue-400 font-semibold hover:underline flex items-center gap-1"
              >
                Tümünü Gör <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            
            <div className="space-y-3 overflow-y-auto max-h-[350px] pr-1">
              {crmWorkOrders.length > 0 ? (
                crmWorkOrders.slice(0, 5).map((wo, i) => {
                  const badge = getStatusLabel(wo.status);
                  return (
                    <div 
                      key={i} 
                      onClick={() => setActiveAdminTab('work-orders')}
                      className="p-3 bg-slate-50 dark:bg-gray-900/40 border border-slate-200 dark:border-gray-800/50 rounded-xl flex items-center justify-between cursor-pointer hover:border-slate-300 dark:hover:border-gray-700 hover:bg-slate-100 dark:hover:bg-gray-800/20 transition-all group"
                    >
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block group-hover:text-blue-400 transition-colors">
                          {wo.customer?.name} (#WO-{wo.id})
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-gray-400">
                          Teknisyen: {wo.technician_name || 'Atanmadı'}
                        </span>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1.5">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full border ${badge.style} font-bold`}>
                          {badge.text}
                        </span>
                        {wo.pdf_path && (
                          <a 
                            href={`${backendUrl}/${wo.pdf_path}`} 
                            onClick={(e) => e.stopPropagation()} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-[9px] text-blue-400 hover:underline"
                          >
                            İş Emri PDF
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-gray-500">
                  Henüz oluşturulmuş iş emri bulunmuyor.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { 
  LayoutDashboard, 
  Users, 
  DollarSign, 
  Briefcase, 
  LogOut,
  Settings,
  Eye,
  HardHat,
  Layers
} from 'lucide-react';

export default function AdminSidebar({
  activeAdminTab,
  setActiveAdminTab,
  isSidebarOpen,
  setIsAdminMode,
  handleAdminLogout
}) {
  return (
    <aside className={`glass-panel border-b md:border-b-0 md:border-r border-slate-200 dark:border-gray-800 transition-all duration-300 w-full ${isSidebarOpen ? 'md:w-64' : 'md:w-20'} flex flex-col md:flex-col z-30 shrink-0`}>
      {/* Top Header Row (Logo + Mobile Action Buttons) */}
      <div className="p-4 md:p-5 flex items-center justify-between border-b border-slate-200 dark:border-gray-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-900/30">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          {isSidebarOpen && (
            <div>
              <span className="font-bold tracking-tight text-slate-900 dark:text-white block text-sm">CRM ADMİN</span>
              <span className="text-[10px] text-blue-400 font-medium tracking-widest uppercase">YÖNETİM PANELİ</span>
            </div>
          )}
        </div>

        {/* Mobile Quick Action Buttons (hidden on desktop) */}
        <div className="flex md:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAdminMode(false)}
            className="p-2 rounded-xl bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white transition"
            title="Müşteri Görünümü"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleAdminLogout}
            className="p-2 rounded-xl bg-red-950/20 border border-red-500/20 text-red-400 hover:bg-red-950/40 transition"
            title="Güvenli Çıkış"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
      <nav className="flex flex-row md:flex-col p-2 md:p-4 space-x-2 md:space-x-0 md:space-y-1 overflow-x-auto md:overflow-visible shrink-0 md:shrink scrollbar-none">
        {[
          { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
          { id: 'customers', name: 'Müşteriler', icon: Users },
          { id: 'technicians', name: 'Ustalar', icon: HardHat },
          { id: 'quotations', name: 'Teklifler', icon: DollarSign },
          { id: 'work-orders', name: 'İş Emirleri', icon: Briefcase },
          { id: 'services', name: 'Hizmetler', icon: Layers },
          { id: 'pricing', name: 'Fiyat Yönetimi', icon: DollarSign },
          { id: 'settings', name: 'Genel Ayarlar', icon: Settings }
        ].map(tab => {
          const IconComp = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveAdminTab(tab.id)}
              className={`whitespace-nowrap flex items-center gap-2 md:gap-3 px-3 py-2 md:px-4 md:py-3 rounded-xl transition-all duration-200 ${
                activeAdminTab === tab.id 
                  ? 'bg-blue-100 dark:bg-gradient-to-r dark:from-blue-900/40 dark:to-indigo-900/20 border border-blue-300 dark:border-blue-500/30 text-blue-700 dark:text-white' 
                  : 'text-slate-500 dark:text-gray-400 hover:bg-slate-100/50 dark:hover:bg-gray-800/40 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <IconComp className="w-5 h-5" />
              {isSidebarOpen && <span className="font-medium text-sm">{tab.name}</span>}
            </button>
          );
        })}
      </nav>

      {/* Desktop Footer (hidden on mobile) */}
      <div className="hidden md:flex p-4 border-t border-slate-200 dark:border-gray-800 space-y-2 flex-col shrink-0">
        <button 
          type="button"
          onClick={() => setIsAdminMode(false)}
          className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 text-xs font-semibold text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800 transition flex items-center justify-center gap-2"
        >
          Müşteri Görünümü
        </button>
        <button 
          type="button"
          onClick={handleAdminLogout}
          className="w-full py-2.5 rounded-xl bg-red-950/20 border border-red-500/20 text-xs font-semibold text-red-400 hover:bg-red-950/40 transition flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          {isSidebarOpen && <span>Güvenli Çıkış</span>}
        </button>
      </div>
    </aside>
  );
}

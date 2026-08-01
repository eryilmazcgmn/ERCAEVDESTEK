import React from 'react';
import { 
  Wrench, 
  FileText, 
  UploadCloud, 
  MapPin, 
  CreditCard, 
  Lock 
} from 'lucide-react';

export default function CustomerSidebar({
  activeStep,
  setActiveStep,
  selectedService,
  isSidebarOpen,
  setShowLoginModal
}) {
  return (
    <aside className={`glass-panel border-b md:border-b-0 md:border-r border-slate-200 dark:border-gray-800 transition-all duration-300 w-full ${isSidebarOpen ? 'md:w-64' : 'md:w-20'} hidden md:flex flex-row md:flex-col z-30 overflow-x-auto md:overflow-visible`}>
      <div className="p-3 md:p-5 flex items-center justify-between border-r md:border-r-0 md:border-b border-slate-200 dark:border-gray-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-blue-500 flex items-center justify-center shadow-lg shadow-primary-900/30">
            <Wrench className="w-6 h-6 text-white" />
          </div>
          {isSidebarOpen && (
            <div>
              <span className="font-bold tracking-tight text-slate-900 dark:text-white block text-sm">ERCA EV DESTEK</span>
              <span className="text-[10px] text-primary-400 font-medium tracking-widest uppercase">HIZLI SERVİS DESTEK</span>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 flex flex-row md:flex-col px-3 py-2 md:py-4 space-x-2 md:space-x-0 md:space-y-1 overflow-x-auto shrink-0 md:shrink">
        {[
          { num: 1, name: '1. Hizmet Seçimi', icon: Wrench },
          { num: 2, name: '2. Hizmet Detayları', icon: FileText },
          { num: 3, name: '3. Fotoğraf Yükleme', icon: UploadCloud },
          { num: 4, name: '4. İletişim & Adres', icon: MapPin },
          { num: 5, name: '5. Teklif & Kapora (EFT)', icon: CreditCard }
        ].map(step => {
          const IconComp = step.icon;
          const isActive = activeStep === step.num;
          const isEnabled = step.num === 1 || selectedService;
          return (
            <button 
              key={step.num}
              onClick={() => setActiveStep(step.num)}
              disabled={!isEnabled}
              className={`whitespace-nowrap w-auto md:w-full flex items-center gap-2 md:gap-3 px-3 py-2 md:px-4 md:py-3 rounded-xl transition-all duration-200 ${!isEnabled ? 'opacity-50 cursor-not-allowed' : ''} ${isActive ? 'bg-primary-100 dark:bg-gradient-to-r dark:from-primary-900/40 dark:to-blue-900/20 border border-primary-300 dark:border-primary-500/30 text-primary-700 dark:text-white' : 'text-slate-500 dark:text-gray-400 hover:bg-slate-100/50 dark:hover:bg-gray-800/40 hover:text-slate-900 dark:hover:text-white'}`}
            >
              <IconComp className="w-5 h-5" />
              {isSidebarOpen && <span className="font-medium text-sm">{step.name}</span>}
            </button>
          );
        })}
      </nav>

      <div className="p-3 md:p-4 border-l md:border-l-0 md:border-t border-slate-200 dark:border-gray-800 shrink-0">
        <button 
          type="button"
          onClick={() => setShowLoginModal(true)}
          className="w-full flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-gray-900/50 hover:bg-slate-100 dark:hover:bg-gray-900 border border-slate-200 dark:border-gray-800 transition text-left"
        >
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-sm font-bold text-white">
            <Lock className="w-4 h-4" />
          </div>
          {isSidebarOpen && (
            <div className="flex-1 overflow-hidden">
              <span className="block text-xs font-semibold text-slate-900 dark:text-white truncate">Yönetici / Usta Girişi</span>
              <span className="text-[10px] text-slate-400 dark:text-gray-500 block truncate">CRM Paneli</span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}

import React from 'react';
import { Sparkles } from 'lucide-react';

export default function StepWelcome({
  services,
  selectedService,
  handleQuickServiceSelect
}) {
  return (
    <div className="flex-1 flex flex-col justify-center items-center h-full text-center">
      <div className="mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-900/30 border border-primary-500/30 mb-6">
          <Sparkles className="w-8 h-8 text-primary-400" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Ev Destek & Usta Çağrı Merkezi</h2>
        <p className="text-slate-500 dark:text-gray-400 max-w-md mx-auto text-sm leading-relaxed">
          1 Dakikada ihtiyacınızı seçin, net fiyat ve kapora tutarınızı öğrenin. Havale/EFT ile uzman ustanız adresinize gelsin!
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
        {services.map(srv => {
          const IconComp = srv.icon;
          return (
            <button
              key={srv.id}
              type="button"
              onClick={() => handleQuickServiceSelect(srv.id)}
              className={`glass-card p-6 rounded-2xl border flex items-center gap-4 transition-all group ${
                selectedService === srv.id 
                  ? 'border-primary-500/60 bg-primary-900/20 shadow-[0_0_20px_rgba(168,85,247,0.2)]' 
                  : 'border-slate-200 dark:border-gray-800 bg-slate-100 dark:bg-gray-900/40 hover:border-primary-500/40 hover:bg-slate-100 dark:hover:bg-gray-800/80'
              }`}
            >
              <div className={`p-3 rounded-xl bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 group-hover:scale-110 transition-transform ${srv.color}`}>
                <IconComp className="w-6 h-6" />
              </div>
              <div className="text-left">
                <span className="block text-base font-bold text-slate-800 dark:text-gray-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{srv.name}</span>
                <span className="block text-xs text-slate-400 dark:text-gray-500 mt-1">Detaylar için tıklayın</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

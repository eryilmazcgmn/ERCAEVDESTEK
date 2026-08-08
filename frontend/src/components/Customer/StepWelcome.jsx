import React from 'react';
import { Shield, Zap, Star, Clock, ChevronRight } from 'lucide-react';

const trustBadges = [
  { icon: Star, label: '4.9 Müşteri Puanı', color: 'text-yellow-500' },
  { icon: Shield, label: 'Garantili Hizmet', color: 'text-green-500' },
  { icon: Zap, label: 'Anında Fiyat', color: 'text-blue-500' },
  { icon: Clock, label: 'Aynı Gün Servis', color: 'text-primary-500' },
];

export default function StepWelcome({
  services,
  selectedService,
  handleQuickServiceSelect,
  settings,
  backendUrl
}) {
  return (
    <div className="flex flex-col">
      {/* ─── Hero Section ─── */}
      <div className="hero-gradient relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary-500/10 blur-[100px] animate-pulse-slow"></div>
          <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-blue-500/10 blur-[80px] animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-pink-500/5 blur-[60px]"></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-8 py-10 md:py-20 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-100/80 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-500/20 text-primary-700 dark:text-primary-300 text-xs font-bold mb-5 animate-fade-in-up">
            <Zap className="w-3.5 h-3.5" />
            {settings?.company_address || 'Ankara — Çankaya'} Bölgesi Hizmet Ağı
          </div>

          {/* Main Heading */}
          <h2 className="text-2xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-3 leading-tight animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Evinizin ihtiyacını seçin,
            <br />
            <span className="gradient-text">anında fiyat alın.</span>
          </h2>

          {/* Subtitle */}
          <p className="text-sm md:text-lg text-slate-500 dark:text-gray-400 max-w-xl mx-auto mb-8 leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Birkaç soruya cevap verin, saniyeler içinde net fiyat teklifinizi görün.
            Kaporanızı yatırın, uzman ustamız kapınıza gelsin!
          </p>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 mb-8 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            {trustBadges.map((badge, i) => {
              const IconComp = badge.icon;
              return (
                <div key={i} className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-gray-400">
                  <IconComp className={`w-4 h-4 ${badge.color}`} />
                  {badge.label}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Service Cards ─── */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 -mt-2 md:-mt-8 relative z-20 pb-12 w-full">
        {/* Mobile: 2-column compact grid | Desktop: 2-column detailed cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {services.map((srv, index) => {
            const IconComp = srv.icon;
            const isSelected = selectedService === srv.id;
            return (
              <button
                key={srv.id}
                type="button"
                onClick={() => handleQuickServiceSelect(srv.id)}
                className={`service-card group relative rounded-2xl border flex flex-col items-center text-center p-4 md:p-6 md:flex-row md:items-center md:text-left md:gap-4 transition-all animate-fade-in-up ${
                  isSelected
                    ? 'border-primary-500/60 bg-primary-50 dark:bg-primary-900/20 shadow-lg shadow-primary-500/10'
                    : 'border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 hover:border-primary-400/50 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-none'
                }`}
                style={{ animationDelay: `${0.35 + index * 0.06}s` }}
              >
                {/* Icon — centered on mobile, left-aligned on desktop */}
                <div className={`p-3 md:p-3 rounded-xl border transition-all mb-2 md:mb-0 ${
                  isSelected
                    ? 'bg-primary-100 dark:bg-primary-900/40 border-primary-200 dark:border-primary-500/30'
                    : 'bg-slate-50 dark:bg-gray-800 border-slate-200 dark:border-gray-700 group-hover:scale-110 group-hover:border-primary-300 dark:group-hover:border-primary-600'
                } ${srv.color}`}>
                  <IconComp className="w-6 h-6 md:w-6 md:h-6" />
                </div>

                {/* Service name + price badge */}
                <div className="flex-1 min-w-0">
                  <span className="block text-xs md:text-base font-bold text-slate-800 dark:text-gray-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors leading-tight">
                    {srv.name}
                  </span>
                  {/* Description — hidden on mobile, shown on desktop */}
                  <span className="hidden md:block text-xs text-slate-400 dark:text-gray-500 mt-0.5">{srv.desc}</span>
                  {/* Price badge — always visible */}
                  {srv.min_price > 0 && (
                    <span className="inline-block mt-1.5 text-[10px] md:text-[11px] font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-2 py-0.5 rounded-full border border-green-200 dark:border-green-500/20">
                      ₺{srv.min_price.toLocaleString('tr-TR')}'den
                    </span>
                  )}
                </div>

                {/* Arrow — hidden on mobile, visible on desktop */}
                <ChevronRight className={`hidden md:block w-5 h-5 flex-shrink-0 transition-all ${
                  isSelected
                    ? 'text-primary-500'
                    : 'text-slate-300 dark:text-gray-600 group-hover:text-primary-400 group-hover:translate-x-1'
                }`} />
              </button>
            );
          })}
        </div>

        {/* Bottom CTA helper */}
        <p className="text-center text-xs text-slate-400 dark:text-gray-500 mt-8">
          Hizmet kategorinizi seçerek başlayın — süreç sadece <strong className="text-primary-500">2 dakika</strong> sürer.
        </p>
      </div>
    </div>
  );
}

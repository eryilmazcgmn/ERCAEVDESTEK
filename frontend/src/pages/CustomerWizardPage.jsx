import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import {
  Wrench,
  FlameKindling,
  Droplet,
  Zap,
  Search,
  Phone,
  CheckCircle2,
  ChevronLeft,
  RotateCcw,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';

import { api } from '../services/api';
import { useSession } from '../hooks/useSession';
import { useSettings } from '../context/SettingsContext';

// Customer Components
import StepWelcome from '../components/Customer/StepWelcome';
import StepQuestions from '../components/Customer/StepQuestions';
import StepContact from '../components/Customer/StepContact';
import StepQuotation from '../components/Customer/StepQuotation';

// Fallback services if API fails
const fallbackServices = [
  { id: 'tv-mount', slug: 'tv-mount', name: 'TV Montajı & Askı', icon: 'Wrench', color: 'text-primary-400', description: 'Duvara profesyonel TV montajı', min_price: 750 },
  { id: 'paint', slug: 'paint', name: 'Boyama & Dekorasyon', icon: 'FlameKindling', color: 'text-yellow-400', description: 'İç cephe boya ve badana', min_price: 1500 },
  { id: 'plumbing', slug: 'plumbing', name: 'Sıhhi Tesisat', icon: 'Droplet', color: 'text-blue-400', description: 'Su tesisatı ve onarım', min_price: 600 },
  { id: 'electric', slug: 'electric', name: 'Elektrik İşleri', icon: 'Zap', color: 'text-red-400', description: 'Elektrik arıza ve montaj', min_price: 400 },
];

// Map icon name string to actual Lucide component
function resolveIcon(iconName) {
  return LucideIcons[iconName] || Wrench;
}

const stepsData = [
  { num: 1, title: 'Hizmet Seçimi' },
  { num: 2, title: 'Detaylar' },
  { num: 3, title: 'İletişim Bilgileri' },
  { num: 4, title: 'Teklif & Ödeme' },
];

export default function CustomerWizardPage() {
  const session = useSession();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);

  const backendUrl = api.getBackendUrl();
  const totalSteps = stepsData.length;
  const progress = (session.activeStep / totalSteps) * 100;

  // Phone number — prioritize contact_phone, fallback to company_phone
  const phoneNumber = settings?.contact_phone || settings?.company_phone || '';

  // Fetch services from API on mount
  useEffect(() => {
    api.fetchServices()
      .then(res => {
        const data = res?.data || [];
        if (data.length > 0) {
          setServices(data.map(s => ({
            ...s,
            id: s.slug || s.id,
            icon: resolveIcon(s.icon),
            desc: s.description,
          })));
        } else {
          setServices(fallbackServices.map(s => ({ ...s, icon: resolveIcon(s.icon), desc: s.description })));
        }
      })
      .catch(() => {
        setServices(fallbackServices.map(s => ({ ...s, icon: resolveIcon(s.icon), desc: s.description })));
      })
      .finally(() => setLoadingServices(false));
  }, []);

  // Loading state — session not ready yet but session was requested
  if (session.sessionRequested && !session.sessionStarted && !session.sessionError) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#090a0f] flex items-center justify-center p-6 text-slate-900 dark:text-gray-200">
        <div className="text-center space-y-4">
          <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 block mx-auto"></span>
          <p className="text-sm text-slate-500 dark:text-gray-400">Güvenli ev destek oturumu hazırlanıyor...</p>
        </div>
      </div>
    );
  }

  // Session error state
  if (session.sessionError) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#090a0f] flex items-center justify-center p-6 text-slate-900 dark:text-gray-200">
        <div className="text-center space-y-4">
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/50 p-4 rounded-xl max-w-sm mx-auto text-red-700 dark:text-red-200">
            <p className="font-semibold text-red-400 mb-2">Bağlantı Hatası</p>
            <p className="text-sm">{session.sessionError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm text-white font-medium"
            >
              Tekrar Dene
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col text-slate-900 dark:text-gray-200 bg-slate-50 dark:bg-[#090a0f]">
      <Toaster richColors position="top-right" />

      {/* ─── Minimal Header ─── */}
      <header className="h-16 border-b border-slate-200/80 dark:border-gray-800/80 flex items-center justify-between px-4 md:px-8 bg-white/70 dark:bg-gray-950/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="flex items-center gap-3">
          {/* Back button — visible when not on step 1 */}
          {session.activeStep > 1 && (
            <button
              type="button"
              onClick={() => session.setActiveStep(session.activeStep - 1)}
              className="p-2 -ml-2 rounded-xl text-slate-400 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800 transition"
              aria-label="Geri"
              title="Bir Önceki Adım"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div
            onClick={() => session.setActiveStep(1)}
            className="flex items-center gap-3 cursor-pointer group"
            title="Anasayfaya Dön / Hizmet Seçimi"
          >
            {settings?.logo_path && (
              <img src={`${backendUrl}/${settings.logo_path}`} alt="Logo" className="h-7 object-contain group-hover:scale-105 transition-transform" />
            )}
            <h1 className="text-base md:text-lg font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors">
              {settings?.company_name || 'ERCA Ev Destek'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/tracking')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-100 dark:hover:bg-gray-800 transition"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sipariş Takibi</span>
          </button>
          <a
            href={`tel:${phoneNumber}`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-xs font-bold text-white transition shadow-sm"
          >
            <Phone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bizi Arayın</span>
          </a>
        </div>
      </header>

      {/* ─── Progress Bar (visible after step 1) ─── */}
      {session.activeStep > 1 && (
        <div className="bg-white/50 dark:bg-gray-950/30 border-b border-slate-200/60 dark:border-gray-800/60 px-4 md:px-8 py-3">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {stepsData.map((step) => (
                  <div key={step.num} className="flex items-center gap-1.5">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      session.activeStep === step.num
                        ? 'bg-primary-600 text-white shadow-md shadow-primary-600/30 scale-110'
                        : session.activeStep > step.num
                        ? 'bg-green-500 text-white'
                        : 'bg-slate-200 dark:bg-gray-800 text-slate-400 dark:text-gray-500'
                    }`}>
                      {session.activeStep > step.num ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        step.num
                      )}
                    </div>
                    {step.num < totalSteps && (
                      <div className={`w-6 md:w-12 h-0.5 rounded-full transition-all ${
                        session.activeStep > step.num
                          ? 'bg-green-500'
                          : 'bg-slate-200 dark:bg-gray-800'
                      }`}></div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => session.setActiveStep(1)}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-100 dark:hover:bg-gray-800 px-2.5 py-1 rounded-lg transition"
                  title="Hizmet seçim sayfasına geri dön"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Hizmet Değiştir</span>
                </button>
                <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                  {session.activeStep}/{totalSteps}
                </span>
              </div>
            </div>
            <div className="w-full bg-slate-100 dark:bg-gray-900 rounded-full h-1 overflow-hidden">
              <div
                className="bg-gradient-to-r from-primary-500 to-blue-500 h-1 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Main Content ─── */}
      <main className="flex-1 flex flex-col">
        <div className={`flex-1 w-full mx-auto ${session.activeStep === 1 ? '' : 'max-w-3xl px-4 md:px-8 py-6 md:py-10'}`}>

          {session.activeStep === 1 && (
            <StepWelcome
              services={services}
              selectedService={session.selectedService}
              handleQuickServiceSelect={session.handleQuickServiceSelect}
              settings={settings}
              backendUrl={backendUrl}
            />
          )}

          {session.activeStep === 2 && (
            <div className="glass-panel rounded-3xl border border-slate-200 dark:border-gray-800/80 p-5 md:p-8 min-h-[420px] flex flex-col">
              <StepQuestions
                selectedService={session.selectedService}
                formAnswers={session.formAnswers}
                handleInputChange={session.handleInputChange}
                setActiveStep={session.setActiveStep}
              />
            </div>
          )}

          {session.activeStep === 3 && (
            <div className="glass-panel rounded-3xl border border-slate-200 dark:border-gray-800/80 p-5 md:p-8 min-h-[420px] flex flex-col">
              <StepContact
                customerName={session.customerName}
                setCustomerName={session.setCustomerName}
                customerPhone={session.customerPhone}
                setCustomerPhone={session.setCustomerPhone}
                customerEmail={session.customerEmail}
                setCustomerEmail={session.setCustomerEmail}
                customerAddress={session.customerAddress}
                setCustomerAddress={session.setCustomerAddress}
                handleUpdateContactAndGetQuote={session.handleUpdateContactAndGetQuote}
                submittingContact={session.submittingContact}
                submittingQuotation={session.submittingQuotation}
                setActiveStep={session.setActiveStep}
                uploadedPhotos={session.uploadedPhotos}
                analyzing={session.analyzing}
                handlePhotoUpload={session.handlePhotoUpload}
                removePhoto={session.removePhoto}
              />
            </div>
          )}

          {session.activeStep === 4 && (
            <div className="glass-panel rounded-3xl border border-slate-200 dark:border-gray-800/80 p-5 md:p-8 min-h-[420px] flex flex-col">
              <StepQuotation
                sessionId={session.sessionId}
                selectedService={session.selectedService}
                services={services}
                compiledQuotation={session.compiledQuotation}
                compiledWorkOrder={session.compiledWorkOrder}
                setActiveStep={session.setActiveStep}
                handleDeclareDeposit={session.handleDeclareDeposit}
                depositDeclared={session.depositDeclared}
                declaringDeposit={session.declaringDeposit}
                handleApproveQuotation={session.handleApproveQuotation}
                approvingQuotation={session.approvingQuotation}
                backendUrl={backendUrl}
              />
            </div>
          )}
        </div>
      </main>

      {/* ─── Minimal Footer ─── */}
      <footer className="border-t border-slate-200/60 dark:border-gray-800/60 py-4 px-4 md:px-8 bg-white/40 dark:bg-gray-950/30 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 dark:text-gray-500">
          <span>© {new Date().getFullYear()} {settings?.company_name || 'ERCA Ev Destek'} — Tüm hakları saklıdır.</span>
          <span>{settings?.company_address || 'Ankara — Çankaya'}</span>
        </div>
      </footer>
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import {
  Wrench,
  FlameKindling,
  Droplet,
  Zap,
  Search,
  MapPin,
  Sun,
  Moon,
  LayoutDashboard
} from 'lucide-react';

import { api } from '../services/api';
import { useSession } from '../hooks/useSession';
import { useTheme } from '../hooks/useTheme';
import { useSettings } from '../context/SettingsContext';

// Customer Components
import CustomerSidebar from '../components/Customer/CustomerSidebar';
import StepWelcome from '../components/Customer/StepWelcome';
import StepQuestions from '../components/Customer/StepQuestions';
import StepAnalysis from '../components/Customer/StepAnalysis';
import StepContact from '../components/Customer/StepContact';
import StepQuotation from '../components/Customer/StepQuotation';

// Admin Components
import LoginModal from '../components/Admin/LoginModal';

const services = [
  { id: 'tv-mount', name: 'TV Montajı & Askı', icon: Wrench, color: 'text-primary-400' },
  { id: 'paint', name: 'Boyama & Dekorasyon', icon: FlameKindling, color: 'text-yellow-400' },
  { id: 'plumbing', name: 'Sıhhi Tesisat & Onarım', icon: Droplet, color: 'text-blue-400' },
  { id: 'electric', name: 'Elektrik Tesisatı & Arıza', icon: Zap, color: 'text-red-400' },
];

const stepsData = [
  { num: 1, title: 'Hizmet', desc: 'Hizmet Seçimi' },
  { num: 2, title: 'Detaylar', desc: 'Hizmet Detayları' },
  { num: 3, title: 'Keşif', desc: 'Fotoğraf Yükleme' },
  { num: 4, title: 'İletişim', desc: 'Adres & İletişim' },
  { num: 5, title: 'Teklif', desc: 'Fiyat & Kapora (EFT)' }
];

export default function CustomerWizardPage({ adminHook }) {
  const session = useSession();
  const { theme, toggleTheme } = useTheme();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  
  const backendUrl = api.getBackendUrl();
  const currentStepInfo = stepsData.find(s => s.num === session.activeStep) || stepsData[0];

  // Show login modal if redirected from protected route
  const [showLoginModal, setShowLoginModal] = useState(
    location.state?.showLogin || false
  );

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
    <div className="min-h-screen flex flex-col md:flex-row text-slate-900 dark:text-gray-200 bg-slate-50 dark:bg-[#090a0f]">
      <Toaster richColors position="top-right" />
      <CustomerSidebar
        activeStep={session.activeStep}
        setActiveStep={session.setActiveStep}
        selectedService={session.selectedService}
        isSidebarOpen={true}
        setShowLoginModal={setShowLoginModal}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-20 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-8 bg-white/60 dark:bg-gray-950/40 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-4">
            {settings?.logo_path && (
              <img src={`${backendUrl}/${settings.logo_path}`} alt="Logo" className="h-8 object-contain" />
            )}
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{settings?.company_name || 'ERCA Ev Destek'}</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-500/20 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-primary-400" />
              {settings?.company_address || 'Ankara - Çankaya'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/tracking')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-800 text-primary-600 dark:text-primary-300 hover:bg-slate-50 dark:hover:bg-gray-800 text-xs font-bold transition"
            >
              <Search className="w-4 h-4" />
              Sipariş Takibi
            </button>

            <button
              type="button"
              onClick={() => setShowLoginModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 dark:bg-gray-900 border border-slate-800 dark:border-gray-800 text-xs font-semibold text-white dark:text-white hover:bg-slate-800 dark:hover:bg-gray-800 transition"
            >
              <LayoutDashboard className="w-4 h-4" />
              CRM Girişi
            </button>
            <button
              onClick={toggleTheme}
              aria-label="Tema değiştir"
              className="p-2 rounded-lg bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 p-4 md:p-8 max-w-5xl w-full mx-auto space-y-6 md:space-y-8 pb-24 md:pb-8">
          <div className="space-y-6 md:space-y-8">

            {/* Desktop Progress Indicator Steps */}
            <div className="hidden md:grid grid-cols-5 gap-4">
              {stepsData.map(step => (
                <div
                  key={step.num}
                  onClick={() => {
                    if (step.num === 1 || session.selectedService) {
                      session.setActiveStep(step.num);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Adım ${step.num}: ${step.title}`}
                  aria-current={session.activeStep === step.num ? 'step' : undefined}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (step.num === 1 || session.selectedService) {
                        session.setActiveStep(step.num);
                      }
                    }
                  }}
                  className={`glass-card p-4 rounded-2xl border text-left cursor-pointer transition-all duration-300 relative overflow-hidden ${
                    session.activeStep === step.num
                      ? 'border-primary-500/60 bg-primary-50/50 dark:bg-primary-900/10'
                      : step.num > 1 && !session.selectedService
                      ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-gray-800'
                      : 'border-slate-200 dark:border-gray-800 hover:border-slate-300 dark:hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                      session.activeStep === step.num
                        ? 'bg-primary-600 text-white'
                        : 'bg-slate-100 dark:bg-gray-800 text-slate-400 dark:text-gray-400'
                    }`}>
                      {step.num}
                    </div>
                    <div>
                      <span className={`block font-semibold text-sm ${session.activeStep === step.num ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-gray-300'}`}>
                        {step.title}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-gray-500 font-medium block uppercase">{step.desc}</span>
                    </div>
                  </div>
                  {session.activeStep === step.num && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-blue-500"></div>
                  )}
                </div>
              ))}
            </div>

            {/* Mobile Progress Indicator Steps */}
            <div className="block md:hidden bg-white/80 dark:bg-gray-950/60 border border-slate-200 dark:border-gray-800/80 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-primary-600 text-white flex items-center justify-center text-xs font-bold">
                    {session.activeStep}
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{currentStepInfo.title}</span>
                  <span className="text-xs text-slate-500 dark:text-gray-500">— {currentStepInfo.desc}</span>
                </div>
                <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                  %{Math.round((session.activeStep / 5) * 100)}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-gray-900 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-primary-500 to-blue-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${(session.activeStep / 5) * 100}%` }}
                  role="progressbar"
                  aria-valuenow={session.activeStep}
                  aria-valuemin={1}
                  aria-valuemax={5}
                ></div>
              </div>
            </div>

            {/* Wizard Panels */}
            <div className="glass-panel rounded-3xl border border-slate-200 dark:border-gray-800/80 p-6 min-h-[480px] flex flex-col justify-between">
              {session.activeStep === 1 && (
                <StepWelcome
                  services={services}
                  selectedService={session.selectedService}
                  handleQuickServiceSelect={session.handleQuickServiceSelect}
                />
              )}

              {session.activeStep === 2 && (
                <StepQuestions
                  selectedService={session.selectedService}
                  formAnswers={session.formAnswers}
                  handleInputChange={session.handleInputChange}
                  setActiveStep={session.setActiveStep}
                />
              )}

              {session.activeStep === 3 && (
                <StepAnalysis
                  uploadedPhotos={session.uploadedPhotos}
                  analyzing={session.analyzing}
                  handlePhotoUpload={session.handlePhotoUpload}
                  removePhoto={session.removePhoto}
                  setActiveStep={session.setActiveStep}
                />
              )}

              {session.activeStep === 4 && (
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
                />
              )}

              {session.activeStep === 5 && (
                <StepQuotation
                  sessionId={session.sessionId}
                  selectedService={session.selectedService}
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
              )}
            </div>

            {/* Presentational Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-gray-800">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                  Hızlı & Kolay Fiyat
                </h3>
                <p className="text-xs text-slate-600 dark:text-gray-400 leading-relaxed">
                  İhtiyacınızı ve adresinizi belirtin, saniyeler içinde net fiyat teklifinizi ve kapora tutarınızı görün.
                </p>
              </div>
              <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-gray-800">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                  Güvenli Havale / EFT
                </h3>
                <p className="text-xs text-slate-600 dark:text-gray-400 leading-relaxed">
                  %20 kaporayı doğrudan resmi banka IBAN hesabımıza yatırarak işleminizi ve usta randevunuzu garantileyin.
                </p>
              </div>
              <div className="glass-card p-5 rounded-2xl border border-slate-200 dark:border-gray-800">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Uzman Usta Yönlendirme
                </h3>
                <p className="text-xs text-slate-600 dark:text-gray-400 leading-relaxed">
                  Kapora onayınızın ardından uzman usta adresinize gelerek işi tamamlar ve size onaylatır.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Admin Login Modal */}
      <LoginModal
        showLoginModal={showLoginModal}
        setShowLoginModal={setShowLoginModal}
        adminUsername={adminHook.adminUsername}
        setAdminUsername={adminHook.setAdminUsername}
        adminPassword={adminHook.adminPassword}
        setAdminPassword={adminHook.setAdminPassword}
        adminLoggingIn={adminHook.adminLoggingIn}
        handleAdminLogin={adminHook.handleAdminLogin}
      />
    </div>
  );
}

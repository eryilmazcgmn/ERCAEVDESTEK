import React, { useEffect, lazy, Suspense } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Toaster } from 'sonner';
import { RefreshCw, Sun, Moon } from 'lucide-react';

import { api } from '../services/api';
import { useTheme } from '../hooks/useTheme';
import { SkeletonDashboard } from '../components/ui/Skeleton';

// Admin Components
import AdminSidebar from '../components/Admin/AdminSidebar';
import DashboardTab from '../components/Admin/DashboardTab';
import CustomersTab from '../components/Admin/CustomersTab';
import QuotationsTab from '../components/Admin/QuotationsTab';
import WorkOrdersTab from '../components/Admin/WorkOrdersTab';
import PricingTab from '../components/Admin/PricingTab';
import TechniciansTab from '../components/Admin/TechniciansTab';
import SettingsTab from '../components/Admin/SettingsTab';
import ServicesTab from '../components/Admin/ServicesTab';

const VALID_TABS = ['dashboard', 'customers', 'quotations', 'work-orders', 'pricing', 'technicians', 'services', 'settings'];

export default function AdminPage({ admin }) {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { tab } = useParams();
  const [searchParams] = useSearchParams();
  const backendUrl = api.getBackendUrl();

  // Sync URL tab to admin state
  const activeTab = VALID_TABS.includes(tab) ? tab : 'dashboard';

  useEffect(() => {
    if (activeTab !== admin.activeAdminTab) {
      admin.setActiveAdminTab(activeTab);
    }
  }, [activeTab]);

  // Custom tab setter that also updates URL
  const setActiveAdminTab = (newTab) => {
    admin.setActiveAdminTab(newTab);
    navigate(`/admin/${newTab}`, { replace: true });
  };

  const handleNavigateToWorkOrder = (quotationId) => {
    if (quotationId) {
      const wo = admin.crmWorkOrders.find(w => w.quotation_id === quotationId || w.id === quotationId);
      if (wo) {
        admin.setTargetWoId(wo.id);
      }
    }
    setActiveAdminTab('work-orders');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row text-slate-900 dark:text-gray-200 bg-slate-50 dark:bg-[#090a0f]">
      <Toaster richColors position="top-right" />
      <AdminSidebar
        activeAdminTab={activeTab}
        setActiveAdminTab={setActiveAdminTab}
        isSidebarOpen={admin.isSidebarOpen}
        setIsAdminMode={() => {
          admin.handleAdminLogout();
          navigate('/');
        }}
        handleAdminLogout={() => {
          admin.handleAdminLogout();
          navigate('/');
        }}
      />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-20 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-8 bg-white/40 dark:bg-gray-950/40 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Yönetim ve CRM Sistemi</h1>
            <button
              type="button"
              onClick={() => admin.fetchCrmStats()}
              disabled={admin.loadingCrmData}
              aria-label="Verileri yenile"
              className="p-2 rounded-lg bg-slate-100 dark:bg-gray-900 hover:bg-slate-200 dark:hover:bg-gray-800 border border-slate-200 dark:border-gray-800 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition"
            >
              <RefreshCw className={`w-4 h-4 ${admin.loadingCrmData ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" aria-hidden="true"></span>
            <span className="text-xs text-slate-600 dark:text-gray-400 font-semibold">Admin Oturumu Aktif</span>
            <button
              onClick={toggleTheme}
              aria-label="Tema değiştir"
              className="p-2 ml-2 rounded-lg bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white transition"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        <div className="p-8 max-w-6xl w-full mx-auto space-y-8">
          {admin.loadingCrmData && !admin.crmStats ? (
            <SkeletonDashboard />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardTab
                  crmStats={admin.crmStats}
                  crmQuotations={admin.crmQuotations}
                  crmWorkOrders={admin.crmWorkOrders}
                  crmServices={admin.crmServices}
                  backendUrl={backendUrl}
                  setActiveAdminTab={setActiveAdminTab}
                  handleUpdateWoStatus={admin.handleUpdateWoStatus}
                />
              )}

              {activeTab === 'customers' && (
                <CustomersTab crmCustomers={admin.crmCustomers} />
              )}

              {activeTab === 'quotations' && (
                <QuotationsTab
                  crmQuotations={admin.crmQuotations}
                  crmServices={admin.crmServices}
                  backendUrl={backendUrl}
                  setActiveAdminTab={setActiveAdminTab}
                  handleNavigateToWorkOrder={handleNavigateToWorkOrder}
                />
              )}

              {activeTab === 'work-orders' && (
                <WorkOrdersTab
                  crmWorkOrders={admin.crmWorkOrders}
                  crmTechnicians={admin.crmTechnicians}
                  handleUpdateWoStatus={admin.handleUpdateWoStatus}
                  handleAssignTechnician={admin.handleAssignTechnician}
                  backendUrl={backendUrl}
                  targetWoId={admin.targetWoId}
                  setTargetWoId={admin.setTargetWoId}
                />
              )}

              {activeTab === 'pricing' && (
                <PricingTab
                  crmPrices={admin.crmPrices}
                  crmServices={admin.crmServices}
                  handleBulkUpdatePrices={admin.handleBulkUpdatePrices}
                  handleCreateServicePrice={admin.handleCreateServicePrice}
                  handleDeleteServicePrice={admin.handleDeleteServicePrice}
                  loadingCrmData={admin.loadingCrmData}
                  fetchCrmPrices={admin.fetchCrmPrices}
                />
              )}

              {activeTab === 'technicians' && (
                <TechniciansTab
                  crmTechnicians={admin.crmTechnicians}
                  handleCreateTechnician={admin.handleCreateTechnician}
                  handleDeleteTechnician={admin.handleDeleteTechnician}
                  loadingCrmData={admin.loadingCrmData}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsTab adminToken={admin.adminToken} />
              )}

              {activeTab === 'services' && (
                <ServicesTab
                  crmServices={admin.crmServices}
                  handleCreateService={admin.handleCreateService}
                  handleUpdateService={admin.handleUpdateService}
                  handleDeleteService={admin.handleDeleteService}
                  loadingCrmData={admin.loadingCrmData}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { toast } from 'sonner';

export function useAdmin() {
  const [isAdminMode, setIsAdminMode] = useState(() => JSON.parse(sessionStorage.getItem('isAdminMode')) || false);
  const [isTechnicianMode, setIsTechnicianMode] = useState(() => JSON.parse(sessionStorage.getItem('isTechnicianMode')) || false);
  const [loggedUser, setLoggedUser] = useState(() => JSON.parse(sessionStorage.getItem('loggedUser')) || null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminToken, setAdminToken] = useState(() => sessionStorage.getItem('adminToken') || '');
  const [adminLoggingIn, setAdminLoggingIn] = useState(false);
  const [crmStats, setCrmStats] = useState(null);
  const [crmQuotations, setCrmQuotations] = useState([]);
  const [crmWorkOrders, setCrmWorkOrders] = useState([]);
  const [crmCustomers, setCrmCustomers] = useState([]);
  const [crmTechnicians, setCrmTechnicians] = useState([]);
  const [crmPrices, setCrmPrices] = useState([]);
  const [crmServices, setCrmServices] = useState([]);
  const [activeAdminTab, setActiveAdminTab] = useState(() => sessionStorage.getItem('activeAdminTab') || 'dashboard');
  const [loadingCrmData, setLoadingCrmData] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [targetWoId, setTargetWoId] = useState(null);

  let navigate;
  try {
    navigate = useNavigate();
  } catch {
    // Hook may be used outside Router during initial render
    navigate = null;
  }

  const handleNavigateToWorkOrder = useCallback((quotationId) => {
    if (quotationId) {
      const wo = crmWorkOrders.find(w => w.quotation_id === quotationId || w.id === quotationId);
      if (wo) {
        setTargetWoId(wo.id);
      }
    }
    setActiveAdminTab('work-orders');
  }, [crmWorkOrders]);

  // Sync state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('isAdminMode', JSON.stringify(isAdminMode));
    sessionStorage.setItem('isTechnicianMode', JSON.stringify(isTechnicianMode));
    sessionStorage.setItem('loggedUser', JSON.stringify(loggedUser));
    sessionStorage.setItem('adminToken', adminToken);
    sessionStorage.setItem('activeAdminTab', activeAdminTab);
  }, [isAdminMode, isTechnicianMode, loggedUser, adminToken, activeAdminTab]);

  // Fetch admin/technician statistics and lists
  const fetchCrmStats = useCallback(async (token = adminToken, role = loggedUser?.role) => {
    if (!token) return;
    setLoadingCrmData(true);
    try {
      if (role === 'technician') {
        const woRes = await api.fetchTechnicianWorkOrders(token);
        const list = woRes.data || woRes.work_orders || [];
        setCrmWorkOrders(list);
      } else {
        const [statsRes, custRes, quotRes, woRes, techRes, priceRes] = await Promise.all([
          api.fetchDashboardStats(token).catch(() => null),
          api.fetchCustomers(token).catch(() => null),
          api.fetchQuotations(token).catch(() => null),
          api.fetchWorkOrders(token).catch(() => null),
          api.fetchTechnicians(token).catch(() => null),
          api.fetchServicePrices(token).catch(() => null),
        ]);

        if (statsRes) setCrmStats(statsRes.data || statsRes.stats);
        if (custRes) setCrmCustomers(custRes.data || custRes.customers || []);
        if (quotRes) setCrmQuotations(quotRes.data || quotRes.quotations || []);
        if (woRes) setCrmWorkOrders(woRes.data || woRes.work_orders || []);
        if (techRes) setCrmTechnicians(techRes.data || techRes.technicians || []);
        if (priceRes) setCrmPrices(priceRes.data || priceRes.prices || []);

        // Fetch services for admin
        const svcRes = await api.fetchAdminServices(token).catch(() => null);
        if (svcRes) setCrmServices(svcRes.data || []);
      }
    } catch (err) {
      console.error('Error loading CRM stats:', err);
    } finally {
      setLoadingCrmData(false);
    }
  }, [adminToken, loggedUser?.role]);

  // Admin login handler — navigates to proper route after login
  const handleAdminLogin = useCallback(async (e, directUsername, directPassword) => {
    if (e && e.preventDefault) e.preventDefault();
    const loginUsername = directUsername || adminUsername;
    const loginPassword = directPassword || adminPassword;
    if (!loginUsername || !loginPassword) return;
    setAdminLoggingIn(true);
    try {
      const res = await api.adminLogin(loginUsername, loginPassword);
      const data = res.data || res;

      if (res.status || res.success) {
        const token = data.token;
        const role = data.role;
        setAdminToken(token);
        const u = { id: data.user_id, role, username: loginUsername, name: data.name };
        setLoggedUser(u);

        if (role === 'technician') {
          setIsTechnicianMode(true);
          setIsAdminMode(false);
          if (navigate) navigate('/technician', { replace: true });
        } else {
          setIsAdminMode(true);
          setIsTechnicianMode(false);
          if (navigate) navigate('/admin/dashboard', { replace: true });
        }

        setShowLoginModal(false);
        fetchCrmStats(token, role);
      } else {
        toast.error(res.message || 'Hatalı kullanıcı adı veya şifre.');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Hatalı kullanıcı adı veya şifre.');
    } finally {
      setAdminLoggingIn(false);
    }
  }, [adminUsername, adminPassword, fetchCrmStats, navigate]);

  // On mount, fetch CRM data if already logged in from sessionStorage
  useEffect(() => {
    if (adminToken && (isAdminMode || isTechnicianMode)) {
      fetchCrmStats(adminToken, loggedUser?.role);
    }
  }, []);

  const handleUpdateWoStatus = useCallback(async (woId, newStatus, notes = null, photo = null) => {
    try {
      let data;
      if (loggedUser?.role === 'technician') {
        data = await api.updateTechnicianWorkOrderStatus(woId, newStatus, notes, photo, adminToken);
      } else {
        data = await api.updateWorkOrderStatus(woId, newStatus, adminToken);
      }

      if (data.status || data.success) {
        fetchCrmStats();
        toast.success('İş emri durumu güncellendi.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Durum güncellenirken hata oluştu: ' + err.message);
    }
  }, [loggedUser?.role, adminToken, fetchCrmStats]);

  const handleAssignTechnician = useCallback(async (woId, technicianId, scheduledAt) => {
    try {
      const data = await api.assignTechnician(woId, technicianId, scheduledAt, adminToken);
      if (data.status || data.success) {
        fetchCrmStats();
        toast.success('Teknisyen başarıyla atandı.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Teknisyen atanırken hata oluştu: ' + err.message);
    }
  }, [adminToken, fetchCrmStats]);

  const fetchCrmPrices = useCallback(async (token = adminToken) => {
    setLoadingCrmData(true);
    try {
      const data = await api.fetchServicePrices(token);
      const prices = data.data || data.prices || [];
      setCrmPrices(prices);
    } catch (err) {
      console.error('Error fetching service prices:', err);
    } finally {
      setLoadingCrmData(false);
    }
  }, [adminToken]);

  const handleBulkUpdatePrices = useCallback(async (pricesList) => {
    setLoadingCrmData(true);
    try {
      const data = await api.bulkUpdateServicePrices(pricesList, adminToken);
      if (data.status || data.success) {
        toast.success('Fiyatlar başarıyla güncellendi.');
        fetchCrmPrices();
      }
    } catch (err) {
      console.error('Error bulk updating service prices:', err);
      toast.error('Fiyatlar güncellenirken bir hata oluştu: ' + err.message);
    } finally {
      setLoadingCrmData(false);
    }
  }, [adminToken, fetchCrmPrices]);

  const handleCreateServicePrice = useCallback(async (priceData) => {
    setLoadingCrmData(true);
    try {
      const data = await api.createServicePrice(priceData, adminToken);
      if (data.status || data.success) {
        toast.success('Soru ve seçenek başarıyla eklendi.');
        fetchCrmPrices();
        return true;
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Soru eklenirken hata oluştu.');
    } finally {
      setLoadingCrmData(false);
    }
    return false;
  }, [adminToken, fetchCrmPrices]);

  const handleDeleteServicePrice = useCallback(async (id) => {
    if (!window.confirm('Bu soru seçeneğini silmek istediğinizden emin misiniz?')) return;
    setLoadingCrmData(true);
    try {
      const data = await api.deleteServicePrice(id, adminToken);
      if (data.status || data.success) {
        toast.success('Seçenek silindi.');
        fetchCrmPrices();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Seçenek silinirken hata oluştu.');
    } finally {
      setLoadingCrmData(false);
    }
  }, [adminToken, fetchCrmPrices]);

  const handleCreateTechnician = useCallback(async (name, username, password) => {
    setLoadingCrmData(true);
    try {
      const data = await api.createTechnician(name, username, password, adminToken);
      if (data.status || data.success) {
        toast.success('Usta başarıyla eklendi.');
        fetchCrmStats();
        return true;
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Usta eklenirken hata oluştu.');
    } finally {
      setLoadingCrmData(false);
    }
    return false;
  }, [adminToken, fetchCrmStats]);

  const fetchCrmServices = useCallback(async (token = adminToken) => {
    try {
      const res = await api.fetchAdminServices(token);
      setCrmServices(res.data || []);
    } catch (err) {
      console.error('Error fetching services:', err);
    }
  }, [adminToken]);

  const handleCreateService = useCallback(async (serviceData) => {
    try {
      const data = await api.createService(serviceData, adminToken);
      if (data.status || data.success) {
        toast.success('Hizmet başarıyla eklendi.');
        fetchCrmServices();
        return true;
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Hizmet eklenirken hata oluştu.');
    }
    return false;
  }, [adminToken, fetchCrmServices]);

  const handleUpdateService = useCallback(async (id, serviceData) => {
    try {
      const data = await api.updateService(id, serviceData, adminToken);
      if (data.status || data.success) {
        toast.success('Hizmet güncellendi.');
        fetchCrmServices();
        return true;
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Hizmet güncellenirken hata oluştu.');
    }
    return false;
  }, [adminToken, fetchCrmServices]);

  const handleDeleteService = useCallback(async (id) => {
    if (!window.confirm('Bu hizmeti silmek istediğinizden emin misiniz?')) return;
    try {
      const data = await api.deleteService(id, adminToken);
      if (data.status || data.success) {
        toast.success('Hizmet silindi.');
        fetchCrmServices();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Hizmet silinirken hata oluştu.');
    }
  }, [adminToken, fetchCrmServices]);

  const handleDeleteTechnician = useCallback(async (techId) => {
    if (!window.confirm('Bu ustayı silmek istediğinizden emin misiniz?')) return;
    setLoadingCrmData(true);
    try {
      const data = await api.deleteTechnician(techId, adminToken);
      if (data.status || data.success) {
        toast.success('Usta başarıyla silindi.');
        fetchCrmStats();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Usta silinirken hata oluştu.');
    } finally {
      setLoadingCrmData(false);
    }
  }, [adminToken, fetchCrmStats]);

  const handleAdminLogout = useCallback(() => {
    setAdminToken('');
    setIsAdminMode(false);
    setIsTechnicianMode(false);
    setLoggedUser(null);
    setAdminUsername('');
    setAdminPassword('');
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('isAdminMode');
    sessionStorage.removeItem('isTechnicianMode');
    sessionStorage.removeItem('loggedUser');
  }, []);

  return {
    isAdminMode,
    isTechnicianMode,
    loggedUser,
    setIsAdminMode,
    setIsTechnicianMode,
    showLoginModal,
    setShowLoginModal,
    adminUsername,
    setAdminUsername,
    adminPassword,
    setAdminPassword,
    adminToken,
    setAdminToken,
    adminLoggingIn,
    crmStats,
    crmQuotations,
    crmWorkOrders,
    crmCustomers,
    crmTechnicians,
    crmPrices,
    activeAdminTab,
    loadingCrmData,
    isSidebarOpen,
    handleAdminLogin,
    handleAdminLogout,
    fetchCrmStats,
    fetchCrmPrices,
    handleBulkUpdatePrices,
    handleCreateTechnician,
    handleDeleteTechnician,
    setActiveAdminTab,
    setIsSidebarOpen,
    targetWoId,
    setTargetWoId,
    handleNavigateToWorkOrder,
    handleUpdateWoStatus,
    handleAssignTechnician,
    crmServices,
    fetchCrmServices,
    handleCreateService,
    handleUpdateService,
    handleDeleteService,
    handleCreateServicePrice,
    handleDeleteServicePrice
  };
}

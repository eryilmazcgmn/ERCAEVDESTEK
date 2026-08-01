import axios from 'axios';

const isDev = (window.location.port === '5173' || window.location.port === '3000');

const BACKEND_URL = isDev
  ? 'http://localhost:8000'
  : `${window.location.origin}/backend/public`;

const API_URL = `${BACKEND_URL}/api`;

// Centralized Axios Instance with Interceptors
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request Interceptor: Attach Auth token dynamically if provided
apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Normalize API response data and handle auth errors
apiClient.interceptors.response.use(
  (response) => {
    const body = response.data;
    if (typeof body === 'string' && body.trim().startsWith('<')) {
      return Promise.reject(new Error('Sunucu beklenmeyen bir HTML yanıtı döndürdü. Lütfen XAMPP ve veritabanı bağlantılarını kontrol ediniz.'));
    }
    if (body && typeof body === 'object' && 'status' in body) {
      if (body.status === false) {
        const errorMsg = body.message || (body.errors ? Object.values(body.errors).flat().join(' ') : 'Bir işlem hatası oluştu.');
        return Promise.reject(new Error(errorMsg));
      }
      return body;
    }
    return body;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401) {
        console.warn('Unauthorized access - token may be expired.');
      } else if (status === 403) {
        console.warn('Forbidden action.');
      }
      let message = 'Sunucu hatası oluştu.';
      if (typeof data === 'string' && data.trim().startsWith('<')) {
        message = `Sunucu hatası (${status}). Lütfen backend loglarını kontrol ediniz.`;
      } else if (data && typeof data === 'object') {
        message = data.message || (data.errors ? Object.values(data.errors).flat().join(' ') : message);
      }
      return Promise.reject(new Error(message));
    }
    return Promise.reject(error);
  }
);

const getAuthHeader = (token) => token ? { headers: { Authorization: `Bearer ${token}` } } : {};

export const api = {
  // Public Endpoint: Start customer session
  startSession: async (phone, name, utm = {}) => {
    const res = await apiClient.post('/session/start', {
      phone,
      name,
      utm_source: utm.utm_source || null,
      utm_medium: utm.utm_medium || null,
      utm_campaign: utm.utm_campaign || null
    });
    return res;
  },

  // Customer Endpoint: Update contact info
  updateContact: async (sessionId, phone, name, email, address, token, utm = {}) => {
    const res = await apiClient.post(
      `/session/${sessionId}/contact`,
      {
        phone,
        name,
        email,
        address,
        utm_source: utm.utm_source || null,
        utm_medium: utm.utm_medium || null,
        utm_campaign: utm.utm_campaign || null
      },
      getAuthHeader(token)
    );
    return res;
  },

  // Customer Endpoint: Declare deposit payment
  declareDeposit: async (sessionId, token) => {
    const res = await apiClient.post(
      `/session/${sessionId}/deposit-declare`,
      {},
      getAuthHeader(token)
    );
    return res;
  },

  // Customer Endpoint: Upload work area photo/pdf
  uploadFile: async (sessionId, file, token) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post(
      `/session/${sessionId}/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      }
    );
    return res;
  },

  // Customer Endpoint: Compile pricing quotation based on answers
  generateQuotation: async (sessionId, serviceType, details, items, totalAmount, token) => {
    const res = await apiClient.post(
      `/session/${sessionId}/quotation`,
      { service_type: serviceType, details, items, total_amount: totalAmount },
      getAuthHeader(token)
    );
    return res;
  },

  // Customer Endpoint: Approve quotation and generate work order sheet
  approveQuotation: async (quotationId, token) => {
    const res = await apiClient.post(
      `/quotation/${quotationId}/approve`,
      {},
      getAuthHeader(token)
    );
    return res;
  },

  // Admin Endpoint: Login to CRM
  adminLogin: async (username, password) => {
    const res = await apiClient.post('/auth/login', { username, password });
    return res;
  },

  // Admin Endpoint: Get CRM Stats
  fetchDashboardStats: async (token) => {
    const res = await apiClient.get('/admin/dashboard-stats', getAuthHeader(token));
    return res;
  },

  // Admin Endpoint: Get customer list
  fetchCustomers: async (token) => {
    const res = await apiClient.get('/admin/customers', getAuthHeader(token));
    return res;
  },

  // Admin Endpoint: Get all quotations
  fetchQuotations: async (token) => {
    const res = await apiClient.get('/admin/quotations', getAuthHeader(token));
    return res;
  },

  // Admin Endpoint: Get all technician work orders
  fetchWorkOrders: async (token) => {
    const res = await apiClient.get('/admin/work-orders', getAuthHeader(token));
    return res;
  },

  // Admin Endpoint: Complete/Cancel status update for work orders
  updateWorkOrderStatus: async (woId, status, token) => {
    const res = await apiClient.post(
      `/admin/work-orders/${woId}/status`,
      { status },
      getAuthHeader(token)
    );
    return res;
  },

  // Technician Endpoint: Get assigned work orders
  fetchTechnicianWorkOrders: async (token) => {
    const res = await apiClient.get('/technician/work-orders', getAuthHeader(token));
    return res;
  },

  // Technician Endpoint: Update status of assigned work order
  updateTechnicianWorkOrderStatus: async (woId, status, completionNotes, completionPhoto, token) => {
    const res = await apiClient.post(
      `/technician/work-orders/${woId}/status`,
      { status, completion_notes: completionNotes, completion_photo: completionPhoto },
      getAuthHeader(token)
    );
    return res;
  },

  // Admin Endpoint: Get all technicians
  fetchTechnicians: async (token) => {
    const res = await apiClient.get('/admin/technicians', getAuthHeader(token));
    return res;
  },

  // Admin Endpoint: Create a new technician
  createTechnician: async (name, username, password, token) => {
    const res = await apiClient.post(
      '/admin/technicians',
      { name, username, password },
      getAuthHeader(token)
    );
    return res;
  },

  // Admin Endpoint: Delete a technician
  deleteTechnician: async (techId, token) => {
    const res = await apiClient.delete(
      `/admin/technicians/${techId}`,
      getAuthHeader(token)
    );
    return res;
  },

  // Admin Endpoint: Assign technician to work order
  assignTechnician: async (woId, technicianId, scheduledAt, token) => {
    const res = await apiClient.post(
      `/admin/work-orders/${woId}/assign`,
      { technician_id: technicianId, scheduled_at: scheduledAt },
      getAuthHeader(token)
    );
    return res;
  },

  // Admin Endpoint: Fetch dynamic service prices
  fetchServicePrices: async (token) => {
    const res = await apiClient.get('/admin/service-prices', getAuthHeader(token));
    return res;
  },

  // Admin Endpoint: Bulk update service prices
  bulkUpdateServicePrices: async (prices, token) => {
    const res = await apiClient.post(
      '/admin/service-prices/bulk-update',
      { prices },
      getAuthHeader(token)
    );
    return res;
  },

  // Public Settings: Get Bank Info
  fetchBankInfo: async () => {
    const res = await apiClient.get('/settings/bank');
    return res;
  },

  // Helper getters
  getBackendUrl: () => BACKEND_URL,
  getApiUrl: () => API_URL
};

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';

// Custom Hooks
import { useAdmin } from './hooks/useAdmin';
import { useSettings } from './context/SettingsContext';
import { useTheme } from './hooks/useTheme';

// Pages
import CustomerWizardPage from './pages/CustomerWizardPage';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import TechnicianPage from './pages/TechnicianPage';
import TrackingPage from './pages/TrackingPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import TechnicianPortalPage from './pages/TechnicianPortalPage';

// Components
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';

/**
 * Inner App component — must be inside BrowserRouter to use navigation hooks.
 */
function AppRoutes() {
  const admin = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  // After admin login, navigate to proper route
  useEffect(() => {
    if (admin.isAdminMode && location.pathname === '/') {
      navigate('/admin/dashboard', { replace: true });
    }
    if (admin.isTechnicianMode && location.pathname === '/') {
      navigate('/technician', { replace: true });
    }
  }, [admin.isAdminMode, admin.isTechnicianMode, navigate, location.pathname]);

  return (
    <Routes>
      {/* Customer Wizard — Home (no admin dependencies) */}
      <Route
        path="/"
        element={<CustomerWizardPage />}
      />

      {/* Admin / Technician Login Page */}
      <Route
        path="/login"
        element={<LoginPage adminHook={admin} />}
      />

      {/* Tracking Pages */}
      <Route path="/tracking" element={<TrackingPage />} />
      <Route path="/tracking/:sessionId" element={<TrackingPage />} />
      <Route path="/takip" element={<OrderTrackingPage />} />
      <Route path="/takip/:code" element={<OrderTrackingPage />} />
      <Route path="/usta" element={<TechnicianPortalPage />} />

      {/* Admin CRM Panel */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin" adminState={admin}>
            <Navigate to="/admin/dashboard" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/:tab"
        element={
          <ProtectedRoute requiredRole="admin" adminState={admin}>
            <AdminPage admin={admin} />
          </ProtectedRoute>
        }
      />

      {/* Technician Dashboard */}
      <Route
        path="/technician"
        element={
          <ProtectedRoute requiredRole="technician" adminState={admin}>
            <TechnicianPage admin={admin} />
          </ProtectedRoute>
        }
      />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  useTheme();

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Toaster richColors position="top-right" />
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;

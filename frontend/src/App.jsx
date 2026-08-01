import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';

// Custom Hooks
import { useAdmin } from './hooks/useAdmin';
import { useSettings } from './context/SettingsContext';

// Pages
import CustomerWizardPage from './pages/CustomerWizardPage';
import AdminPage from './pages/AdminPage';
import TechnicianPage from './pages/TechnicianPage';
import TrackingPage from './pages/TrackingPage';

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
      {/* Customer Wizard — Home */}
      <Route
        path="/"
        element={<CustomerWizardPage adminHook={admin} />}
      />

      {/* Tracking Pages */}
      <Route path="/tracking" element={<TrackingPage />} />
      <Route path="/tracking/:sessionId" element={<TrackingPage />} />

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

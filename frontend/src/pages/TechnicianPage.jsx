import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Toaster } from 'sonner';

import TechnicianDashboard from '../components/Technician/TechnicianDashboard';
import { api } from '../services/api';

export default function TechnicianPage({ admin }) {
  const navigate = useNavigate();
  const backendUrl = api.getBackendUrl();

  const handleLogout = () => {
    admin.handleAdminLogout();
    navigate('/');
  };

  return (
    <>
      <Toaster richColors position="top-right" />
      <TechnicianDashboard
        crmWorkOrders={admin.crmWorkOrders}
        handleUpdateWoStatus={admin.handleUpdateWoStatus}
        handleLogout={handleLogout}
        loggedUser={admin.loggedUser}
        backendUrl={backendUrl}
      />
    </>
  );
}

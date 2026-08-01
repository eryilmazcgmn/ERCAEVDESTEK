import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * ProtectedRoute — Guards routes based on auth role.
 * Redirects unauthenticated users to home (/) or shows login modal.
 * 
 * @param {string} requiredRole - 'admin' | 'technician'
 * @param {object} adminState - The admin hook state
 * @param {React.ReactNode} children - The protected content
 */
export default function ProtectedRoute({ requiredRole, adminState, children }) {
  const location = useLocation();

  // Check if user is authenticated
  if (!adminState.adminToken) {
    return <Navigate to="/" state={{ from: location, showLogin: true }} replace />;
  }

  // Check role
  const userRole = adminState.loggedUser?.role;

  if (requiredRole === 'admin' && userRole !== 'admin') {
    return <Navigate to="/" replace />;
  }

  if (requiredRole === 'technician' && userRole !== 'technician') {
    return <Navigate to="/" replace />;
  }

  return children;
}

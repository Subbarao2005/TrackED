import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');

  // If there is no token (not logged in), violently redirect back to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If the user's role isn't inside the approved array (e.g., student trying to hit /teacher)
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to={`/${userRole}`} replace />; // Redirect them back to their own domain
  }

  // If they pass both checks, officially render the Dashboard component they asked for!
  return children;
}

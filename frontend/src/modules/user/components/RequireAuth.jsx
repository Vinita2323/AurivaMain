import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

/**
 * Guards a route behind user login. Guests are sent to /login and returned
 * to the requested page after signing in.
 */
export default function RequireAuth({ children }) {
  const { isAuthenticated, token } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace state={{ from: { pathname: location.pathname } }} />;
  }
  return children;
}

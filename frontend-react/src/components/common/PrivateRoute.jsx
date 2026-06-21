import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // ✅ If adminOnly and user is not admin → go to customer home
  if (adminOnly && user?.role !== 'admin' && user?.role !== 'manager') {
    return <Navigate to="/" />;
  }

  // ✅ If not adminOnly and user is admin → go to admin dashboard
  if (!adminOnly && (user?.role === 'admin' || user?.role === 'manager')) {
    return <Navigate to="/admin" />;
  }

  return children;
};

export default PrivateRoute;
// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

// Customer pages
import CustomerMenu from './pages/CustomerMenu';
import CustomerLogin from './pages/CustomerLogin';
import CustomerRegister from './pages/CustomerRegister';
import CustomerProfile from './pages/CustomerProfile';
import CustomerSettings from './pages/CustomerSettings';
import CustomerNotifications from './pages/CustomerNotifications';

// Admin pages
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import Stock from './pages/Stock';
import Menu from './pages/Menu';
import NotificationSettings from './pages/NotificationSettings';

// Protected route component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }
  
  return children;
};

// Main App component
const AppContent = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Toaster position="top-right" />
        <Routes>
          {/* Customer Routes */}
          <Route path="/" element={<CustomerMenu />} />
          <Route path="/login" element={<CustomerLogin />} />
          <Route path="/register" element={<CustomerRegister />} />
          <Route path="/profile" element={
            <ProtectedRoute>
              <CustomerProfile />
            </ProtectedRoute>
          } />
          <Route path="/customer/settings" element={
            <ProtectedRoute>
              <CustomerSettings />
            </ProtectedRoute>
          } />
          <Route path="/customer/notifications" element={
            <ProtectedRoute>
              <CustomerNotifications />
            </ProtectedRoute>
          } />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/orders" element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <Orders />
            </ProtectedRoute>
          } />
          <Route path="/admin/profile" element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="/admin/reports" element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <Reports />
            </ProtectedRoute>
          } />
          <Route path="/admin/stock" element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <Stock />
            </ProtectedRoute>
          } />
          <Route path="/admin/menu" element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <Menu />
            </ProtectedRoute>
          } />
          <Route path="/admin/notifications" element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <NotificationSettings />
            </ProtectedRoute>
          } />
          
          {/* Fallback - redirect to home */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
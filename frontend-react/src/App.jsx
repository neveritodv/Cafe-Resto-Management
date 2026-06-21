import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/common/PrivateRoute';

// Public pages
import CustomerMenu from './pages/CustomerMenu';
import Login from './pages/Login';

// Admin pages
import Dashboard from './pages/Dashboard';
import Menu from './pages/Menu';
import Orders from './pages/Orders';
import Stock from './pages/Stock';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import NotificationSettings from './pages/NotificationSettings'; // ✅ NEW

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<CustomerMenu />} />
          <Route path="/login" element={<Login />} />

          {/* Admin routes */}
          <Route path="/admin" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/admin/menu" element={<PrivateRoute><Menu /></PrivateRoute>} />
          <Route path="/admin/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
          <Route path="/admin/stock" element={<PrivateRoute><Stock /></PrivateRoute>} />
          <Route path="/admin/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
          <Route path="/admin/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
          <Route path="/admin/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/admin/notifications" element={<PrivateRoute><NotificationSettings /></PrivateRoute>} /> {/* ✅ NEW */}

          {/* Redirect old paths */}
          <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
          <Route path="/menu" element={<Navigate to="/admin/menu" replace />} />
          <Route path="/orders" element={<Navigate to="/admin/orders" replace />} />
          <Route path="/stock" element={<Navigate to="/admin/stock" replace />} />
          <Route path="/reports" element={<Navigate to="/admin/reports" replace />} />
          <Route path="/settings" element={<Navigate to="/admin/settings" replace />} />
          <Route path="/profile" element={<Navigate to="/admin/profile" replace />} />
          <Route path="/notifications" element={<Navigate to="/admin/notifications" replace />} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '../api/endpoints';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
        setLoading(false);
        return;
      } catch {}
    }
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await auth.getUser();
      const userData = response.data;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await auth.login({ email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setToken(token);
      setUser(user);
      toast.success('Bienvenue ' + user.name + ' !');
      return { success: true, user };
    } catch (error) {
      const msg = error.response?.data?.message || 'Erreur de connexion';
      toast.error(msg);
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    try { await auth.logout(); } catch {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    toast.success('Déconnecté');
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    setUser,
    isAuthenticated: !!token,
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'admin' || user?.role === 'manager',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
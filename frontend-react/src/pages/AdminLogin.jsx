// src/pages/AdminLogin.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password);
      setLoading(false);
      if (result.success) {
        const user = result.user;
        if (user?.role === 'admin' || user?.role === 'manager') {
          toast.success('Bienvenue dans l\'administration');
          navigate('/admin');
        } else {
          toast.error('Accès non autorisé');
          navigate('/');
        }
      } else {
        setError('Email ou mot de passe incorrect');
      }
    } catch (err) {
      setError('Une erreur est survenue');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900 p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-indigo-300 hover:text-indigo-200 mb-4 transition-colors">
          <FiArrowLeft /> Retour au menu
        </Link>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 md:p-10 border border-white/10">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img src="/logo.png" alt="RestauFlow" className="h-16 w-auto" />
            </div>
            <h1 className="text-3xl font-bold text-white">Administration</h1>
            <p className="text-indigo-300 mt-1">Connectez-vous pour gérer votre restaurant</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 text-red-200 text-sm rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-indigo-200 mb-1.5">Email</label>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-white placeholder-indigo-300/50"
                  placeholder="admin@restaurant.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-indigo-200 mb-1.5">Mot de passe</label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-white placeholder-indigo-300/50"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-indigo-200"
                >
                  {showPassword ? <FiEyeOff className="text-xl" /> : <FiEye className="text-xl" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connexion...
                </span>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-indigo-300/50">
           
           
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
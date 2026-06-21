import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { auth } from '../api/endpoints';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const CustomerRegister = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const redirectParam = searchParams.get('redirect') || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== passwordConfirmation) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    if (password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    setLoading(true);
    try {
      await auth.register({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        role: 'customer',
      });
      const result = await login(email, password);
      if (result.success) {
        const user = result.user;
        if (user?.role === 'admin' || user?.role === 'manager') {
          navigate('/admin');
        } else {
          navigate(redirectParam);
        }
      }
    } catch (error) {
      const errors = error.response?.data?.errors;
      if (errors) {
        const msg = Object.values(errors).flat().join(', ');
        toast.error(msg);
      } else {
        toast.error('Erreur lors de l\'inscription');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="RestauFlow" className="h-12 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-gray-800">Créer un compte</h1>
          <p className="text-gray-500">Commandez plus rapidement</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ... fields ... */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition shadow-md disabled:opacity-50"
          >
            {loading ? 'Inscription...' : 'S\'inscrire'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          Déjà un compte ?{' '}
          <Link
            to={`/login${redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : ''}`}
            className="text-indigo-600 hover:underline"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
};

export default CustomerRegister;
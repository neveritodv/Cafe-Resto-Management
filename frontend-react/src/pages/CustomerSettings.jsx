import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiUser, FiMail, FiLock, FiCamera, FiSave } from 'react-icons/fi';
import api from '../api/axios';
import toast from 'react-hot-toast';

const CustomerSettings = () => {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put('/user/profile', { name, email });
      setUser(res.data);
      toast.success('Profil mis à jour');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== newPasswordConfirmation) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    setLoading(true);
    try {
      await api.post('/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: newPasswordConfirmation,
      });
      toast.success('Mot de passe changé');
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirmation('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('L\'image doit faire moins de 2 Mo');
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const res = await api.post('/user/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUser(prev => ({ ...prev, avatar_url: res.data.avatar }));
      toast.success('Avatar mis à jour');
    } catch (error) {
      toast.error('Erreur');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <Link to="/" className="inline-flex items-center gap-2 text-indigo-600 hover:underline mb-6">
          <FiArrowLeft /> Retour au menu
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Paramètres</h1>

        <div className="flex items-center gap-6 mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg overflow-hidden">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0) || 'U'
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-1.5 bg-indigo-600 rounded-full text-white hover:bg-indigo-700 transition-colors shadow-md"
              title="Changer la photo"
            >
              <FiCamera className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          <div>
            <p className="text-sm text-gray-600">Photo de profil</p>
            <p className="text-xs text-gray-400">JPG, PNG, GIF · Max 2 Mo</p>
            {uploading && <p className="text-xs text-indigo-600 mt-1">Upload...</p>}
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition shadow-sm disabled:opacity-50"
          >
            <FiSave /> {loading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </form>

        <hr className="my-6" />

        <h2 className="text-lg font-semibold text-gray-800 mb-4">Changer le mot de passe</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe actuel</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
              minLength="8"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer</label>
            <input
              type="password"
              value={newPasswordConfirmation}
              onChange={(e) => setNewPasswordConfirmation(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition shadow-sm disabled:opacity-50"
          >
            <FiLock /> {loading ? 'Changement...' : 'Changer le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CustomerSettings;
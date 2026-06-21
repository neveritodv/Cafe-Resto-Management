import React, { useState, useEffect } from 'react';
import { FiSave, FiLock, FiMail, FiPhone, FiMapPin, FiPercent, FiBell, FiAlertCircle, FiUser, FiUpload } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';
import { settings } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const Settings = () => {
  const { user, setUser } = useAuth(); // we'll need setUser to update the context
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || null);

  const [formData, setFormData] = useState({
    restaurant_name: '',
    restaurant_address: '',
    restaurant_phone: '',
    restaurant_email: '',
    tax_rate: 10,
    stock_alert_threshold: 5,
    notification_emails: '',
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await settings.getAll();
        const data = res.data;
        const flat = {};
        Object.values(data).forEach(group => {
          group.forEach(item => {
            flat[item.key] = item.value;
          });
        });
        setFormData({
          restaurant_name: flat.restaurant_name || '',
          restaurant_address: flat.restaurant_address || '',
          restaurant_phone: flat.restaurant_phone || '',
          restaurant_email: flat.restaurant_email || '',
          tax_rate: parseFloat(flat.tax_rate) || 10,
          stock_alert_threshold: parseInt(flat.stock_alert_threshold) || 5,
          notification_emails: flat.notification_emails || '',
        });
        setAvatarPreview(user?.avatar_url || null);
      } catch (error) {
        toast.error('Erreur lors du chargement des paramètres');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [user]);

  // Update a single setting
  const updateSetting = async (key, value) => {
    try {
      await settings.update(key, { value });
      return true;
    } catch (error) {
      console.error(`Failed to update ${key}`, error);
      return false;
    }
  };

  // Save all settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    const updates = [
      { key: 'restaurant_name', value: formData.restaurant_name },
      { key: 'restaurant_address', value: formData.restaurant_address },
      { key: 'restaurant_phone', value: formData.restaurant_phone },
      { key: 'restaurant_email', value: formData.restaurant_email },
      { key: 'tax_rate', value: formData.tax_rate.toString() },
      { key: 'stock_alert_threshold', value: formData.stock_alert_threshold.toString() },
      { key: 'notification_emails', value: formData.notification_emails },
    ];

    try {
      await Promise.all(updates.map(u => settings.update(u.key, { value: u.value })));
      toast.success('Paramètres enregistrés avec succès');
    } catch (error) {
      toast.error('Erreur lors de l’enregistrement');
    } finally {
      setSaving(false);
    }
  };

  // Change password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.new_password_confirmation) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    if (passwordData.new_password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    setChangingPassword(true);
    try {
      await api.post('/change-password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
        new_password_confirmation: passwordData.new_password_confirmation,
      });
      toast.success('Mot de passe changé avec succès');
      setPasswordData({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
      });
    } catch (error) {
      const msg = error.response?.data?.message || 'Erreur lors du changement de mot de passe';
      toast.error(msg);
    } finally {
      setChangingPassword(false);
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type and size
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
      setAvatarPreview(res.data.avatar);
      // Update user context
      if (setUser) {
        setUser(prev => ({ ...prev, avatar_url: res.data.avatar }));
      }
      toast.success('Avatar mis à jour avec succès');
    } catch (error) {
      toast.error('Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 ml-64 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-500 text-sm">Chargement des paramètres...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 overflow-y-auto">
        <Header title="Paramètres" />
        <main className="p-8">
          <div className="max-w-3xl mx-auto space-y-8">
            {/* Avatar Upload */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-3">
                <FiUser className="text-indigo-500" /> Photo de profil
              </h2>
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg overflow-hidden">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      user?.name?.charAt(0) || 'U'
                    )}
                  </div>
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 p-1 bg-indigo-600 rounded-full text-white cursor-pointer hover:bg-indigo-700 transition-colors shadow-md"
                    title="Changer la photo"
                  >
                    <FiUpload className="w-4 h-4" />
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Cliquez sur l'icône pour changer votre photo de profil</p>
                  <p className="text-xs text-gray-400">Formats acceptés : JPG, PNG, GIF • Max 2 Mo</p>
                  {uploading && <p className="text-xs text-indigo-600 mt-1">Upload en cours...</p>}
                </div>
              </div>
            </div>

            {/* Restaurant Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-3">
                <FiMapPin className="text-indigo-500" /> Informations du restaurant
              </h2>
              <form onSubmit={handleSaveSettings} className="space-y-4">
                {/* ... (same as before) ... */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom du restaurant</label>
                    <input
                      type="text"
                      name="restaurant_name"
                      value={formData.restaurant_name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="Café Restaurant"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email du restaurant</label>
                    <input
                      type="email"
                      name="restaurant_email"
                      value={formData.restaurant_email}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="contact@cafe.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                  <input
                    type="text"
                    name="restaurant_address"
                    value={formData.restaurant_address}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="123 Rue de la Gastronomie, Paris"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <input
                    type="text"
                    name="restaurant_phone"
                    value={formData.restaurant_phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="+33 1 23 45 67 89"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiSave /> {saving ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              </form>
            </div>

            {/* Business Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-3">
                <FiPercent className="text-indigo-500" /> Paramètres commerciaux
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Taux de TVA (%)</label>
                  <input
                    type="number"
                    name="tax_rate"
                    value={formData.tax_rate}
                    onChange={handleChange}
                    step="0.1"
                    min="0"
                    max="100"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Seuil d’alerte stock</label>
                  <input
                    type="number"
                    name="stock_alert_threshold"
                    value={formData.stock_alert_threshold}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Emails de notification</label>
                <input
                  type="text"
                  name="notification_emails"
                  value={formData.notification_emails}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  placeholder="admin@cafe.com, manager@cafe.com"
                />
                <p className="text-xs text-gray-400 mt-1">Séparez les emails par des virgules</p>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiSave /> {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </div>

            {/* Change Password */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-3">
                <FiLock className="text-indigo-500" /> Changer le mot de passe
              </h2>
              <form onSubmit={handleChangePassword} className="space-y-4">
                {/* ... (same as before) ... */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe actuel</label>
                  <input
                    type="password"
                    name="current_password"
                    value={passwordData.current_password}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
                    <input
                      type="password"
                      name="new_password"
                      value={passwordData.new_password}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      required
                      minLength="8"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer</label>
                    <input
                      type="password"
                      name="new_password_confirmation"
                      value={passwordData.new_password_confirmation}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiLock /> {changingPassword ? 'Changement...' : 'Changer le mot de passe'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings;
import React, { useState, useEffect } from 'react';
import { FiSave, FiBell, FiPackage, FiShoppingCart, FiRefreshCw, FiTrash2, FiCheckCircle, FiX } from 'react-icons/fi';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';
import toast from 'react-hot-toast';

const NotificationSettings = () => {
  const [preferences, setPreferences] = useState({
    newOrders: true,
    lowStock: true,
    systemUpdates: true,
  });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load preferences & notifications from localStorage
  useEffect(() => {
    const savedPrefs = localStorage.getItem('notification_preferences');
    if (savedPrefs) {
      try { setPreferences(JSON.parse(savedPrefs)); } catch {}
    }
    const savedNotifs = localStorage.getItem('notifications');
    if (savedNotifs) {
      try { setNotifications(JSON.parse(savedNotifs)); } catch {}
    }
    setLoading(false);
  }, []);

  const handleToggle = (key) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const savePreferences = () => {
    setSaving(true);
    localStorage.setItem('notification_preferences', JSON.stringify(preferences));
    toast.success('Préférences de notification enregistrées');
    setSaving(false);
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    if (window.confirm('Supprimer toutes les notifications ?')) {
      setNotifications([]);
      localStorage.removeItem('notifications');
      // Dispatch a custom event so Header knows to refresh
      window.dispatchEvent(new Event('notifications-cleared'));
      toast.success('Toutes les notifications ont été supprimées');
    }
  };

  // Mark all as read
  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem('notifications', JSON.stringify(updated));
    toast.success('Toutes les notifications marquées comme lues');
  };

  // Format date
  const formatDate = (iso) => {
    const date = new Date(iso);
    return date.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 ml-64 flex items-center justify-center bg-gray-50">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 overflow-y-auto">
        <Header title="Notifications" />
        <main className="p-8 max-w-3xl mx-auto space-y-6">
          {/* Preferences card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-6">
              <FiBell className="text-2xl text-indigo-600" />
              <h2 className="text-xl font-semibold text-gray-800">Préférences de notification</h2>
            </div>
            <p className="text-gray-500 text-sm mb-6">
              Choisissez les types de notifications que vous souhaitez recevoir.
            </p>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <FiShoppingCart className="text-indigo-500" />
                  <div>
                    <p className="font-medium text-gray-800">Nouvelles commandes</p>
                    <p className="text-sm text-gray-500">Recevoir une alerte pour chaque nouvelle commande</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle('newOrders')}
                  className={`relative w-12 h-6 rounded-full transition-colors ${preferences.newOrders ? 'bg-indigo-600' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${preferences.newOrders ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <FiPackage className="text-red-500" />
                  <div>
                    <p className="font-medium text-gray-800">Stock critique</p>
                    <p className="text-sm text-gray-500">Alerte lorsque le stock d'un produit est bas</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle('lowStock')}
                  className={`relative w-12 h-6 rounded-full transition-colors ${preferences.lowStock ? 'bg-indigo-600' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${preferences.lowStock ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <FiRefreshCw className="text-blue-500" />
                  <div>
                    <p className="font-medium text-gray-800">Mises à jour système</p>
                    <p className="text-sm text-gray-500">Notifications concernant les mises à jour et maintenance</p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle('systemUpdates')}
                  className={`relative w-12 h-6 rounded-full transition-colors ${preferences.systemUpdates ? 'bg-indigo-600' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${preferences.systemUpdates ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
              <button
                onClick={savePreferences}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
              >
                <FiSave /> {saving ? 'Enregistrement...' : 'Enregistrer les préférences'}
              </button>
            </div>
          </div>

          {/* Manage notifications card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <FiBell className="text-2xl text-indigo-600" />
                <h2 className="text-xl font-semibold text-gray-800">Gérer les notifications</h2>
              </div>
              <div className="flex gap-2">
                {notifications.length > 0 && (
                  <>
                    <button
                      onClick={markAllAsRead}
                      className="flex items-center gap-1 px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <FiCheckCircle /> Tout lire
                    </button>
                    <button
                      onClick={clearAllNotifications}
                      className="flex items-center gap-1 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <FiTrash2 /> Tout supprimer
                    </button>
                  </>
                )}
              </div>
            </div>

            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <FiBell className="text-4xl mx-auto mb-2 text-gray-300" />
                <p>Aucune notification</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {notifications.map(n => (
                  <div
                    key={n.id}
                    className={`flex items-center justify-between p-3 rounded-xl border ${!n.read ? 'bg-indigo-50/50 border-indigo-100' : 'bg-gray-50 border-gray-100'}`}
                  >
                    <div className="flex-1">
                      <p className="text-sm text-gray-800">{n.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400">{formatDate(n.time)}</span>
                        {n.type === 'new_order' && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Commande</span>
                        )}
                        {n.type === 'low_stock' && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Stock</span>
                        )}
                        {!n.read && (
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Nouveau</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const updated = notifications.map(notif =>
                          notif.id === n.id ? { ...notif, read: true } : notif
                        );
                        setNotifications(updated);
                        localStorage.setItem('notifications', JSON.stringify(updated));
                      }}
                      className="p-1 text-gray-400 hover:text-indigo-600 rounded transition-colors"
                      title="Marquer comme lu"
                    >
                      <FiCheckCircle className="text-sm" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default NotificationSettings;
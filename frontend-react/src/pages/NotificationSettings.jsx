import React, { useState, useEffect } from 'react';
import { FiSave, FiBell, FiPackage, FiShoppingCart, FiRefreshCw } from 'react-icons/fi';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';
import toast from 'react-hot-toast';

const NotificationSettings = () => {
  const [preferences, setPreferences] = useState({
    newOrders: true,
    lowStock: true,
    systemUpdates: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('notification_preferences');
    if (saved) {
      try {
        setPreferences(JSON.parse(saved));
      } catch {}
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
        <Header title="Paramètres de notification" />
        <main className="p-8 max-w-3xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-6">
              <FiBell className="text-2xl text-indigo-600" />
              <h2 className="text-xl font-semibold text-gray-800">Notifications</h2>
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
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${preferences.newOrders ? 'translate-x-6' : 'translate-x-0'}`}
                  />
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
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${preferences.lowStock ? 'translate-x-6' : 'translate-x-0'}`}
                  />
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
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${preferences.systemUpdates ? 'translate-x-6' : 'translate-x-0'}`}
                  />
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
        </main>
      </div>
    </div>
  );
};

export default NotificationSettings;
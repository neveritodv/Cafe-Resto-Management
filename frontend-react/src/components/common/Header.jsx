import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FiBell, FiRefreshCw, FiUser, FiSettings, FiLogOut, FiChevronDown } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { orders, stock } from '../../api/endpoints';
import toast from 'react-hot-toast';

const Header = ({ title, onRefresh }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef(null);

  const [preferences, setPreferences] = useState({
    newOrders: true,
    lowStock: true,
    systemUpdates: true,
  });

  // Load preferences and saved notifications
  useEffect(() => {
    const savedPrefs = localStorage.getItem('notification_preferences');
    if (savedPrefs) {
      try { setPreferences(JSON.parse(savedPrefs)); } catch {}
    }
    const savedNotifs = localStorage.getItem('notifications');
    if (savedNotifs) {
      try { setNotifications(JSON.parse(savedNotifs)); } catch {}
    }
    const handleClear = () => {
      setNotifications([]);
      setUnreadCount(0);
    };
    window.addEventListener('notifications-cleared', handleClear);
    return () => window.removeEventListener('notifications-cleared', handleClear);
  }, []);

  // Count unread
  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  // Fetch notifications with deduplication and save to localStorage
  const fetchNotifications = async () => {
    if (!preferences.newOrders && !preferences.lowStock && !preferences.systemUpdates) return;

    try {
      const newNotifications = [];

      if (preferences.newOrders) {
        const ordersRes = await orders.getAll({ limit: 5 });
        const recentOrders = ordersRes.data.data || [];
        recentOrders.forEach(order => {
          const id = `order-${order.id}`;
          if (!notifications.some(n => n.id === id)) {
            newNotifications.push({
              id,
              type: 'new_order',
              message: `Nouvelle commande #${order.order_number}`,
              time: order.ordered_at,
              read: false,
              data: order,
            });
          }
        });
      }

      if (preferences.lowStock) {
        const stockRes = await stock.getAlerts();
        const lowStockItems = stockRes.data || [];
        lowStockItems.forEach(product => {
          const id = `stock-${product.id}`;
          if (!notifications.some(n => n.id === id)) {
            newNotifications.push({
              id,
              type: 'low_stock',
              message: `Stock critique : ${product.name} (${product.stock_quantity})`,
              time: new Date().toISOString(),
              read: false,
              data: product,
            });
          }
        });
      }

      if (newNotifications.length > 0) {
        setNotifications(prev => {
          const combined = [...newNotifications, ...prev];
          const limited = combined.slice(0, 50);
          localStorage.setItem('notifications', JSON.stringify(limited));
          return limited;
        });
        const first = newNotifications[0];
        toast.success(first.message);
      }
    } catch (error) {
      console.error('Error fetching notifications', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, 30000);
    return () => clearInterval(intervalRef.current);
  }, [preferences]);

  const markAsRead = (id) => {
    setNotifications(prev => {
      const updated = prev.map(n => (n.id === id ? { ...n, read: true } : n));
      localStorage.setItem('notifications', JSON.stringify(updated));
      return updated;
    });
  };

  const markAllAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      localStorage.setItem('notifications', JSON.stringify(updated));
      return updated;
    });
    toast.success('Toutes les notifications marquées comme lues');
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    localStorage.removeItem('notifications');
    window.dispatchEvent(new Event('notifications-cleared'));
    toast.success('Toutes les notifications supprimées');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const formatTime = (iso) => {
    const diff = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours} h`;
    const days = Math.floor(hours / 24);
    return `Il y a ${days} j`;
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/60 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <img src="/logo.png" alt="RestauFlow" className="h-8 w-auto" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {onRefresh && (
          <button
            onClick={() => { onRefresh(); fetchNotifications(); }}
            className="p-2 text-gray-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all"
          >
            <FiRefreshCw className="text-xl" />
          </button>
        )}

        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-gray-500 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all relative"
          >
            <FiBell className="text-xl" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="font-semibold text-gray-800">Notifications</span>
                {notifications.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Tout lire
                    </button>
                    <button
                      onClick={clearAllNotifications}
                      className="text-xs text-red-600 hover:text-red-800 font-medium"
                    >
                      Tout supprimer
                    </button>
                  </div>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-400 text-sm">Aucune notification</div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${!n.read ? 'bg-indigo-50/50' : ''}`}
                      onClick={() => markAsRead(n.id)}
                    >
                      <p className="text-sm text-gray-700">{n.message}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-400">{formatTime(n.time)}</span>
                        {n.type === 'new_order' && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Commande</span>
                        )}
                        {n.type === 'low_stock' && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Stock</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 pl-4 border-l border-gray-200 focus:outline-none"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm shadow-md overflow-hidden">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                getInitials(user?.name)
              )}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-700">{user?.name}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>
            <FiChevronDown className="text-gray-400 text-sm" />
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="font-medium text-gray-800">{user?.name}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>
              <div className="py-1">
                <Link
                  to="/admin/profile"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 transition-colors"
                  onClick={() => setShowDropdown(false)}
                >
                  <FiUser className="text-gray-400" /> Profil
                </Link>
                <Link
                  to="/admin/notifications"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 transition-colors"
                  onClick={() => setShowDropdown(false)}
                >
                  <FiBell className="text-gray-400" /> Notifications
                </Link>
                <Link
                  to="/admin/settings"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 transition-colors"
                  onClick={() => setShowDropdown(false)}
                >
                  <FiSettings className="text-gray-400" /> Paramètres
                </Link>
                <hr className="my-1 border-gray-100" />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                >
                  <FiLogOut className="text-red-500" /> Déconnexion
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiBell, FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { orders } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const CustomerNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await orders.getAll();
        const myOrders = res.data.data.filter(o => o.user_id === user?.id);
        const notifs = myOrders.map(order => ({
          id: order.id,
          title: `Commande #${order.order_number}`,
          message: `Statut: ${order.status_label}`,
          time: order.ordered_at,
          status: order.status,
        }));
        setNotifications(notifs.sort((a, b) => new Date(b.time) - new Date(a.time)));
      } catch (error) {
        toast.error('Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchOrders();
  }, [user]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return <FiCheckCircle className="text-green-500" />;
      case 'cancelled': return <FiXCircle className="text-red-500" />;
      default: return <FiClock className="text-yellow-500" />;
    }
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

  if (loading) return <div className="p-8 text-center">Chargement...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <Link to="/" className="inline-flex items-center gap-2 text-indigo-600 hover:underline mb-6">
          <FiArrowLeft /> Retour au menu
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <FiBell /> Notifications
        </h1>
        {notifications.length === 0 ? (
          <p className="text-gray-400 text-center py-8">Aucune notification</p>
        ) : (
          <div className="space-y-3">
            {notifications.map(n => (
              <div key={n.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                {getStatusIcon(n.status)}
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{n.title}</p>
                  <p className="text-sm text-gray-500">{n.message}</p>
                </div>
                <span className="text-xs text-gray-400">{formatTime(n.time)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerNotifications;
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiUser, FiMail, FiShield } from 'react-icons/fi';

const CustomerProfile = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Veuillez vous connecter</p>
          <Link to="/login" className="text-indigo-600 hover:underline">Se connecter</Link>
        </div>
      </div>
    );
  }

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const getRoleLabel = (role) => {
    const roles = {
      admin: 'Administrateur',
      manager: 'Gestionnaire',
      customer: 'Client',
      user: 'Client'
    };
    return roles[role] || role;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 transition-colors mb-6">
          <FiArrowLeft /> Retour au menu
        </Link>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Mon compte</h1>
          
          <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl shadow-md">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover rounded-full" />
              ) : (
                getInitials(user?.name)
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-lg">{user?.name}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <FiUser className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Nom complet</p>
                <p className="font-medium text-gray-800">{user?.name || 'Non défini'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <FiMail className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="font-medium text-gray-800">{user?.email || 'Non défini'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <FiShield className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Rôle</p>
                <p className="font-medium text-gray-800 capitalize">{getRoleLabel(user?.role)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;
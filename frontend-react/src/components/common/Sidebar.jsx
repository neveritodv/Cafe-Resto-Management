import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiHome, FiCoffee, FiShoppingCart, FiPackage, FiBarChart2 } from 'react-icons/fi';

const Sidebar = () => {
  const menuItems = [
    { path: '/admin', icon: FiHome, label: 'Tableau de bord' },
    { path: '/admin/menu', icon: FiCoffee, label: 'Menu' },
    { path: '/admin/orders', icon: FiShoppingCart, label: 'Commandes' },
    { path: '/admin/stock', icon: FiPackage, label: 'Stock' },
    { path: '/admin/reports', icon: FiBarChart2, label: 'Rapports' },
  ];

  return (
    <div className="h-screen w-64 bg-gradient-to-b from-indigo-900 to-indigo-800 text-white flex flex-col shadow-2xl fixed left-0 top-0">
      {/* Brand – logo only, centered and larger */}
      <div className="p-6 border-b border-indigo-700/50 flex justify-center">
        <img src="/logo.png" alt="RestauFlow" className="h-30 w-auto object-contain" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => {
                const base = 'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200';
                const active = 'bg-indigo-700/80 shadow-lg border border-indigo-500/30 text-white';
                const inactive = 'text-indigo-200 hover:bg-white/10 hover:text-white';
                return `${base} ${isActive ? active : inactive}`;
              }}
            >
              <Icon className="text-xl" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer – removed version and online status */}
      <div className="p-4 border-t border-indigo-700/50">
        {/* empty – nothing here */}
      </div>
    </div>
  );
};

export default Sidebar;
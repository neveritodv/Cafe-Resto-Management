import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiLogIn, FiUser, FiLogOut, FiChevronDown, FiSettings, FiBell, FiX, FiMinus, FiPlus, FiPrinter, FiCheck } from 'react-icons/fi';
import { products } from '../api/endpoints';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const CustomerMenu = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Order options
  const [orderType, setOrderType] = useState('dine_in');
  const [tableNumber, setTableNumber] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);

  // Login popup state
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  const isLoggedIn = !!user;

  // --- Customer Notifications ---
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    products.getAll({ active: true })
      .then(res => {
        const data = res.data?.data || res.data || [];
        setItems(data);
        const cats = [...new Set(data.map(p => p.category?.name).filter(Boolean))];
        setCategories(cats);
        setLoading(false);
      })
      .catch(() => {
        toast.error('Erreur de chargement du menu');
        setLoading(false);
      });
  }, []);

  // Load notifications from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('customer_notifications');
    if (saved) {
      try { setNotifications(JSON.parse(saved)); } catch {}
    }
  }, []);

  // Update unread count
  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  const markAsRead = (id) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      localStorage.setItem('customer_notifications', JSON.stringify(updated));
      return updated;
    });
  };

  const markAllAsRead = () => {
    if (notifications.length === 0) {
      toast.error('Aucune notification à lire');
      return;
    }
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      localStorage.setItem('customer_notifications', JSON.stringify(updated));
      return updated;
    });
    toast.success('Toutes les notifications marquées comme lues');
  };

  const clearAllNotifications = () => {
    if (notifications.length === 0) {
      toast.error('Aucune notification à supprimer');
      return;
    }
    setNotifications([]);
    localStorage.removeItem('customer_notifications');
    toast.success('Toutes les notifications supprimées');
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addToCart = (product) => {
    if (!isLoggedIn) {
      setShowLoginPopup(true);
      return;
    }
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    toast.success(`${product.name} ajouté au panier`);
  };

  const handleCartClick = () => {
    if (!isLoggedIn) {
      setShowLoginPopup(true);
      return;
    }
    setShowCart(true);
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, delta) => {
    setCart(cart.map(item =>
      item.id === productId
        ? { ...item, quantity: Math.max(1, item.quantity + delta) }
        : item
    ));
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const submitOrder = async () => {
    if (!isLoggedIn) {
      setShowLoginPopup(true);
      return;
    }
    if (cart.length === 0) {
      toast.error('Votre panier est vide');
      return;
    }
    if (orderType === 'dine_in' && !tableNumber) {
      toast.error('Veuillez entrer votre numéro de table');
      return;
    }

    const orderData = {
      type: orderType,
      payment_method: 'cash',
      items: cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
      })),
      notes: orderType === 'dine_in' ? `Table ${tableNumber}` : orderType === 'takeaway' ? 'À emporter' : 'Livraison',
    };

    try {
      const res = await api.post('/guest/order', orderData);
      toast.success(`Commande #${res.data.order_number} envoyée !`);
      
      setLastOrder({
        order_number: res.data.order_number,
        items: cart.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
        })),
        total: getTotal(),
        type: orderType,
        table: tableNumber,
      });
      
      setShowCart(false);
      setShowConfirmation(true);
      setCart([]);
      setTableNumber('');
    } catch (error) {
      const msg = error.response?.data?.message || 'Erreur lors de la commande';
      toast.error(msg);
    }
  };

  const handleLogout = async () => {
    await logout();
    setDropdownOpen(false);
    navigate('/');
  };

  const filteredItems = selectedCategory
    ? items.filter(item => item.category?.name === selectedCategory)
    : items;

  const redirectParam = encodeURIComponent(window.location.pathname);

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const formatTime = (iso) => {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours} h`;
    const days = Math.floor(hours / 24);
    return `Il y a ${days} j`;
  };

  const getOrderTypeLabel = (type) => {
    const labels = {
      dine_in: 'Sur place',
      takeaway: 'À emporter',
      delivery: 'Livraison'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500">Chargement du menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10 border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="RestauFlow" className="h-9 w-auto" />
            <h1 className="text-xl font-bold text-gray-800">RestauFlow</h1>
          </Link>

          <div className="flex items-center gap-4">
            {!isLoggedIn ? (
              <Link to={`/login?redirect=${redirectParam}`} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition shadow-md hover:shadow-lg">
                Se connecter
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                {/* Notification Bell */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-gray-600 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50"
                  >
                    <FiBell className="text-2xl" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <span className="font-semibold text-gray-800">Notifications</span>
                        <div className="flex gap-2">
                          {notifications.length > 0 && (
                            <>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAllAsRead();
                                }} 
                                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                              >
                                Tout lire
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  clearAllNotifications();
                                }} 
                                className="text-xs text-red-600 hover:text-red-800 font-medium"
                              >
                                Tout supprimer
                              </button>
                            </>
                          )}
                        </div>
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
                              <span className="text-xs text-gray-400">{formatTime(n.time)}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Cart button */}
                <button
                  onClick={handleCartClick}
                  className="relative p-2 text-gray-600 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50"
                >
                  <FiShoppingCart className="text-2xl" />
                  {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                      {cart.length}
                    </span>
                  )}
                </button>

                {/* Avatar dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-2 focus:outline-none hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm shadow-md overflow-hidden">
                      {user?.avatar_url ? (
                        <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover rounded-full" />
                      ) : (
                        getInitials(user?.name)
                      )}
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-gray-700">{user?.name}</span>
                    <FiChevronDown className={`text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="font-medium text-gray-800 truncate">{user?.name}</p>
                        <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                      </div>
                      <div className="py-1">
                        <Link to="/profile" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 transition-colors" onClick={() => setDropdownOpen(false)}>
                          <FiUser className="text-gray-400" /> Mon compte
                        </Link>
                        <Link to="/customer/settings" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 transition-colors" onClick={() => setDropdownOpen(false)}>
                          <FiSettings className="text-gray-400" /> Paramètres
                        </Link>
                        <hr className="my-1 border-gray-100" />
                        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left">
                          <FiLogOut className="text-red-500" /> Déconnexion
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-2 mb-8">
          <button onClick={() => setSelectedCategory('')} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === '' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Tous</button>
          {categories.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === cat ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>{cat}</button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredItems.map(product => {
            const imageUrl = product.image_url || product.image ? `http://localhost:8000/storage/${product.image}` : null;
            return (
              <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col h-full">
                <div className="aspect-w-1 aspect-h-1 bg-gray-200">
                  {imageUrl ? (
                    <img src={imageUrl} alt={product.name} className="w-full h-48 object-cover" />
                  ) : (
                    <div className="w-full h-48 flex items-center justify-center text-gray-400 text-sm">Pas d'image</div>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-semibold text-gray-800">{product.name}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2 flex-1">{product.description || 'Délicieux plat'}</p>
                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-lg font-bold text-indigo-600">
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(product.price)}
                    </span>
                    <button
                      onClick={() => addToCart(product)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg whitespace-nowrap"
                    >
                      Ajouter
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {filteredItems.length === 0 && (
          <div className="text-center py-16 text-gray-500">Aucun produit disponible dans cette catégorie.</div>
        )}
      </main>

      {/* Login Popup Modal */}
      {showLoginPopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all animate-slideUp">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-5">
                <FiLogIn className="text-3xl text-indigo-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Connexion requise</h3>
              <p className="text-gray-500 text-sm mb-6">
                Connectez-vous pour ajouter des produits au panier et passer commande.
              </p>
              <div className="flex flex-col gap-3">
                <Link
                  to={`/login?redirect=${redirectParam}`}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition shadow-md hover:shadow-lg"
                >
                  Se connecter
                </Link>
                <button
                  onClick={() => setShowLoginPopup(false)}
                  className="w-full py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition text-gray-600 font-medium"
                >
                  Continuer sans commander
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart drawer with order options */}
      {showCart && isLoggedIn && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-800">Votre panier</h2>
              <button onClick={() => setShowCart(false)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                <FiX className="text-xl" />
              </button>
            </div>
            <div className="p-6">
              {cart.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Votre panier est vide</p>
              ) : (
                <>
                  {/* Order Type Selection */}
                  <div className="mb-4 space-y-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setOrderType('dine_in')}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          orderType === 'dine_in' 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Sur place
                      </button>
                      <button
                        onClick={() => setOrderType('takeaway')}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          orderType === 'takeaway' 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        À emporter
                      </button>
                      <button
                        onClick={() => setOrderType('delivery')}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          orderType === 'delivery' 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        Livraison
                      </button>
                    </div>

                    {orderType === 'dine_in' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de table</label>
                        <input
                          type="number"
                          value={tableNumber}
                          onChange={(e) => setTableNumber(e.target.value)}
                          placeholder="Entrez votre numéro de table"
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 max-h-60 overflow-y-auto">
                    {cart.map(item => {
                      const imageUrl = item.image_url || item.image ? `http://localhost:8000/storage/${item.image}` : null;
                      return (
                        <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                          {imageUrl ? (
                            <img src={imageUrl} alt={item.name} className="w-16 h-16 object-cover rounded-lg bg-gray-200" />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400 text-xs">Pas d'image</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-800 truncate">{item.name}</h4>
                            <p className="text-sm text-gray-500">
                              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.price)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateQuantity(item.id, -1)} className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"><FiMinus className="text-sm" /></button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"><FiPlus className="text-sm" /></button>
                          </div>
                          <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700 transition-colors"><FiX /></button>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-indigo-600">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(getTotal())}</span>
                    </div>
                    <button 
                      onClick={submitOrder} 
                      className="w-full mt-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-md hover:shadow-lg"
                    >
                      Commander {orderType === 'dine_in' && tableNumber ? `(Table ${tableNumber})` : ''}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Order Confirmation Modal */}
      {showConfirmation && lastOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 transform transition-all animate-slideUp">
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <FiCheck className="text-4xl text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">Commande confirmée !</h3>
              <p className="text-gray-500">Votre commande a été envoyée avec succès</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">N° commande</span>
                <span className="font-semibold text-gray-800">#{lastOrder.order_number}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Type</span>
                <span className="font-semibold text-gray-800">{getOrderTypeLabel(lastOrder.type)}</span>
              </div>
              {lastOrder.table && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Table</span>
                  <span className="font-semibold text-gray-800">{lastOrder.table}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2 mt-2">
                {lastOrder.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm py-1">
                    <span className="text-gray-600">{item.name} × {item.quantity}</span>
                    <span className="font-medium">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(item.total)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-indigo-600">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(lastOrder.total)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmation(false);
                  setLastOrder(null);
                }}
                className="flex-1 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition text-gray-600 font-medium"
              >
                Continuer
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default CustomerMenu;
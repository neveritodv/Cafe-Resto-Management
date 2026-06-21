import React, { useState, useEffect } from 'react';
import { FiShoppingCart, FiPlus, FiMinus, FiX, FiCheck, FiPrinter } from 'react-icons/fi';
import { products } from '../api/endpoints';
import api from '../api/axios';
import toast from 'react-hot-toast';

const CustomerMenu = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [orderType, setOrderType] = useState('dine_in');
  const [tableNumber, setTableNumber] = useState('');

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productsRes = await products.getAll({ active: true });
        const allItems = productsRes.data.data || [];
        setItems(allItems);
        const cats = [...new Set(allItems.map(p => p.category?.name).filter(Boolean))];
        setCategories(cats);
      } catch (error) {
        toast.error('Erreur de chargement du menu');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const addToCart = (product) => {
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
      notes: orderType === 'dine_in' ? `Table ${tableNumber}` : '',
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

  const closeConfirmation = () => {
    setShowConfirmation(false);
    setLastOrder(null);
  };

  const filteredItems = selectedCategory
    ? items.filter(item => item.category?.name === selectedCategory)
    : items;

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
      <header className="bg-white shadow-sm sticky top-0 z-10 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="RestauFlow" className="h-10 w-auto object-contain" />
            <h1 className="text-2xl font-bold text-gray-800">RestauFlow</h1>
          </div>
          <button
            onClick={() => setShowCart(true)}
            className="relative p-2 text-gray-600 hover:text-indigo-600 transition-colors"
          >
            <FiShoppingCart className="text-2xl" />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === '' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Tous
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredItems.map(product => (
            <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-w-1 aspect-h-1 bg-gray-200">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-48 object-cover" />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
                    Pas d'image
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-800">{product.name}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{product.description || 'Délicieux plat'}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-lg font-bold text-indigo-600">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(product.price)}
                  </span>
                  <button
                    onClick={() => addToCart(product)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg"
                  >
                    Ajouter
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {filteredItems.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            Aucun produit disponible dans cette catégorie.
          </div>
        )}
      </main>

      {/* Cart drawer and confirmation modal remain identical - omitted for brevity but you already have them */}
    </div>
  );
};

export default CustomerMenu;
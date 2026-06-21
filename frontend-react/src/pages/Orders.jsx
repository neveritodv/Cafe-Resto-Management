import React, { useState, useEffect } from 'react';
import { FiPlus, FiSearch, FiCamera, FiPrinter, FiX, FiCheck, FiClock } from 'react-icons/fi';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';
import Modal from '../components/common/Modal';
import QRScanner from '../components/orders/QRScanner';
import { orders, products } from '../api/endpoints';
import toast from 'react-hot-toast';

const Orders = () => {
  const [orderList, setOrderList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [orderForm, setOrderForm] = useState({
    type: 'dine_in',
    payment_method: 'cash',
    items: [],
    discount: 0,
    paid_amount: 0,
    notes: '',
  });
  const [productSearch, setProductSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [allProducts, setAllProducts] = useState([]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await orders.getAll({ status: statusFilter || undefined });
      setOrderList(res.data.data || []);
    } catch (error) {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await products.getAll({ active: true });
      setAllProducts(res.data.data || []);
    } catch (error) {
      console.error('Erreur chargement produits');
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, [statusFilter]);

  const handleSearchProduct = (query) => {
    setProductSearch(query);
    if (query.length > 1) {
      const results = allProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.sku?.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(results.slice(0, 10));
    } else {
      setSearchResults([]);
    }
  };

  const addItemToOrder = (product) => {
    const existing = orderForm.items.find((item) => item.product_id === product.id);
    if (existing) {
      setOrderForm({
        ...orderForm,
        items: orderForm.items.map((item) =>
          item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        ),
      });
    } else {
      setOrderForm({
        ...orderForm,
        items: [
          ...orderForm.items,
          {
            product_id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            total: product.price,
          },
        ],
      });
    }
    setProductSearch('');
    setSearchResults([]);
  };

  const removeItem = (index) => {
    setOrderForm({ ...orderForm, items: orderForm.items.filter((_, i) => i !== index) });
  };

  const updateQuantity = (index, delta) => {
    const newItems = [...orderForm.items];
    newItems[index].quantity = Math.max(1, newItems[index].quantity + delta);
    newItems[index].total = newItems[index].quantity * newItems[index].price;
    setOrderForm({ ...orderForm, items: newItems });
  };

  const calculateTotals = () => {
    const subtotal = orderForm.items.reduce((sum, item) => sum + item.total, 0);
    const discount = parseFloat(orderForm.discount) || 0;
    const tax = (subtotal - discount) * 0.10;
    const total = subtotal - discount + tax;
    return { subtotal, discount, tax, total };
  };

  const handleSubmitOrder = async () => {
    if (orderForm.items.length === 0) {
      toast.error('Ajoutez au moins un produit');
      return;
    }
    const { subtotal, discount, tax, total } = calculateTotals();
    const data = {
      type: orderForm.type,
      payment_method: orderForm.payment_method,
      items: orderForm.items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
      })),
      discount: discount,
      paid_amount: parseFloat(orderForm.paid_amount) || 0,
      notes: orderForm.notes,
    };
    try {
      const res = await orders.create(data);
      toast.success(`Commande #${res.data.order_number} créée !`);
      setModalOpen(false);
      setOrderForm({
        type: 'dine_in',
        payment_method: 'cash',
        items: [],
        discount: 0,
        paid_amount: 0,
        notes: '',
      });
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur');
    }
  };

  const updateOrderStatus = async (id, status) => {
    try {
      await orders.updateStatus(id, status);
      toast.success('Statut mis à jour');
      fetchOrders();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const printInvoice = async (id) => {
    try {
      const res = await orders.invoice(id);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      toast.error('Erreur lors de la génération de la facture');
    }
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

  const getStatusColor = (status) =>
    ({
      pending: 'bg-yellow-100 text-yellow-700',
      preparing: 'bg-blue-100 text-blue-700',
      ready: 'bg-green-100 text-green-700',
      served: 'bg-indigo-100 text-indigo-700',
      paid: 'bg-emerald-100 text-emerald-700',
      cancelled: 'bg-red-100 text-red-700',
    }[status] || 'bg-gray-100 text-gray-700');

  if (loading) return <div className="ml-64 flex items-center justify-center h-screen"><div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin"></div></div>;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 overflow-y-auto">
        <Header title="Commandes" onRefresh={fetchOrders} />
        <main className="p-8">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="preparing">En préparation</option>
                <option value="ready">Prêt</option>
                <option value="served">Servi</option>
                <option value="paid">Payé</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setQrModalOpen(true)}
                className="px-6 py-2.5 bg-indigo-100 text-indigo-700 rounded-xl font-medium hover:bg-indigo-200 transition-all flex items-center gap-2"
              >
                <FiCamera /> Scanner QR
              </button>
              <button
                onClick={() => {
                  setOrderForm({
                    type: 'dine_in',
                    payment_method: 'cash',
                    items: [],
                    discount: 0,
                    paid_amount: 0,
                    notes: '',
                  });
                  setModalOpen(true);
                }}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2"
              >
                <FiPlus /> Nouvelle commande
              </button>
            </div>
          </div>

          {/* Tableau des commandes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N°</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paiement</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orderList.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-800">{order.order_number}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 capitalize">{order.type}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-3 py-1 rounded-full ${getStatusColor(order.status)}`}>
                          {order.status_label}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-800">{formatCurrency(order.total)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 capitalize">{order.payment_method}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(order.ordered_at).toLocaleString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => printInvoice(order.id)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all"
                            title="Facture"
                          >
                            <FiPrinter />
                          </button>
                          {order.status !== 'paid' && order.status !== 'cancelled' && (
                            <>
                              <button
                                onClick={() => {
                                  const statusMap = {
                                    pending: 'preparing',
                                    preparing: 'ready',
                                    ready: 'served',
                                    served: 'paid',
                                  };
                                  updateOrderStatus(order.id, statusMap[order.status] || 'paid');
                                }}
                                className="p-1.5 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50 transition-all"
                                title="Avancer"
                              >
                                <FiCheck />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Annuler cette commande ?')) {
                                    orders.cancel(order.id).then(() => {
                                      toast.success('Commande annulée');
                                      fetchOrders();
                                    });
                                  }
                                }}
                                className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all"
                                title="Annuler"
                              >
                                <FiX />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {orderList.length === 0 && (
              <div className="text-center py-12 text-gray-400">Aucune commande</div>
            )}
          </div>
        </main>
      </div>

      {/* Modal Nouvelle commande */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nouvelle commande" size="xl">
        <div className="space-y-6">
          {/* Type & Paiement */}
          <div className="flex gap-4">
            <select
              value={orderForm.type}
              onChange={(e) => setOrderForm({ ...orderForm, type: e.target.value })}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="dine_in">Sur place</option>
              <option value="takeaway">À emporter</option>
              <option value="delivery">Livraison</option>
            </select>
            <select
              value={orderForm.payment_method}
              onChange={(e) => setOrderForm({ ...orderForm, payment_method: e.target.value })}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="cash">Espèces</option>
              <option value="card">Carte bancaire</option>
              <option value="qr">QR Code</option>
            </select>
          </div>

          {/* Recherche produit */}
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={productSearch}
              onChange={(e) => handleSearchProduct(e.target.value)}
              placeholder="Rechercher un produit..."
              className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchResults.length > 0 && (
              <div className="absolute z-20 mt-1 w-full bg-white rounded-xl shadow-lg border border-gray-100 max-h-48 overflow-y-auto">
                {searchResults.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addItemToOrder(product)}
                    className="w-full px-4 py-2.5 text-left hover:bg-indigo-50 transition-colors flex items-center justify-between"
                  >
                    <span>{product.name}</span>
                    <span className="text-sm text-gray-500">{formatCurrency(product.price)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Liste des articles */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Produit</th>
                  <th className="px-4 py-2 text-center text-sm font-medium text-gray-600">Qté</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Prix</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Total</th>
                  <th className="px-4 py-2 text-center text-sm font-medium text-gray-600"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orderForm.items.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-400">
                      Aucun produit ajouté
                    </td>
                  </tr>
                ) : (
                  orderForm.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm">{item.name}</td>
                      <td className="px-4 py-2 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => updateQuantity(index, -1)}
                            className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center"
                          >
                            -
                          </button>
                          <span className="w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(index, 1)}
                            className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right text-sm">{formatCurrency(item.price)}</td>
                      <td className="px-4 py-2 text-right text-sm font-medium">{formatCurrency(item.total)}</td>
                      <td className="px-4 py-2 text-center">
                        <button onClick={() => removeItem(index)} className="text-red-400 hover:text-red-600">
                          <FiX />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Résumé */}
          <div className="flex flex-col items-end gap-2 bg-gray-50 p-4 rounded-xl">
            <div className="flex justify-between w-64">
              <span>Sous-total</span>
              <span>{formatCurrency(calculateTotals().subtotal)}</span>
            </div>
            <div className="flex justify-between w-64">
              <span>Réduction</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={orderForm.discount}
                onChange={(e) => setOrderForm({ ...orderForm, discount: e.target.value })}
                className="w-24 text-right px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-between w-64 text-sm text-gray-500">
              <span>TVA (10%)</span>
              <span>{formatCurrency(calculateTotals().tax)}</span>
            </div>
            <div className="flex justify-between w-64 text-xl font-bold text-indigo-600 pt-2 border-t border-gray-200">
              <span>Total</span>
              <span>{formatCurrency(calculateTotals().total)}</span>
            </div>
            <div className="flex justify-between w-64 items-center mt-2">
              <span className="text-sm text-gray-600">Payé</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={orderForm.paid_amount}
                onChange={(e) => setOrderForm({ ...orderForm, paid_amount: e.target.value })}
                className="w-24 text-right px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="0"
              />
            </div>
            {parseFloat(orderForm.paid_amount) > 0 && (
              <div className="flex justify-between w-64 text-sm text-green-600">
                <span>Monnaie rendue</span>
                <span>
                  {formatCurrency(
                    Math.max(0, parseFloat(orderForm.paid_amount) - calculateTotals().total)
                  )}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={orderForm.notes}
              onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
              rows="2"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            onClick={handleSubmitOrder}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-lg shadow-indigo-500/25"
          >
            Valider la commande
          </button>
        </div>
      </Modal>

      {/* Modal QR Scanner */}
      <Modal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        title="Scanner un QR Code"
        size="md"
      >
        <QRScanner
          onScan={(qrData) => {
            // Extract QR code from URL or use directly
            let qrCode = qrData;
            const match = qrData.match(/\/products\/scan\/(.+)$/);
            if (match) qrCode = match[1];
            products
              .scan(qrCode)
              .then((res) => {
                toast.success(`Produit scanné: ${res.data.name}`);
                addItemToOrder(res.data);
                setQrModalOpen(false);
              })
              .catch(() => {
                toast.error('Produit non trouvé');
              });
          }}
          onClose={() => setQrModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default Orders;
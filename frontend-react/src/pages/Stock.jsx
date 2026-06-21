import React, { useState, useEffect } from 'react';
import { FiAlertTriangle, FiEdit2, FiPlus, FiMinus, FiRefreshCw } from 'react-icons/fi';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';
import Modal from '../components/common/Modal';
import { stock, products } from '../api/endpoints';
import toast from 'react-hot-toast';

const Stock = () => {
  const [alerts, setAlerts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [prods, setProds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editStock, setEditStock] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [alertsRes, movementsRes, productsRes] = await Promise.all([
        stock.getAlerts(),
        stock.getMovements({ limit: 50 }),
        products.getAll({ active: true }),
      ]);
      setAlerts(alertsRes.data);
      setMovements(movementsRes.data.data || []);
      setProds(productsRes.data.data || []);
    } catch (error) {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateStock = async (productId, quantity) => {
    if (quantity < 0) {
      toast.error('La quantité doit être positive');
      return;
    }
    try {
      await products.updateStock(productId, {
        quantity: Math.abs(parseInt(quantity)),
        type: parseInt(quantity) >= 0 ? 'in' : 'out',
        reason: 'Mise à jour manuelle',
      });
      toast.success('Stock mis à jour');
      setEditingProduct(null);
      setModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

  if (loading)
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 ml-64 flex items-center justify-center bg-gray-50">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
      </div>
    );

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 overflow-y-auto">
        <Header title="Gestion du Stock" onRefresh={fetchData} />
        <main className="p-8">
          {/* Alertes */}
          {alerts.length > 0 && (
            <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-5">
              <div className="flex items-center gap-3 text-red-700">
                <FiAlertTriangle className="text-2xl" />
                <h3 className="font-semibold">⚠️ Stock critique</h3>
                <span className="text-sm text-red-600">
                  {alerts.length} produit(s) nécessitent un réapprovisionnement
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {alerts.slice(0, 5).map((p) => (
                  <span
                    key={p.id}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"
                  >
                    {p.name} ({p.stock_quantity} / {p.min_stock_alert})
                  </span>
                ))}
                {alerts.length > 5 && (
                  <span className="text-sm text-red-500">+{alerts.length - 5} autres</span>
                )}
              </div>
            </div>
          )}

          {/* Tableau du stock */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
            <div className="p-4 border-b border-gray-100 font-semibold text-gray-800 flex items-center justify-between">
              <span>État du stock</span>
              <span className="text-sm text-gray-500">{prods.length} produits</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Produit</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Catégorie</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Stock</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Seuil</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Prix</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Statut</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {prods.map((p) => {
                    const isLow = p.stock_quantity <= p.min_stock_alert;
                    return (
                      <tr key={p.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {p.category?.name || '-'}
                        </td>
                        <td className="px-4 py-3 text-center font-medium">{p.stock_quantity}</td>
                        <td className="px-4 py-3 text-center text-sm text-gray-500">
                          {p.min_stock_alert}
                        </td>
                        <td className="px-4 py-3 text-right text-sm">{formatCurrency(p.price)}</td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`text-xs px-3 py-1 rounded-full ${
                              isLow ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {isLow ? 'Stock bas' : 'OK'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setEditStock(p.stock_quantity);
                              setModalOpen(true);
                            }}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          >
                            <FiEdit2 />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mouvements récents */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 font-semibold text-gray-800">
              Mouvements récents
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Produit</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Type</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Quantité</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Avant → Après</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Raison</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {movements.map((m) => (
                    <tr key={m.id}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-700">
                        {m.product?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            m.type === 'in'
                              ? 'bg-green-100 text-green-700'
                              : m.type === 'out'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {m.type === 'in' ? 'Entrée' : m.type === 'out' ? 'Sortie' : 'Ajustement'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-medium">{m.quantity}</td>
                      <td className="px-4 py-3 text-center text-sm">
                        {m.previous_quantity} → {m.new_quantity}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{m.reason || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(m.moved_at).toLocaleString('fr-FR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Modal modification stock */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingProduct(null);
        }}
        title="Mettre à jour le stock"
        size="sm"
      >
        {editingProduct && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Produit: <span className="font-medium text-gray-800">{editingProduct.name}</span>
            </p>
            <div className="flex items-center gap-4">
              <input
                type="number"
                value={editStock}
                onChange={(e) => setEditStock(parseInt(e.target.value) || 0)}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                min="0"
              />
            </div>
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => updateStock(editingProduct.id, editStock)}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all"
              >
                Enregistrer
              </button>
              <button
                onClick={() => {
                  setModalOpen(false);
                  setEditingProduct(null);
                }}
                className="px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Stock;
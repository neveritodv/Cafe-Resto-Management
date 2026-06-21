import React, { useState, useEffect, useRef } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiSave, FiUpload, FiImage, FiAlertTriangle } from 'react-icons/fi';
import Sidebar from '../components/common/Sidebar';
import Header from '../components/common/Header';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { categories, products } from '../api/endpoints';
import toast from 'react-hot-toast';

const Menu = () => {
  const [cats, setCats] = useState([]);
  const [prods, setProds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    cost_price: '',
    stock_quantity: '',
    min_stock_alert: 5,
    category_id: '',
    is_active: true,
    image: null,
    remove_image: false,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catsRes, prodsRes] = await Promise.all([
        categories.getAll(),
        products.getAll({ active: true }),
      ]);
      setCats(catsRes.data);
      setProds(prodsRes.data.data || []);
    } catch (error) {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      cost_price: '',
      stock_quantity: '',
      min_stock_alert: 5,
      category_id: cats[0]?.id || '',
      is_active: true,
      image: null,
      remove_image: false,
    });
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async (e) => {
    e.preventDefault();

    // ✅ Client-side validation
    if (!formData.name.trim()) {
      toast.error('Le nom est requis');
      return;
    }
    if (!formData.category_id) {
      toast.error('Veuillez sélectionner une catégorie');
      return;
    }
    if (!formData.price || parseFloat(formData.price) < 0) {
      toast.error('Veuillez entrer un prix valide');
      return;
    }

    try {
      const data = new FormData();
      data.append('name', formData.name.trim());
      data.append('description', formData.description || '');
      data.append('price', parseFloat(formData.price) || 0);
      data.append('cost_price', parseFloat(formData.cost_price) || 0);
      data.append('stock_quantity', parseInt(formData.stock_quantity) || 0);
      data.append('min_stock_alert', parseInt(formData.min_stock_alert) || 5);
      data.append('category_id', formData.category_id);
      data.append('is_active', formData.is_active ? '1' : '0');

      if (formData.image && formData.image instanceof File) {
        data.append('image', formData.image);
      }
      if (formData.remove_image) {
        data.append('remove_image', '1');
      }

      // ✅ Now the update method in endpoints.js will add _method if needed
      if (editingProduct) {
        await products.update(editingProduct.id, data);
        toast.success('Produit mis à jour');
      } else {
        await products.create(data);
        toast.success('Produit ajouté');
      }

      setModalOpen(false);
      setEditingProduct(null);
      resetForm();
      fetchData();
    } catch (error) {
      const errors = error.response?.data?.errors;
      if (errors) {
        const msg = Object.values(errors).flat().join(', ');
        toast.error(msg);
      } else {
        toast.error(error.response?.data?.message || 'Erreur');
      }
    }
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await products.delete(productToDelete.id);
      toast.success('Produit supprimé');
      fetchData();
    } catch (error) {
      toast.error('Erreur');
    } finally {
      setDeleteModalOpen(false);
      setProductToDelete(null);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      e.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('L\'image doit faire moins de 2 Mo');
      e.target.value = '';
      return;
    }
    setFormData({ ...formData, image: file, remove_image: false });
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setFormData({ ...formData, image: null, remove_image: true });
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredProds = prods.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !selectedCategory || p.category_id === parseInt(selectedCategory);
    return matchSearch && matchCategory;
  });

  const formatCurrency = (value) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-64 overflow-y-auto">
        <Header title="Gestion du Menu" onRefresh={fetchData} />
        <main className="p-8">
          {/* Search and filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Rechercher un produit..."
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">Toutes les catégories</option>
              {cats.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                setEditingProduct(null);
                resetForm();
                setModalOpen(true);
              }}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2"
            >
              <FiPlus /> Ajouter
            </button>
          </div>

          {/* Product grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProds.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200"
              >
                <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 flex items-center justify-center text-gray-400">
                      <FiImage className="text-4xl" />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <span
                        className="text-xs font-medium text-white px-2 py-1 rounded-full"
                        style={{ backgroundColor: product.category?.color || '#6366f1' }}
                      >
                        {product.category?.name || 'Non catégorisé'}
                      </span>
                      <h3 className="font-semibold text-gray-800 mt-2 text-lg">{product.name}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {product.description || 'Aucune description'}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setEditingProduct(product);
                          setFormData({
                            name: product.name,
                            description: product.description || '',
                            price: product.price,
                            cost_price: product.cost_price || '',
                            stock_quantity: product.stock_quantity,
                            min_stock_alert: product.min_stock_alert,
                            category_id: product.category_id,
                            is_active: product.is_active,
                            image: null,
                            remove_image: false,
                          });
                          setImagePreview(product.image_url || null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                          setModalOpen(true);
                        }}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(product)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-gray-800">
                        {formatCurrency(product.price)}
                      </span>
                      <span className="text-xs text-gray-400 block">Prix unitaire</span>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-sm font-medium ${
                          product.stock_quantity <= product.min_stock_alert
                            ? 'text-red-500'
                            : 'text-green-600'
                        }`}
                      >
                        Stock: {product.stock_quantity}
                      </span>
                      <span className="text-xs text-gray-400 block">Seuil: {product.min_stock_alert}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {filteredProds.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg">Aucun produit trouvé</p>
            </div>
          )}
        </main>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingProduct(null);
          setImagePreview(null);
        }}
        title={editingProduct ? 'Modifier le produit' : 'Ajouter un produit'}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {/* Image upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image du produit</label>
            <div className="flex items-center gap-4">
              <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-xl overflow-hidden flex items-center justify-center bg-gray-50 relative">
                {imagePreview ? (
                  <img src={imagePreview} alt="Aperçu" className="w-full h-full object-cover" />
                ) : (
                  <FiImage className="text-4xl text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg cursor-pointer hover:bg-indigo-100 transition-colors"
                >
                  <FiUpload /> Choisir une image
                </label>
                {imagePreview && (
                  <button
                    type="button"
                    onClick={removeImage}
                    className="ml-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <FiX className="inline" /> Supprimer
                  </button>
                )}
                <p className="text-xs text-gray-400 mt-1">Formats: JPG, PNG, GIF · Max 2 Mo</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              >
                <option value="">Sélectionner</option>
                {cats.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="2"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prix (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prix de revient (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.cost_price}
                onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock initial</label>
              <input
                type="number"
                min="0"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seuil d'alerte</label>
              <input
                type="number"
                min="1"
                value={formData.min_stock_alert}
                onChange={(e) => setFormData({ ...formData, min_stock_alert: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              Actif
            </label>
          </div>
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="submit"
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
            >
              <FiSave /> {editingProduct ? 'Mettre à jour' : 'Ajouter'}
            </button>
            <button
              type="button"
              onClick={() => {
                setModalOpen(false);
                setEditingProduct(null);
                setImagePreview(null);
              }}
              className="px-6 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2"
            >
              <FiX /> Annuler
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setProductToDelete(null);
        }}
        title="Confirmer la suppression"
        size="sm"
      >
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <FiAlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Supprimer ce produit ?
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Vous êtes sur le point de supprimer <strong className="text-gray-700">{productToDelete?.name}</strong>.
            Cette action est irréversible.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setDeleteModalOpen(false);
                setProductToDelete(null);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors shadow-md hover:shadow-lg"
            >
              Supprimer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Menu;
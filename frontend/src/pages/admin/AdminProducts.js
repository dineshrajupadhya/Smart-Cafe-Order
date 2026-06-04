import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', category: '', stock: '',
    preparationTime: '10', isVegetarian: false, spiceLevel: 'none',
    tags: '', isAvailable: true
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products?limit=100');
      setProducts(res.data.products);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.categories);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        price: Number(formData.price),
        stock: Number(formData.stock),
        preparationTime: Number(formData.preparationTime),
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, data);
        toast.success('Product updated!');
      } else {
        await api.post('/products', data);
        toast.success('Product created!');
      }
      setShowModal(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving product');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      category: product.category?._id || product.category,
      stock: product.stock,
      preparationTime: product.preparationTime || 10,
      isVegetarian: product.isVegetarian,
      spiceLevel: product.spiceLevel || 'none',
      tags: (product.tags || []).join(', '),
      isAvailable: product.isAvailable
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deactivated');
      fetchProducts();
    } catch (err) {
      toast.error('Error deleting product');
    }
  };

  const handleStockUpdate = async (id, stock) => {
    try {
      await api.put(`/products/${id}/stock`, { stock: Number(stock) });
      toast.success('Stock updated');
      fetchProducts();
    } catch (err) {
      toast.error('Error updating stock');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', description: '', price: '', category: '', stock: '',
      preparationTime: '10', isVegetarian: false, spiceLevel: 'none',
      tags: '', isAvailable: true
    });
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-dark-800">Products</h1>
        <button onClick={() => { resetForm(); setEditingProduct(null); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <FiPlus /> Add Product
        </button>
      </div>

      <div className="mb-4 relative">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10 max-w-md"
        />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-50">
              <tr>
                <th className="text-left py-3 px-4 text-dark-500 font-medium">Product</th>
                <th className="text-left py-3 px-4 text-dark-500 font-medium">Category</th>
                <th className="text-left py-3 px-4 text-dark-500 font-medium">Price</th>
                <th className="text-left py-3 px-4 text-dark-500 font-medium">Stock</th>
                <th className="text-left py-3 px-4 text-dark-500 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-dark-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => (
                <tr key={product._id} className="border-t hover:bg-dark-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-dark-100 rounded-lg flex items-center justify-center">
                        🍽️
                      </div>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        {product.isVegetarian && <span className="text-xs text-green-500">Veg</span>}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-dark-600">{product.category?.name || 'N/A'}</td>
                  <td className="py-3 px-4 font-medium">₹{product.price}</td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      value={product.stock}
                      onChange={(e) => handleStockUpdate(product._id, e.target.value)}
                      className="w-20 px-2 py-1 border rounded text-sm"
                      min="0"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <span className={`badge ${product.isAvailable ? 'badge-success' : 'badge-danger'}`}>
                      {product.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(product)} className="p-2 text-dark-400 hover:text-primary-500">
                        <FiEdit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(product._id)} className="p-2 text-dark-400 hover:text-red-500">
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">Name *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">Category *</label>
                  <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="input-field" required>
                    <option value="">Select Category</option>
                    {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">Price *</label>
                  <input type="number" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="input-field" min="0" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">Stock *</label>
                  <input type="number" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} className="input-field" min="0" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">Prep Time (min)</label>
                  <input type="number" value={formData.preparationTime} onChange={(e) => setFormData({...formData, preparationTime: e.target.value})} className="input-field" min="1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">Spice Level</label>
                  <select value={formData.spiceLevel} onChange={(e) => setFormData({...formData, spiceLevel: e.target.value})} className="input-field">
                    <option value="none">None</option>
                    <option value="mild">Mild</option>
                    <option value="medium">Medium</option>
                    <option value="hot">Hot</option>
                    <option value="very-hot">Very Hot</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="input-field h-20 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Tags (comma separated)</label>
                <input type="text" value={formData.tags} onChange={(e) => setFormData({...formData, tags: e.target.value})} className="input-field" placeholder="e.g., spicy, popular, indian" />
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.isVegetarian} onChange={(e) => setFormData({...formData, isVegetarian: e.target.checked})} className="rounded text-primary-500" />
                  <span className="text-sm">Vegetarian</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.isAvailable} onChange={(e) => setFormData({...formData, isAvailable: e.target.checked})} className="rounded text-primary-500" />
                  <span className="text-sm">Available</span>
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline">Cancel</button>
                <button type="submit" className="btn-primary">{editingProduct ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;

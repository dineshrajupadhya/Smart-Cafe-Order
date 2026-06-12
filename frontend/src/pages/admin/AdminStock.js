import React, { useState, useEffect } from 'react';
import { FiAlertTriangle, FiCheck, FiPackage } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminStock = () => {
  const [products, setProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stockValues, setStockValues] = useState({});

  useEffect(() => {
    fetchProducts();
    fetchLowStock();
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

  const fetchLowStock = async () => {
    try {
      const res = await api.get('/products/low-stock');
      setLowStockProducts(res.data.products);
    } catch (err) {
      console.error(err);
    }
  };

  const updateStock = async (productId, newStock) => {
    try {
      await api.put(`/products/${productId}/stock`, { stock: Number(newStock) });
      toast.success('Stock updated');
      fetchProducts();
      fetchLowStock();
    } catch (err) {
      toast.error('Failed to update stock');
    }
  };

  const getStockStatus = (product) => {
    if (product.stock === 0) return { label: 'Out of Stock', color: 'text-red-500', bg: 'bg-red-50' };
    if (product.stock <= product.lowStockThreshold) return { label: 'Low Stock', color: 'text-yellow-500', bg: 'bg-yellow-50' };
    return { label: 'In Stock', color: 'text-green-500', bg: 'bg-green-50' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-dark-800 mb-6">Stock Management</h1>

      {lowStockProducts.length > 0 && (
        <div className="card p-6 mb-6 border-l-4 border-yellow-500">
          <div className="flex items-center gap-3 mb-4">
            <FiAlertTriangle className="text-yellow-500" size={24} />
            <h2 className="text-lg font-semibold">Low Stock Alert ({lowStockProducts.length} items)</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStockProducts.map(product => {
              const lowVal = stockValues[product._id] !== undefined ? stockValues[product._id] : product.stock;
              return (
                <div key={product._id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <p className="font-medium text-dark-800">{product.name}</p>
                    <p className="text-sm text-yellow-600">Stock: {product.stock}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={lowVal}
                      onChange={(e) => setStockValues({...stockValues, [product._id]: e.target.value})}
                      className="w-20 px-2 py-1 border rounded text-sm"
                      min="0"
                    />
                    <button
                      onClick={() => updateStock(product._id, lowVal)}
                      className="p-1 text-green-500 hover:text-green-600"
                    >
                      <FiCheck size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-50">
              <tr>
                <th className="text-left py-3 px-4 text-dark-500 font-medium">Product</th>
                <th className="text-left py-3 px-4 text-dark-500 font-medium">Category</th>
                <th className="text-left py-3 px-4 text-dark-500 font-medium">Current Stock</th>
                <th className="text-left py-3 px-4 text-dark-500 font-medium">Threshold</th>
                <th className="text-left py-3 px-4 text-dark-500 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-dark-500 font-medium">Update Stock</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => {
                const status = getStockStatus(product);
                const currentVal = stockValues[product._id] !== undefined ? stockValues[product._id] : product.stock;
                return (
                  <tr key={product._id} className="border-t hover:bg-dark-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <FiPackage className="text-dark-400" />
                        <span className="font-medium">{product.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-dark-600">{product.category?.name || 'N/A'}</td>
                    <td className="py-3 px-4 font-medium">{product.stock}</td>
                    <td className="py-3 px-4 text-dark-500">{product.lowStockThreshold}</td>
                    <td className="py-3 px-4">
                      <span className={`badge ${status.bg} ${status.color}`}>{status.label}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={currentVal}
                          onChange={(e) => setStockValues({...stockValues, [product._id]: e.target.value})}
                          className="w-20 px-2 py-1 border rounded text-sm"
                          min="0"
                        />
                        <button
                          onClick={() => updateStock(product._id, currentVal)}
                          className="p-1 text-green-500 hover:text-green-600"
                        >
                          <FiCheck size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminStock;

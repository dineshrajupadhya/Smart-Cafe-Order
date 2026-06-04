import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState({
    code: '', description: '', discountType: 'percentage', discountValue: '',
    minOrderAmount: '', maxDiscountAmount: '', usageLimit: '',
    startDate: '', endDate: ''
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const res = await api.get('/coupons');
      setCoupons(res.data.coupons);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        discountValue: Number(formData.discountValue),
        minOrderAmount: Number(formData.minOrderAmount) || 0,
        maxDiscountAmount: Number(formData.maxDiscountAmount) || undefined,
        usageLimit: Number(formData.usageLimit) || undefined
      };

      if (editingCoupon) {
        await api.put(`/coupons/${editingCoupon._id}`, data);
        toast.success('Coupon updated!');
      } else {
        await api.post('/coupons', data);
        toast.success('Coupon created!');
      }
      setShowModal(false);
      setEditingCoupon(null);
      resetForm();
      fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving coupon');
    }
  };

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount || '',
      maxDiscountAmount: coupon.maxDiscountAmount || '',
      usageLimit: coupon.usageLimit || '',
      startDate: coupon.startDate ? coupon.startDate.slice(0, 10) : '',
      endDate: coupon.endDate ? coupon.endDate.slice(0, 10) : ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this coupon?')) return;
    try {
      await api.delete(`/coupons/${id}`);
      toast.success('Coupon deactivated');
      fetchCoupons();
    } catch (err) {
      toast.error('Error deleting coupon');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '', description: '', discountType: 'percentage', discountValue: '',
      minOrderAmount: '', maxDiscountAmount: '', usageLimit: '',
      startDate: '', endDate: ''
    });
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-dark-800">Coupons</h1>
        <button onClick={() => { resetForm(); setEditingCoupon(null); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <FiPlus /> Add Coupon
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-50">
              <tr>
                <th className="text-left py-3 px-4 text-dark-500 font-medium">Code</th>
                <th className="text-left py-3 px-4 text-dark-500 font-medium">Description</th>
                <th className="text-left py-3 px-4 text-dark-500 font-medium">Discount</th>
                <th className="text-left py-3 px-4 text-dark-500 font-medium">Min Order</th>
                <th className="text-left py-3 px-4 text-dark-500 font-medium">Usage</th>
                <th className="text-left py-3 px-4 text-dark-500 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-dark-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map(coupon => (
                <tr key={coupon._id} className="border-t hover:bg-dark-50">
                  <td className="py-3 px-4 font-mono font-bold text-primary-500">{coupon.code}</td>
                  <td className="py-3 px-4 text-dark-600">{coupon.description}</td>
                  <td className="py-3 px-4">
                    {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                  </td>
                  <td className="py-3 px-4">₹{coupon.minOrderAmount || 0}</td>
                  <td className="py-3 px-4">{coupon.usedCount || 0}/{coupon.usageLimit || '∞'}</td>
                  <td className="py-3 px-4">
                    <span className={`badge ${coupon.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(coupon)} className="p-2 text-dark-400 hover:text-primary-500">
                        <FiEdit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(coupon._id)} className="p-2 text-dark-400 hover:text-red-500">
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
          <div className="bg-white rounded-xl w-full max-w-lg">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">{editingCoupon ? 'Edit Coupon' : 'Add Coupon'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Code *</label>
                <input type="text" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})} className="input-field font-mono" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Description</label>
                <input type="text" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">Discount Type *</label>
                  <select value={formData.discountType} onChange={(e) => setFormData({...formData, discountType: e.target.value})} className="input-field">
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">Discount Value *</label>
                  <input type="number" value={formData.discountValue} onChange={(e) => setFormData({...formData, discountValue: e.target.value})} className="input-field" min="0" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">Min Order Amount</label>
                  <input type="number" value={formData.minOrderAmount} onChange={(e) => setFormData({...formData, minOrderAmount: e.target.value})} className="input-field" min="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">Max Discount</label>
                  <input type="number" value={formData.maxDiscountAmount} onChange={(e) => setFormData({...formData, maxDiscountAmount: e.target.value})} className="input-field" min="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">Usage Limit</label>
                  <input type="number" value={formData.usageLimit} onChange={(e) => setFormData({...formData, usageLimit: e.target.value})} className="input-field" min="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-1">End Date</label>
                  <input type="date" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} className="input-field" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline">Cancel</button>
                <button type="submit" className="btn-primary">{editingCoupon ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;

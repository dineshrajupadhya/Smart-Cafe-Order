import React, { useState, useEffect } from 'react';
import { FiUser, FiMail, FiPhone, FiSave } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    preferences: {
      favoriteCategories: [],
      dietaryRestrictions: [],
      spiceLevel: 'medium'
    }
  });
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalOrders: 0, totalSpent: 0 });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        preferences: user.preferences || { favoriteCategories: [], dietaryRestrictions: [], spiceLevel: 'medium' }
      });
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/orders/my-orders?limit=1000');
      const orders = res.data.orders;
      setStats({
        totalOrders: orders.length,
        totalSpent: orders.reduce((sum, o) => sum + o.totalAmount, 0)
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await updateProfile({
        name: formData.name,
        phone: formData.phone,
        preferences: formData.preferences
      });
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDietaryChange = (restriction) => {
    const current = formData.preferences.dietaryRestrictions || [];
    const updated = current.includes(restriction)
      ? current.filter(r => r !== restriction)
      : [...current, restriction];
    setFormData({
      ...formData,
      preferences: { ...formData.preferences, dietaryRestrictions: updated }
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-dark-800 mb-8">My Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6 text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <FiUser size={28} className="text-primary-500" />
          </div>
          <p className="text-2xl font-bold text-dark-800">{stats.totalOrders}</p>
          <p className="text-dark-500 text-sm">Total Orders</p>
        </div>
        <div className="card p-6 text-center">
          <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <FiMail size={28} className="text-secondary-500" />
          </div>
          <p className="text-2xl font-bold text-dark-800">₹{stats.totalSpent.toFixed(0)}</p>
          <p className="text-dark-500 text-sm">Total Spent</p>
        </div>
        <div className="card p-6 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <FiPhone size={28} className="text-yellow-500" />
          </div>
          <p className="text-2xl font-bold text-dark-800">{user?.role === 'admin' ? 'Admin' : 'Member'}</p>
          <p className="text-dark-500 text-sm">Account Type</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="input-field bg-dark-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Food Preferences</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-2">Spice Level</label>
                <select
                  value={formData.preferences.spiceLevel}
                  onChange={(e) => setFormData({
                    ...formData,
                    preferences: { ...formData.preferences, spiceLevel: e.target.value }
                  })}
                  className="input-field"
                >
                  <option value="mild">Mild</option>
                  <option value="medium">Medium</option>
                  <option value="hot">Hot</option>
                  <option value="very-hot">Very Hot</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-2">Dietary Restrictions</label>
                <div className="flex flex-wrap gap-2">
                  {['Vegetarian', 'Vegan', 'Gluten-Free', 'Nut-Free', 'Dairy-Free'].map(restriction => (
                    <button
                      key={restriction}
                      type="button"
                      onClick={() => handleDietaryChange(restriction)}
                      className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                        (formData.preferences.dietaryRestrictions || []).includes(restriction)
                          ? 'bg-primary-500 text-white border-primary-500'
                          : 'border-dark-200 text-dark-600 hover:border-primary-300'
                      }`}
                    >
                      {restriction}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            <FiSave size={18} />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;

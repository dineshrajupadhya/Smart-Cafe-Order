import React, { useState, useEffect } from 'react';
import { FiSearch, FiUserCheck, FiUserX } from 'react-icons/fi';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/toggle-active`);
      toast.success('User status updated');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update user');
    }
  };

  const updateRole = async (userId, role) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role });
      toast.success('User role updated');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update role');
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
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
      <h1 className="text-2xl font-bold text-dark-800 mb-6">Users</h1>

      <div className="mb-4 relative max-w-md">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-50">
              <tr>
                <th className="text-left py-3 px-4 text-dark-500 font-medium">User</th>
                <th className="text-left py-3 px-4 text-dark-500 font-medium">Email</th>
                <th className="text-left py-3 px-4 text-dark-500 font-medium">Phone</th>
                <th className="text-left py-3 px-4 text-dark-500 font-medium">Role</th>
                <th className="text-left py-3 px-4 text-dark-500 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-dark-500 font-medium">Joined</th>
                <th className="text-left py-3 px-4 text-dark-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user._id} className="border-t hover:bg-dark-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 font-medium text-sm">{user.name.charAt(0)}</span>
                      </div>
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-dark-600">{user.email}</td>
                  <td className="py-3 px-4 text-dark-600">{user.phone || '-'}</td>
                  <td className="py-3 px-4">
                    <select
                      value={user.role}
                      onChange={(e) => updateRole(user._id, e.target.value)}
                      className="text-sm border rounded px-2 py-1"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-dark-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => toggleActive(user._id)}
                      className={`p-2 ${user.isActive ? 'text-red-400 hover:text-red-600' : 'text-green-400 hover:text-green-600'}`}
                    >
                      {user.isActive ? <FiUserX size={16} /> : <FiUserCheck size={16} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;

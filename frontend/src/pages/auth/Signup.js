import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiPhone, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const Signup = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', phone: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password, confirmPassword, phone } = formData;

    if (!name || !email || !password) {
      toast.error('Please fill in all required fields');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      await register(name, email, password, phone);
      toast.success('Account created successfully!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: 'name', label: 'Full Name *', type: 'text', icon: FiUser, placeholder: 'Enter your name' },
    { name: 'email', label: 'Email *', type: 'email', icon: FiMail, placeholder: 'e.g., you@gmail.com, name@yahoo.in' },
    { name: 'phone', label: 'Phone', type: 'tel', icon: FiPhone, placeholder: 'Enter your phone number' },
    { name: 'password', label: 'Password *', type: 'password', icon: FiLock, placeholder: 'Create a password' },
    { name: 'confirmPassword', label: 'Confirm Password *', type: 'password', icon: FiLock, placeholder: 'Confirm your password' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700 p-4">
      <div className="w-full max-w-md">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          >
            <span className="text-primary-500 font-bold text-2xl">SC</span>
          </motion.div>
          <motion.h1
            className="text-3xl font-bold text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Create Account
          </motion.h1>
          <motion.p
            className="text-primary-100 mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Join Smart Cafe today
          </motion.p>
        </motion.div>

        <motion.div
          className="bg-white rounded-2xl shadow-xl p-8"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map((field, i) => {
              const Icon = field.icon;
              const isPassword = field.name === 'password' || field.name === 'confirmPassword';
              const show = isPassword && field.name === 'password' ? showPassword : isPassword;
              return (
                <motion.div
                  key={field.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.08 }}
                >
                  <label className="block text-sm font-medium text-dark-700 mb-1">{field.label}</label>
                  <div className="relative">
                    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                    <input
                      type={isPassword ? (showPassword ? 'text' : 'password') : field.type}
                      name={field.name}
                      value={formData[field.name]}
                      onChange={handleChange}
                      placeholder={field.placeholder}
                      className="input-field pl-10 pr-10"
                    />
                    {isPassword && field.name === 'password' && (
                      <motion.button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600"
                        whileTap={{ scale: 0.85 }}
                      >
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              );
            })}

            <motion.button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </motion.button>
          </form>

          <motion.div
            className="mt-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <p className="text-dark-500">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-500 font-medium hover:underline">
                Sign In
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Signup;

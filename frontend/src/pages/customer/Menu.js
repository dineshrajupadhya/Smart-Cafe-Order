import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiFilter, FiX } from 'react-icons/fi';
import api from '../../services/api';
import ProductCard from '../../components/ProductCard';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 }
  }
};

const Menu = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    minPrice: '',
    maxPrice: '',
    isVegetarian: '',
    spiceLevel: '',
    sort: 'popular'
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [filters, searchParams]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.categories);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.isVegetarian) params.append('isVegetarian', 'true');
      if (filters.spiceLevel) params.append('spiceLevel', filters.spiceLevel);
      if (filters.sort) params.append('sort', filters.sort);
      params.append('page', page);
      params.append('limit', 12);

      const res = await api.get(`/products?${params.toString()}`);
      setProducts(res.data.products);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '', category: '', minPrice: '', maxPrice: '',
      isVegetarian: '', spiceLevel: '', sort: 'popular'
    });
    setSearchParams({});
  };

  const hasActiveFilters = filters.category || filters.minPrice || filters.maxPrice || filters.isVegetarian || filters.spiceLevel;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.div
        className="flex flex-col md:flex-row gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <AnimatePresence>
          {showFilters && (
            <motion.aside
              initial={{ opacity: 0, x: -60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.3 }}
              className="md:w-64 flex-shrink-0 block md:hidden"
            >
              <FilterPanel
                filters={filters}
                categories={categories}
                hasActiveFilters={hasActiveFilters}
                onFilterChange={handleFilterChange}
                onClearFilters={clearFilters}
              />
            </motion.aside>
          )}
        </AnimatePresence>

        <aside className="md:w-64 flex-shrink-0 hidden md:block">
          <FilterPanel
            filters={filters}
            categories={categories}
            hasActiveFilters={hasActiveFilters}
            onFilterChange={handleFilterChange}
            onClearFilters={clearFilters}
          />
        </aside>

        <div className="flex-1">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
              <input
                type="text"
                placeholder="Search menu..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden btn-outline flex items-center gap-2"
            >
              <FiFilter /> Filters
            </button>
          </div>

          {hasActiveFilters && (
            <motion.div
              className="flex flex-wrap gap-2 mb-4"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              {filters.category && (
                <span className="badge badge-info flex items-center gap-1">
                  {categories.find(c => c._id === filters.category)?.name}
                  <FiX className="cursor-pointer" onClick={() => handleFilterChange('category', '')} />
                </span>
              )}
              {filters.isVegetarian === 'true' && (
                <span className="badge badge-success flex items-center gap-1">
                  Vegetarian
                  <FiX className="cursor-pointer" onClick={() => handleFilterChange('isVegetarian', '')} />
                </span>
              )}
            </motion.div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"
              />
            </div>
          ) : products.length === 0 ? (
            <motion.div
              className="text-center py-12"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-dark-500 text-lg">No products found</p>
              <button onClick={clearFilters} className="text-primary-500 hover:underline mt-2">Clear filters</button>
            </motion.div>
          ) : (
            <>
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                key={filters.category + filters.search + filters.sort}
              >
                {products.map(product => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </motion.div>

              {pagination.pages > 1 && (
                <motion.div
                  className="flex justify-center gap-2 mt-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                    <motion.button
                      key={page}
                      onClick={() => fetchProducts(page)}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-4 py-2 rounded-lg ${page === pagination.page ? 'bg-primary-500 text-white' : 'bg-white text-dark-600 hover:bg-dark-50'}`}
                    >
                      {page}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const FilterPanel = ({ filters, categories, hasActiveFilters, onFilterChange, onClearFilters }) => (
  <div className="card p-4 sticky top-24">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-semibold text-dark-800">Filters</h3>
      {hasActiveFilters && (
        <button onClick={onClearFilters} className="text-sm text-primary-500 hover:underline">Clear All</button>
      )}
    </div>
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-dark-700 mb-2">Category</label>
        <select
          value={filters.category}
          onChange={(e) => onFilterChange('category', e.target.value)}
          className="input-field text-sm"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat._id} value={cat._id}>{cat.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-dark-700 mb-2">Price Range</label>
        <div className="flex gap-2">
          <input type="number" placeholder="Min" value={filters.minPrice} onChange={(e) => onFilterChange('minPrice', e.target.value)} className="input-field text-sm" />
          <input type="number" placeholder="Max" value={filters.maxPrice} onChange={(e) => onFilterChange('maxPrice', e.target.value)} className="input-field text-sm" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-dark-700 mb-2">Dietary</label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.isVegetarian === 'true'}
            onChange={(e) => onFilterChange('isVegetarian', e.target.checked ? 'true' : '')}
            className="rounded text-primary-500"
          />
          <span className="text-sm text-dark-600">Vegetarian Only</span>
        </label>
      </div>
      <div>
        <label className="block text-sm font-medium text-dark-700 mb-2">Spice Level</label>
        <select value={filters.spiceLevel} onChange={(e) => onFilterChange('spiceLevel', e.target.value)} className="input-field text-sm">
          <option value="">Any</option>
          <option value="none">No Spice</option>
          <option value="mild">Mild</option>
          <option value="medium">Medium</option>
          <option value="hot">Hot</option>
          <option value="very-hot">Very Hot</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-dark-700 mb-2">Sort By</label>
        <select value={filters.sort} onChange={(e) => onFilterChange('sort', e.target.value)} className="input-field text-sm">
          <option value="popular">Most Popular</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="rating">Top Rated</option>
          <option value="name">Name A-Z</option>
        </select>
      </div>
    </div>
  </div>
);

export default Menu;

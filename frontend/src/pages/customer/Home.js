import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiStar, FiClock, FiTrendingUp } from 'react-icons/fi';
import api from '../../services/api';
import ProductCard from '../../components/ProductCard';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [popularItems, setPopularItems] = useState([]);
  const [trendingItems, setTrendingItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, popRes, trendRes] = await Promise.all([
          api.get('/categories'),
          api.get('/recommendations/popular'),
          api.get('/recommendations/trending')
        ]);
        setCategories(catRes.data.categories);
        setPopularItems(popRes.data.popular);
        setTrendingItems(trendRes.data.trending);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 md:p-12 mb-10 text-white overflow-hidden relative"
      >
        <motion.div
          className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -right-5 bottom-0 w-32 h-32 bg-white/5 rounded-full"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
        <motion.h1
          className="text-3xl md:text-4xl font-bold mb-4 relative z-10"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Welcome to Smart Cafe
        </motion.h1>
        <motion.p
          className="text-primary-100 text-lg mb-6 max-w-xl relative z-10"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
        >
          Order your favorite food, track it in real-time, and enjoy a seamless dining experience.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="relative z-10"
        >
          <Link
            to="/menu"
            className="inline-flex items-center gap-2 bg-white text-primary-500 font-semibold px-6 py-3 rounded-lg hover:bg-primary-50 transition-colors"
          >
            Explore Menu <FiArrowRight />
          </Link>
        </motion.div>
      </motion.section>

      <motion.section
        className="mb-10"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        variants={containerVariants}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-dark-800">Categories</h2>
          <Link to="/menu" className="text-primary-500 hover:underline flex items-center gap-1">
            View All <FiArrowRight size={16} />
          </Link>
        </div>
        <motion.div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4" variants={containerVariants}>
          {categories.map((cat) => (
            <motion.div key={cat._id} variants={itemVariants}>
              <Link
                to={`/menu?category=${cat._id}`}
                className="card p-4 text-center hover:border-primary-500 border-2 transition-all block"
                whileHover={{ y: -4, scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <motion.div
                  className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-3"
                  whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <span className="text-2xl">{
                    cat.name === 'Beverages' ? '☕' :
                    cat.name === 'Snacks' ? '🍪' :
                    cat.name === 'Main Course' ? '🍛' :
                    cat.name === 'Desserts' ? '🍰' :
                    cat.name === 'Breakfast' ? '🥞' : '🥗'
                  }</span>
                </motion.div>
                <h3 className="font-medium text-dark-800 text-sm">{cat.name}</h3>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {popularItems.length > 0 && (
        <motion.section
          className="mb-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={containerVariants}
        >
          <div className="flex items-center gap-2 mb-6">
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <FiStar className="text-yellow-500 fill-current" size={24} />
            </motion.div>
            <h2 className="text-2xl font-bold text-dark-800">Popular Items</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularItems.slice(0, 8).map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </motion.section>
      )}

      {trendingItems.length > 0 && (
        <motion.section
          className="mb-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          variants={containerVariants}
        >
          <div className="flex items-center gap-2 mb-6">
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <FiTrendingUp className="text-secondary-500" size={24} />
            </motion.div>
            <h2 className="text-2xl font-bold text-dark-800">Trending This Week</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trendingItems.slice(0, 4).map((item) => (
              <ProductCard key={item._id} product={{ ...item, _id: item._id }} />
            ))}
          </div>
        </motion.section>
      )}

      <motion.section
        className="bg-dark-800 rounded-2xl p-8 text-white text-center overflow-hidden relative"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="absolute left-4 top-4 w-20 h-20 bg-white/5 rounded-full"
          animate={{ scale: [1, 1.5, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute right-8 bottom-4 w-16 h-16 bg-white/5 rounded-full"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 5, repeat: Infinity, delay: 1 }}
        />
        <h2 className="text-2xl font-bold mb-3 relative z-10">QR Code Ordering</h2>
        <p className="text-dark-300 mb-4 relative z-10">Scan the QR code at your table to order directly!</p>
        <motion.div
          className="inline-flex items-center gap-2 text-primary-400 relative z-10"
          animate={{ x: [0, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <FiClock />
          <span>Fast • Easy • Contactless</span>
        </motion.div>
      </motion.section>
    </div>
  );
};

export default Home;

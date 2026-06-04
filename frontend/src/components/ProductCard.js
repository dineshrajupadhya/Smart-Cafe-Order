import React from 'react';
import { motion } from 'framer-motion';
import { FiShoppingCart, FiStar, FiClock } from 'react-icons/fi';
import { useCart } from '../context/CartContext';

const ProductCard = ({ product }) => {
  const { addToCart, loading } = useCart();

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (product.stock > 0) {
      addToCart(product._id, 1);
    }
  };

  return (
    <motion.div
      className="card group"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(0,0,0,0.12)' }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="relative h-48 bg-dark-100 overflow-hidden">
        {product.image && product.image !== 'default-product.png' ? (
          <motion.img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.08 }}
            transition={{ duration: 0.4 }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary-50">
            <span className="text-6xl">🍽️</span>
          </div>
        )}
        {product.stock <= product.lowStockThreshold && product.stock > 0 && (
          <motion.span
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-2 left-2 badge badge-warning"
          >
            Low Stock
          </motion.span>
        )}
        {product.stock === 0 && (
          <motion.span
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-2 left-2 badge badge-danger"
          >
            Out of Stock
          </motion.span>
        )}
        {product.isVegetarian && (
          <motion.span
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-2 right-2 badge badge-success"
          >
            Veg
          </motion.span>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-dark-800 line-clamp-1">{product.name}</h3>
          <span className="text-primary-500 font-bold">₹{product.price}</span>
        </div>

        <p className="text-dark-500 text-sm line-clamp-2 mb-3">{product.description}</p>

        <div className="flex items-center gap-4 text-xs text-dark-400 mb-3">
          {product.rating > 0 && (
            <span className="flex items-center gap-1">
              <FiStar className="text-yellow-400 fill-current" />
              {product.rating.toFixed(1)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <FiClock />
            {product.preparationTime} min
          </span>
        </div>

        <motion.button
          onClick={handleAddToCart}
          disabled={product.stock === 0 || loading}
          whileTap={{ scale: 0.95 }}
          className={`w-full py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            product.stock === 0
              ? 'bg-dark-200 text-dark-400 cursor-not-allowed'
              : 'btn-primary'
          }`}
        >
          <FiShoppingCart size={16} />
          {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ProductCard;

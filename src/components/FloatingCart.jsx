import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';

const FloatingCart = () => {
  const { getCartCount } = useCart();
  const [isAnimating, setIsAnimating] = useState(false);
  const [previousCount, setPreviousCount] = useState(0);
  const cartCount = getCartCount();

  // Trigger animation when cart count changes
  useEffect(() => {
    if (cartCount > previousCount) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 600);
    }
    setPreviousCount(cartCount);
  }, [cartCount, previousCount]);

  // Don't show if cart is empty
  if (cartCount === 0) return null;

  return (
    <Link
      to="/cart"
      className={`fixed bottom-6 right-6 z-50 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all duration-300 ${
        isAnimating ? 'animate-bounce-scale' : ''
      }`}
      aria-label="View Cart"
    >
      <div className="relative p-4">
        {/* Cart Icon */}
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>

        {/* Cart Count Badge */}
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
          {cartCount}
        </span>
      </div>
    </Link>
  );
};

export default FloatingCart;

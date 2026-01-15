import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useCart } from '../contexts/CartContext';

const Wishlist = () => {
  const { user, profile, signOut } = useAuth();
  const { wishlist, loading, removeFromWishlist, getWishlistCount } = useWishlist();
  const { addToCart, getCartCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleRemove = async (productId) => {
    await removeFromWishlist(productId);
  };

  const handleAddToCart = (product) => {
    if (product.stock_quantity > 0) {
      addToCart(product, 1);
    }
  };

  const handleMoveToCart = async (item) => {
    const product = {
      ...item.products,
      id: item.product_id
    };
    handleAddToCart(product);
    await removeFromWishlist(item.product_id);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to view your wishlist.</p>
          <Link
            to="/login"
            className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/">
                <h1 className="text-2xl font-bold text-indigo-600">SellGH</h1>
              </Link>
              <p className="ml-4 text-sm text-gray-600 hidden sm:block">Sell anything, reach everyone</p>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-gray-700 hover:text-indigo-600 font-medium">Home</Link>
              <Link to="/shop" className="text-gray-700 hover:text-indigo-600 font-medium">Shop</Link>
              <Link to="/about" className="text-gray-700 hover:text-indigo-600 font-medium">About</Link>
              <Link to="/support" className="text-gray-700 hover:text-indigo-600 font-medium">Support</Link>
            </div>

            <div className="flex items-center space-x-4">
              {/* Wishlist Icon */}
              <Link to="/wishlist" className="relative p-2 text-indigo-600">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                {getWishlistCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {getWishlistCount()}
                  </span>
                )}
              </Link>

              {/* Cart Icon */}
              <Link to="/cart" className="relative p-2 text-gray-700 hover:text-indigo-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {getCartCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {getCartCount()}
                  </span>
                )}
              </Link>

              <span className="text-sm text-gray-700 hidden sm:block">
                {profile?.full_name || user.email}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 font-medium text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Wishlist Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Wishlist</h1>
        <p className="text-gray-600 mb-8">{wishlist.length} item{wishlist.length !== 1 ? 's' : ''} saved</p>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : wishlist.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-300 text-8xl mb-6">♡</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your wishlist is empty</h2>
            <p className="text-gray-600 mb-8">Save items you love by clicking the heart icon on products.</p>
            <Link
              to="/shop"
              className="bg-indigo-600 text-white px-8 py-3 rounded-md hover:bg-indigo-700 font-medium"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlist.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <Link to={`/product/${item.product_id}`}>
                  {/* Product Image */}
                  <div className="aspect-square bg-gray-200 relative">
                    {item.products?.image_url ? (
                      <img
                        src={item.products.image_url}
                        alt={item.products.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <span className="text-4xl">📦</span>
                      </div>
                    )}
                    {!item.products?.is_active && (
                      <div className="absolute top-2 left-2 bg-gray-600 text-white text-xs px-2 py-1 rounded">
                        Unavailable
                      </div>
                    )}
                    {item.products?.is_active && item.products?.stock_quantity <= 0 && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                        Out of Stock
                      </div>
                    )}
                  </div>
                </Link>

                {/* Product Info */}
                <div className="p-4">
                  <Link to={`/product/${item.product_id}`}>
                    <h3 className="font-semibold text-gray-900 mb-1 truncate hover:text-indigo-600">
                      {item.products?.name}
                    </h3>
                  </Link>
                  <p className="text-sm text-gray-500 mb-2 truncate">
                    by {item.products?.vendors?.business_name || 'Unknown Vendor'}
                  </p>
                  <p className="text-lg font-bold text-indigo-600 mb-4">
                    GH₵ {item.products?.price?.toFixed(2)}
                  </p>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleMoveToCart(item)}
                      disabled={!item.products?.is_active || item.products?.stock_quantity <= 0}
                      className={`flex-1 py-2 rounded text-sm font-medium ${
                        item.products?.is_active && item.products?.stock_quantity > 0
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Move to Cart
                    </button>
                    <button
                      onClick={() => handleRemove(item.product_id)}
                      className="p-2 text-gray-400 hover:text-red-500 border border-gray-300 rounded"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} SellGH. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Wishlist;

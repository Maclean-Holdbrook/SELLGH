import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAlert } from '../contexts/AlertContext';
import Navbar from '../components/Navbar';

const API_URL = import.meta.env.VITE_API_URL;

const Shop = () => {
  const [searchParams] = useSearchParams();
  const { addToCart, clearCart } = useCart();
  const alert = useAlert();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [addedProductId, setAddedProductId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('newest');
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Auto-slide carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselIndex(prev => (prev + 1) % 5); // 5 slides
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    const paymentReference = searchParams.get('payment_reference');

    if (!paymentReference) {
      return;
    }

    const verifyPaymentOnShop = async () => {
      try {
        const response = await fetch(`${API_URL}/payments/verify/${paymentReference}`);
        const data = await response.json();

        if (data.success && data.data.status === 'success') {
          clearCart();
          localStorage.removeItem('pending_order');
          alert.success('Payment successful.');
          navigate('/shop', { replace: true });
          return;
        }

        navigate(`/payment/verify?reference=${paymentReference}`, { replace: true });
      } catch (err) {
        console.error('Shop payment verification error:', err);
        navigate(`/payment/verify?reference=${paymentReference}`, { replace: true });
      }
    };

    verifyPaymentOnShop();
  }, [searchParams, clearCart, alert, navigate]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/products/categories`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      console.log('Fetched categories:', data.categories);
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/products`);
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();

      console.log('Fetched products:', data.products);

      // Process products to get primary image
      const productsWithImages = (data.products || []).map(product => ({
        ...product,
        vendors: product.vendor,
        categories: product.category,
        image_url: product.images?.find(img => img.is_primary)?.image_url
          || product.images?.[0]?.image_url
          || null
      }));

      setProducts(productsWithImages);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock_quantity > 0) {
      addToCart(product, 1);
      setAddedProductId(product.id);
      setTimeout(() => setAddedProductId(null), 1500);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory;
    const matchesMinPrice = !priceRange.min || product.price >= parseFloat(priceRange.min);
    const matchesMaxPrice = !priceRange.max || product.price <= parseFloat(priceRange.max);
    return matchesSearch && matchesCategory && matchesMinPrice && matchesMaxPrice;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price_low':
        return (a.price || 0) - (b.price || 0);
      case 'price_high':
        return (b.price || 0) - (a.price || 0);
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'newest':
      default:
        return new Date(b.created_at) - new Date(a.created_at);
    }
  });

  // Helper to get category name by id
  const getCategoryName = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat?.name || 'Unknown Category';
  };

  // Star rating component
  const StarRating = ({ rating, reviewCount }) => (
    <div className="flex items-center">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-sm ${star <= Math.round(rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
          >
            ★
          </span>
        ))}
      </div>
      {reviewCount > 0 && (
        <span className="text-xs text-gray-500 ml-1">({reviewCount})</span>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <Navbar activePage="shop" />

      {/* Search and Filter Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-4">
            {/* First Row: Search and Category */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-grow">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              {/* Category Filter */}
              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Second Row: Price Range and Sort */}
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              {/* Price Range */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Price:</span>
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              {/* Sort By */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                >
                  <option value="newest">Newest</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>

              {/* Clear Filters */}
              {(priceRange.min || priceRange.max || selectedCategory !== 'all' || searchTerm) && (
                <button
                  onClick={() => {
                    setPriceRange({ min: '', max: '' });
                    setSelectedCategory('all');
                    setSearchTerm('');
                    setSortBy('newest');
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hero Carousel Banner */}
      {(() => {
        const bannerSlides = [
          {
            id: 1,
            image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&h=400&fit=crop',
            title: 'Shop the Latest Trends',
            subtitle: 'Discover amazing deals from local vendors',
            buttonText: 'Shop Now',
            link: '#products'
          },
          {
            id: 2,
            image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=400&fit=crop',
            title: 'Electronics & Gadgets',
            subtitle: 'Top quality tech at unbeatable prices',
            buttonText: 'Explore',
            link: '#products'
          },
          {
            id: 3,
            image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop',
            title: 'Fashion & Style',
            subtitle: 'Express yourself with trending fashion',
            buttonText: 'View Collection',
            link: '#products'
          },
          {
            id: 4,
            image: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=1200&h=400&fit=crop',
            title: 'Home & Living',
            subtitle: 'Transform your space with quality items',
            buttonText: 'Browse',
            link: '#products'
          },
          {
            id: 5,
            image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=400&fit=crop',
            title: 'Become a Vendor',
            subtitle: 'Start selling on SellGH today',
            buttonText: 'Get Started',
            link: '/signup'
          }
        ];

        return (
          <div className="relative overflow-hidden bg-gray-900 z-0">
            <div className="max-w-7xl mx-auto">
              <div className="relative h-64 sm:h-80 md:h-96 z-0">
                {bannerSlides.map((slide, idx) => (
                  <div
                    key={slide.id}
                    className={`absolute inset-0 transition-opacity duration-500 ${carouselIndex === idx ? 'opacity-100 z-10' : 'opacity-0 z-0'
                      }`}
                  >
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
                    <div className="absolute inset-0 flex items-center">
                      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                        <div className="max-w-lg">
                          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                            {slide.title}
                          </h2>
                          <p className="text-lg sm:text-xl text-gray-200 mb-6">
                            {slide.subtitle}
                          </p>
                          <Link
                            to={slide.link}
                            className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-md font-medium hover:bg-indigo-700 transition-colors"
                          >
                            {slide.buttonText}
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Dots */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
                  {bannerSlides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCarouselIndex(idx)}
                      className={`w-3 h-3 rounded-full transition-colors ${carouselIndex === idx ? 'bg-white' : 'bg-white/40'
                        }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {selectedCategory === 'all' ? 'All Products' : getCategoryName(selectedCategory)}
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🛒</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600">
              {searchTerm || selectedCategory !== 'all'
                ? 'Try adjusting your search or filter'
                : 'Check back later for new products!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {sortedProducts.map(product => (
              <Link
                key={product.id}
                to={`/product/${product.id}`}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Product Image */}
                <div className="aspect-square bg-gray-200 relative">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <span className="text-4xl">📦</span>
                    </div>
                  )}
                  {product.stock_quantity <= 0 && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                      Out of Stock
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-3 sm:p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base line-clamp-2">{product.name}</h3>
                  {/* Star Rating */}
                  <div className="mb-2">
                    <StarRating rating={product.rating} reviewCount={product.review_count} />
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-base sm:text-lg font-bold text-indigo-600">
                      GH₵{product.price?.toFixed(2)}
                    </span>
                    <button
                      onClick={(e) => handleAddToCart(e, product)}
                      disabled={product.stock_quantity <= 0}
                      className={`p-2 rounded-full ${addedProductId === product.id
                          ? 'bg-green-600 text-white'
                          : product.stock_quantity > 0
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                            : 'bg-gray-400 text-white cursor-not-allowed'
                        }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">SellGH</h3>
              <p className="text-gray-600 text-sm">
                Ghana's premier multi-vendor marketplace connecting buyers with local vendors.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/shop" className="text-gray-600 hover:text-indigo-600 text-sm">
                    Browse Products
                  </Link>
                </li>
                <li>
                  <Link to="/signup" className="text-gray-600 hover:text-indigo-600 text-sm">
                    Become a Vendor
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="text-gray-600 hover:text-indigo-600 text-sm">
                    Sign In
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Email: support@sellgh.com</li>
                <li>Phone: +233 20 928 7952</li>
                <li>Address: Accra, Ghana</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} SellGH. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Shop;

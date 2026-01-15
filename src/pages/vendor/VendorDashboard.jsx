import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAlert } from '../../contexts/AlertContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const VendorDashboard = () => {
  const { profile, vendorProfile, signOut, loading, user, session } = useAuth();
  const navigate = useNavigate();
  const [productCount, setProductCount] = useState(0);
  const [orderStats, setOrderStats] = useState({
    totalSales: 0,
    orderCount: 0,
    recentOrders: []
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Redirect to onboarding if vendor profile doesn't exist
  useEffect(() => {
    if (!loading && !vendorProfile) {
      navigate('/vendor/onboarding');
    }
  }, [loading, vendorProfile, navigate]);

  // Fetch actual product count
  useEffect(() => {
    const fetchProductCount = async () => {
      if (!user?.id || !session?.access_token) return;
      try {
        const response = await fetch(`${API_URL}/products/user/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          }
        });
        if (response.ok) {
          const data = await response.json();
          setProductCount(data.products?.length || 0);
        }
      } catch (err) {
        console.error('Error fetching product count:', err);
      }
    };
    fetchProductCount();
  }, [user?.id, session]);

  // Fetch order statistics
  useEffect(() => {
    const fetchOrderStats = async () => {
      if (!vendorProfile?.id) {
        console.log('⚠️ No vendor profile ID, skipping order stats fetch');
        return;
      }
      if (!session?.access_token) {
        console.log('⚠️ No session token, skipping order stats fetch');
        return;
      }
      try {
        console.log('🔍 Fetching order stats for vendor:', vendorProfile.id);
        const url = `${API_URL}/orders/vendor/${vendorProfile.id}/stats`;
        console.log('📡 Fetching from:', url);

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        });
        console.log('📨 Response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('📊 Order stats received:', data);

          setOrderStats({
            totalSales: data.totalSales || 0,
            orderCount: data.orderCount || 0,
            recentOrders: data.recentOrders || []
          });
        } else {
          console.error('❌ Failed to fetch stats, status:', response.status);
          const errorData = await response.json();
          console.error('Error details:', errorData);
        }
      } catch (err) {
        console.error('❌ Error fetching order stats:', err);
      }
    };
    fetchOrderStats();
  }, [vendorProfile?.id, session]);

  // Show loading while checking vendor profile
  if (loading || !vendorProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Brand Name - Left */}
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-indigo-600">
                SellGH
              </Link>
              <span className="ml-2 px-2 py-1 text-xs font-semibold bg-indigo-600 text-white rounded">
                VENDOR
              </span>
            </div>

            {/* Desktop Navigation - Hidden on Mobile */}
            <div className="hidden lg:flex items-center space-x-4">
              <Link to="/vendor/dashboard" className="text-indigo-600 font-medium hover:text-indigo-700">
                Dashboard
              </Link>
              {vendorProfile && (
                <>
                  <Link to="/vendor/products/new" className="text-gray-700 hover:text-gray-900">
                    Add Product
                  </Link>
                  <Link to="/vendor/products" className="text-gray-700 hover:text-gray-900">
                    Products
                  </Link>
                  <Link to="/vendor/orders" className="text-gray-700 hover:text-gray-900">
                    Orders
                  </Link>
                  <Link to="/vendor/earnings" className="text-green-600 hover:text-green-700">
                    Earnings
                  </Link>
                </>
              )}
              {!vendorProfile && (
                <Link to="/vendor/onboarding" className="text-indigo-600 hover:text-indigo-700">
                  Complete Setup
                </Link>
              )}
              <span className="text-sm text-gray-700">
                {profile?.full_name}
              </span>
              <button
                onClick={handleSignOut}
                className="text-gray-700 hover:text-gray-900"
              >
                Sign out
              </button>
            </div>

            {/* Mobile Hamburger Menu - Hidden on Desktop */}
            <div className="lg:hidden relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 focus:outline-none"
              >
                <div className="flex flex-col space-y-1.5 w-6">
                  <span className={`block h-0.5 w-6 bg-gray-600 transition-transform ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                  <span className={`block h-0.5 w-6 bg-gray-600 transition-opacity ${isMenuOpen ? 'opacity-0' : ''}`}></span>
                  <span className={`block h-0.5 w-6 bg-gray-600 transition-transform ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
                </div>
              </button>

              {/* Mobile Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                  <div className="py-2">
                    {/* User Info */}
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-xs text-gray-500">Signed in as</p>
                      <p className="text-sm font-medium text-gray-900 truncate">{profile?.full_name}</p>
                      {vendorProfile && (
                        <p className="text-xs text-gray-500 truncate">{vendorProfile.business_name}</p>
                      )}
                    </div>

                    {/* Navigation Links */}
                    <div className="py-2">
                      <Link
                        to="/vendor/dashboard"
                        className="block px-4 py-2 text-sm text-indigo-600 hover:bg-gray-50"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      {vendorProfile && (
                        <>
                          <Link
                            to="/vendor/products/new"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            Add New Product
                          </Link>
                          <Link
                            to="/vendor/products"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            Manage Products
                          </Link>
                          <Link
                            to="/vendor/orders"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            View Orders
                          </Link>
                          <Link
                            to="/vendor/earnings"
                            className="block px-4 py-2 text-sm text-green-600 hover:bg-gray-50 hover:text-green-700"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            Earnings & Withdraw
                          </Link>
                        </>
                      )}
                      {!vendorProfile && (
                        <Link
                          to="/vendor/onboarding"
                          className="block px-4 py-2 text-sm text-indigo-600 hover:bg-gray-50"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Complete Vendor Setup
                        </Link>
                      )}
                    </div>

                    {/* Sign Out */}
                    <div className="border-t border-gray-200 pt-2">
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 hover:text-red-700"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Vendor Dashboard</h1>
          {vendorProfile && (
            <p className="mt-2 text-gray-600">
              Business: {vendorProfile.business_name || 'Not set up yet'}
            </p>
          )}
          {vendorProfile && !vendorProfile.is_verified && (
            <div className="mt-4 bg-yellow-50 p-4 rounded-md">
              <p className="text-sm text-yellow-800">
                Your vendor account is pending verification. You'll be able to add products once verified.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-100">
            <h3 className="text-xs sm:text-sm font-medium text-gray-500">Total Sales</h3>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900 break-all">
              GH₵ {orderStats.totalSales.toFixed(2)}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">{orderStats.orderCount} orders</p>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-100">
            <h3 className="text-xs sm:text-sm font-medium text-gray-500">Total Products</h3>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900">
              {productCount}
            </p>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-100">
            <h3 className="text-xs sm:text-sm font-medium text-gray-500">Rating</h3>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900">
              {vendorProfile?.rating || '0.00'} ★
            </p>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-100">
            <h3 className="text-xs sm:text-sm font-medium text-gray-500">Reviews</h3>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900">
              {vendorProfile?.total_reviews || 0}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              {!vendorProfile ? (
                <Link
                  to="/vendor/onboarding"
                  className="block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-center"
                >
                  Complete Vendor Setup
                </Link>
              ) : (
                <>
                  <Link
                    to="/vendor/products/new"
                    className="block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-center"
                  >
                    Add New Product
                  </Link>
                  <Link
                    to="/vendor/products"
                    className="block px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-center"
                  >
                    Manage Products
                  </Link>
                  <Link
                    to="/vendor/orders"
                    className="block px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-center"
                  >
                    View Orders
                  </Link>
                  <Link
                    to="/vendor/earnings"
                    className="block px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-center"
                  >
                    View Earnings & Withdraw
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h2>
            {orderStats.recentOrders.length === 0 ? (
              <p className="text-gray-500">No recent orders</p>
            ) : (
              <div className="space-y-3">
                {orderStats.recentOrders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">Order #{order.order_number}</p>
                      <p className="text-sm text-gray-500">{order.customer_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">GH₵ {order.total.toFixed(2)}</p>
                      <p className="text-xs text-gray-500 capitalize">{order.status}</p>
                    </div>
                  </div>
                ))}
                {orderStats.orderCount > 5 && (
                  <Link to="/vendor/orders" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium block mt-3">
                    View all {orderStats.orderCount} orders →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;

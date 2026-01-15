import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAlert } from '../../contexts/AlertContext';
import { supabase } from '../../config/supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AdminDashboard = () => {
  const { profile, signOut, user, loading, session } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalVendors: 0,
    totalProducts: 0,
    totalOrders: 0,
    pendingVendors: 0,
    totalRevenue: 0,
    platformCommission: 0,
    availableBalance: 0,
  });
  const [pendingVendors, setPendingVendors] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (!loading && user && profile && profile.role !== 'admin') {
      navigate('/');
    }
  }, [loading, user, profile, navigate]);

  useEffect(() => {
    if (profile?.role === 'admin' && user) {
      fetchStats();
      fetchPendingVendors();
    }
  }, [profile, user]);

  const fetchStats = async () => {
    try {
      // Get vendor count
      const { count: vendorCount } = await supabase
        .from('vendors')
        .select('*', { count: 'exact', head: true });

      // Get product count
      const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      // Get pending vendors count
      const { count: pendingCount } = await supabase
        .from('vendors')
        .select('*', { count: 'exact', head: true })
        .eq('verification_status', 'pending');

      // Get all orders from API (bypasses RLS)
      try {
        console.log('📊 Fetching all orders for stats...');
        const ordersResponse = await fetch(`${API_URL}/orders/debug/all-orders`, {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json',
          },
        });
        console.log('📡 Orders response status:', ordersResponse.status);

        if (ordersResponse.ok) {
          const ordersResult = await ordersResponse.json();
          const allOrders = ordersResult.data || [];
          console.log('📦 Total orders found:', allOrders.length);

          // Calculate revenue from paid orders
          const paidOrders = allOrders.filter(order => order.payment_status === 'paid');
          console.log('💰 Paid orders:', paidOrders.length);

          const totalRevenue = paidOrders.reduce((sum, order) => {
            console.log('Order amount:', order.total_amount);
            return sum + (order.total_amount || 0);
          }, 0);
          console.log('💵 Total revenue calculated:', totalRevenue);

          // Fetch platform commission from backend (actual commission data)
          let platformCommission = totalRevenue * 0.05; // Default calculation
          let availableBalance = 0;

          // Try to get actual commission from backend
          try {
            const { data: { session: currentSession } } = await supabase.auth.getSession();

            if (currentSession?.access_token) {
              console.log('💰 Fetching platform balance from API...');
              const balanceResponse = await fetch(`${API_URL}/payouts/admin/balance`, {
                headers: { Authorization: `Bearer ${currentSession.access_token}` }
              });

              console.log('📡 Balance API response status:', balanceResponse.status);
              const balanceData = await balanceResponse.json();
              console.log('📊 Balance API data:', balanceData);

              if (balanceData.success) {
                platformCommission = balanceData.data.total_commission || platformCommission;
                availableBalance = balanceData.data.available_balance || 0;
                console.log('✅ Platform commission from API:', platformCommission);
                console.log('✅ Available balance:', availableBalance);
              } else {
                console.warn('⚠️ Balance API returned success=false, using calculation');
              }
            } else {
              console.warn('⚠️ No session token, using calculation');
            }
          } catch (balanceError) {
            console.error('❌ Error fetching platform balance:', balanceError);
            console.log('💡 Using fallback calculation:', platformCommission);
          }

          setStats({
            totalVendors: vendorCount || 0,
            totalProducts: productCount || 0,
            totalOrders: allOrders.length,
            pendingVendors: pendingCount || 0,
            totalRevenue,
            platformCommission,
            availableBalance,
          });
        } else {
          const errorText = await ordersResponse.text();
          console.error('❌ Failed to fetch orders. Status:', ordersResponse.status);
          console.error('❌ Error details:', errorText);
          setStats({
            totalVendors: vendorCount || 0,
            totalProducts: productCount || 0,
            totalOrders: 0,
            pendingVendors: pendingCount || 0,
            totalRevenue: 0,
            platformCommission: 0,
          });
        }
      } catch (ordersError) {
        console.error('❌ Exception fetching orders:', ordersError);
        setStats({
          totalVendors: vendorCount || 0,
          totalProducts: productCount || 0,
          totalOrders: 0,
          pendingVendors: pendingCount || 0,
          totalRevenue: 0,
          platformCommission: 0,
        });
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchPendingVendors = async () => {
    try {
      console.log('🔍 Fetching pending vendors...');
      const response = await fetch(`${API_URL}/vendors?status=pending`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to fetch pending vendors:', errorText);
        throw new Error('Failed to fetch pending vendors');
      }

      const data = await response.json();
      console.log('📋 Pending vendors data:', data);
      console.log('📋 Number of pending vendors:', data.vendors?.length || 0);
      setPendingVendors((data.vendors || []).slice(0, 5));
    } catch (err) {
      console.error('❌ Error fetching pending vendors:', err);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/sellgh-admin');
  };

  const handleApproveVendor = async (vendorId) => {
    try {
      console.log('Approving vendor:', vendorId);
      const response = await fetch(`${API_URL}/vendors/${vendorId}/verify`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verification_status: 'approved',
          is_verified: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert.error('Failed to approve vendor: ' + (errorData.error || 'Unknown error'));
        throw new Error(errorData.error);
      }

      console.log('Vendor approved');
      alert.error('Vendor approved successfully!');
      fetchStats();
      fetchPendingVendors();
    } catch (err) {
      console.error('Error approving vendor:', err);
    }
  };

  const handleRejectVendor = async (vendorId) => {
    try {
      const response = await fetch(`${API_URL}/vendors/${vendorId}/verify`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verification_status: 'rejected',
          is_verified: false
        })
      });

      if (!response.ok) throw new Error('Failed to reject vendor');
      fetchStats();
      fetchPendingVendors();
    } catch (err) {
      console.error('Error rejecting vendor:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Admin Navigation - Dark Theme */}
      <nav className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Brand Name - Left */}
            <div className="flex items-center">
              <span className="text-2xl font-bold text-indigo-400">
                SellGH
              </span>
              <span className="ml-2 px-2 py-1 text-xs font-semibold bg-red-600 text-white rounded">
                ADMIN
              </span>
            </div>

            {/* Desktop Navigation - Hidden on Mobile */}
            <div className="hidden lg:flex items-center space-x-6">
              <Link to="/sellgh-admin/dashboard" className="text-indigo-400 font-medium">
                Dashboard
              </Link>
              <Link to="/sellgh-admin/vendors" className="text-gray-400 hover:text-white">
                Vendors
              </Link>
              <Link to="/sellgh-admin/products" className="text-gray-400 hover:text-white">
                Products
              </Link>
              <Link to="/sellgh-admin/payouts" className="text-gray-400 hover:text-white">
                Payouts
              </Link>
              <Link to="/sellgh-admin/withdrawals" className="text-gray-400 hover:text-white">
                Withdrawals
              </Link>
              <Link to="/sellgh-admin/reports" className="text-gray-400 hover:text-white">
                Reports
              </Link>
              <span className="text-sm text-gray-400">
                {profile?.full_name || profile?.email}
              </span>
              <button
                onClick={handleSignOut}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
              >
                Sign out
              </button>
            </div>

            {/* Mobile Hamburger Menu - Hidden on Desktop */}
            <div className="lg:hidden relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center space-x-2 text-gray-400 hover:text-white focus:outline-none"
              >
                <div className="flex flex-col space-y-1.5 w-6">
                  <span className={`block h-0.5 w-6 bg-gray-400 transition-transform ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                  <span className={`block h-0.5 w-6 bg-gray-400 transition-opacity ${isMenuOpen ? 'opacity-0' : ''}`}></span>
                  <span className={`block h-0.5 w-6 bg-gray-400 transition-transform ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
                </div>
              </button>

              {/* Mobile Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                  <div className="py-2">
                    {/* User Info */}
                    <div className="px-4 py-2 border-b border-gray-700">
                      <p className="text-sm text-gray-400">Signed in as</p>
                      <p className="text-sm font-medium text-white truncate">{profile?.full_name || profile?.email}</p>
                    </div>

                    {/* Navigation Links */}
                    <div className="py-2">
                      <Link
                        to="/sellgh-admin/dashboard"
                        className="block px-4 py-2 text-sm text-indigo-400 hover:bg-gray-700"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        to="/sellgh-admin/vendors"
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Vendors
                      </Link>
                      <Link
                        to="/sellgh-admin/products"
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Products
                      </Link>
                      <Link
                        to="/sellgh-admin/payouts"
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Payouts
                      </Link>
                      <Link
                        to="/sellgh-admin/withdrawals"
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Withdrawals
                      </Link>
                      <Link
                        to="/sellgh-admin/reports"
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Reports
                      </Link>
                    </div>

                    {/* Sign Out */}
                    <div className="border-t border-gray-700 pt-2">
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300"
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

      {/* Main Content - Dark Theme */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="mt-2 text-gray-400">Manage your SellGH marketplace</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
          <div className="bg-gray-800 p-4 sm:p-6 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
            <h3 className="text-xs sm:text-sm font-medium text-gray-400">Total Vendors</h3>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-white">{stats.totalVendors}</p>
          </div>
          <div className="bg-gray-800 p-4 sm:p-6 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
            <h3 className="text-xs sm:text-sm font-medium text-gray-400">Total Products</h3>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-white">{stats.totalProducts}</p>
          </div>
          <div className="bg-gray-800 p-4 sm:p-6 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
            <h3 className="text-xs sm:text-sm font-medium text-gray-400">Total Orders</h3>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-white">{stats.totalOrders}</p>
          </div>
          <div className="bg-yellow-900 p-4 sm:p-6 rounded-lg border border-yellow-700 hover:border-yellow-600 transition-colors">
            <h3 className="text-xs sm:text-sm font-medium text-yellow-400">Pending Approvals</h3>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-yellow-300">{stats.pendingVendors}</p>
          </div>
        </div>

        {/* Financial Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-8">
          <div className="bg-green-900 p-4 sm:p-6 rounded-lg border border-green-700 hover:border-green-600 transition-colors">
            <h3 className="text-xs sm:text-sm font-medium text-green-400">Total Revenue</h3>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-green-300 break-all">GH₵ {stats.totalRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-indigo-900 p-4 sm:p-6 rounded-lg border border-indigo-700 hover:border-indigo-600 transition-colors">
            <h3 className="text-xs sm:text-sm font-medium text-indigo-400">Platform Commission (5%)</h3>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-indigo-300 break-all">GH₵ {stats.platformCommission.toFixed(2)}</p>
            <Link to="/sellgh-admin/withdrawals" className="mt-3 text-xs text-indigo-200 hover:text-indigo-100 inline-block">
              View Withdrawals →
            </Link>
          </div>
          <div className="bg-purple-900 p-4 sm:p-6 rounded-lg border border-purple-700 hover:border-purple-600 transition-colors">
            <h3 className="text-xs sm:text-sm font-medium text-purple-400">Available to Withdraw</h3>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-purple-300 break-all">GH₵ {stats.availableBalance.toFixed(2)}</p>
            <Link to="/sellgh-admin/withdrawals" className="mt-3 text-xs text-purple-200 hover:text-purple-100 inline-block">
              Withdraw Now →
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                to="/sellgh-admin/vendors"
                className="block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-center"
              >
                Manage Vendors
              </Link>
              <Link
                to="/sellgh-admin/products"
                className="block px-4 py-2 bg-gray-700 border border-gray-600 text-gray-200 rounded-md hover:bg-gray-600 text-center"
              >
                Manage Products
              </Link>
            </div>
          </div>

          {/* Pending Vendor Approvals */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4">Pending Vendor Approvals</h2>
            {pendingVendors.length === 0 ? (
              <p className="text-gray-500">No pending vendor approvals</p>
            ) : (
              <div className="space-y-4">
                {pendingVendors.map((vendor) => (
                  <div key={vendor.id} className="bg-gray-700 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-white">{vendor.business_name}</h3>
                        <p className="text-sm text-gray-400">{vendor.users?.email}</p>
                        <p className="text-xs text-gray-500 mt-1">{vendor.business_address}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApproveVendor(vendor.id)}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectVendor(vendor.id)}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

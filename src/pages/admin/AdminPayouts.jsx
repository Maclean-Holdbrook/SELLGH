import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAlert } from '../../contexts/AlertContext';
import AdminNavigation from '../../components/AdminNavigation';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AdminPayouts = () => {
  const { profile, user, loading, session } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('commissions');
  const [commissions, setCommissions] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [stats, setStats] = useState({
    total_commission: 0,
    pending_commission: 0,
    settled_commission: 0
  });

  const [filters, setFilters] = useState({
    status: 'all',
    vendor_id: ''
  });

  const [showCreatePayout, setShowCreatePayout] = useState(false);
  const [newPayout, setNewPayout] = useState({
    vendor_id: '',
    period_start: '',
    period_end: '',
    payout_method: 'momo',
    notes: ''
  });

  const [loadingCommissions, setLoadingCommissions] = useState(true);
  const [loadingPayouts, setLoadingPayouts] = useState(true);

  // Redirect if not admin
  useEffect(() => {
    if (!loading && user && profile && profile.role !== 'admin') {
      navigate('/');
    }
  }, [loading, user, profile, navigate]);

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchCommissions();
      fetchPayouts();
      fetchVendors();
    }
  }, [profile, filters]);

  const fetchCommissions = async () => {
    try {
      setLoadingCommissions(true);

      let url = `${API_URL}/payouts/admin/commissions?status=${filters.status}`;
      if (filters.vendor_id) {
        url += `&vendor_id=${filters.vendor_id}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setCommissions(data.data.commissions);
        setStats(data.data.totals);
      }
    } catch (error) {
      console.error('Error fetching commissions:', error);
    } finally {
      setLoadingCommissions(false);
    }
  };

  const fetchPayouts = async () => {
    try {
      setLoadingPayouts(true);

      let url = `${API_URL}/payouts/admin/payouts?status=${filters.status}`;
      if (filters.vendor_id) {
        url += `&vendor_id=${filters.vendor_id}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setPayouts(data.data);
      }
    } catch (error) {
      console.error('Error fetching payouts:', error);
    } finally {
      setLoadingPayouts(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await fetch(`${API_URL}/vendors?status=approved`);
      const data = await response.json();
      setVendors(data.vendors || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const handleCreatePayout = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_URL}/payouts/admin/payouts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(newPayout)
      });

      const data = await response.json();

      if (data.success) {
        alert.error('Payout created successfully!');
        setShowCreatePayout(false);
        setNewPayout({
          vendor_id: '',
          period_start: '',
          period_end: '',
          payout_method: 'momo',
          notes: ''
        });
        fetchPayouts();
        fetchCommissions();
      } else {
        alert.error(data.error || 'Failed to create payout');
      }
    } catch (error) {
      console.error('Error creating payout:', error);
      alert.error('Failed to create payout');
    }
  };

  const handleUpdatePayoutStatus = async (payoutId, status, transactionRef = '') => {
    try {
      const response = await fetch(`${API_URL}/payouts/admin/payouts/${payoutId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          status,
          transaction_reference: transactionRef,
          notes: status === 'paid' ? `Paid via ${transactionRef}` : ''
        })
      });

      const data = await response.json();

      if (data.success) {
        alert.error(`Payout marked as ${status}!`);
        fetchPayouts();
        fetchCommissions();
      } else {
        alert.error(data.error || 'Failed to update payout');
      }
    } catch (error) {
      console.error('Error updating payout:', error);
      alert.error('Failed to update payout');
    }
  };

  const formatCurrency = (amount) => {
    return `GHS ${parseFloat(amount || 0).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  if (loading || !profile) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Total Commission</div>
            <div className="text-2xl font-bold text-gray-900 mt-2">
              {formatCurrency(stats.total_commission)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Pending Payouts</div>
            <div className="text-2xl font-bold text-yellow-600 mt-2">
              {formatCurrency(stats.pending_commission)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Settled Payouts</div>
            <div className="text-2xl font-bold text-green-600 mt-2">
              {formatCurrency(stats.settled_commission)}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('commissions')}
                className={`px-6 py-3 border-b-2 font-medium text-sm ${
                  activeTab === 'commissions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Commissions
              </button>
              <button
                onClick={() => setActiveTab('payouts')}
                className={`px-6 py-3 border-b-2 font-medium text-sm ${
                  activeTab === 'payouts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Vendor Payouts
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Filters */}
            <div className="flex gap-4 mb-6">
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="settled">Settled</option>
                <option value="processing">Processing</option>
                <option value="paid">Paid</option>
              </select>

              <select
                value={filters.vendor_id}
                onChange={(e) => setFilters({ ...filters, vendor_id: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">All Vendors</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.business_name}
                  </option>
                ))}
              </select>

              {activeTab === 'payouts' && (
                <button
                  onClick={() => setShowCreatePayout(true)}
                  className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Payout
                </button>
              )}
            </div>

            {/* Commissions Tab */}
            {activeTab === 'commissions' && (
              <div className="overflow-x-auto">
                {loadingCommissions ? (
                  <div className="text-center py-8">Loading commissions...</div>
                ) : commissions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No commissions found</div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Platform Commission</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {commissions.map((commission) => (
                        <tr key={commission.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {commission.order_id?.substring(0, 8)}...
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {commission.vendors?.business_name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(commission.order_total)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(commission.vendor_amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                            {formatCurrency(commission.platform_commission)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              commission.status === 'settled'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {commission.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(commission.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Payouts Tab */}
            {activeTab === 'payouts' && (
              <div className="overflow-x-auto">
                {loadingPayouts ? (
                  <div className="text-center py-8">Loading payouts...</div>
                ) : payouts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No payouts found</div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payouts.map((payout) => (
                        <tr key={payout.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payout.vendors?.business_name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatCurrency(payout.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(payout.period_start)} - {formatDate(payout.period_end)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payout.payout_method}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              payout.status === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : payout.status === 'processing'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {payout.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {payout.status === 'pending' && (
                              <button
                                onClick={() => {
                                  const ref = prompt('Enter transaction reference:');
                                  if (ref) {
                                    handleUpdatePayoutStatus(payout.id, 'paid', ref);
                                  }
                                }}
                                className="text-green-600 hover:text-green-800 mr-3"
                              >
                                Mark Paid
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Payout Modal */}
      {showCreatePayout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6">Create Vendor Payout</h2>
            <form onSubmit={handleCreatePayout}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Vendor</label>
                <select
                  value={newPayout.vendor_id}
                  onChange={(e) => setNewPayout({ ...newPayout, vendor_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">Select Vendor</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.business_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Period Start</label>
                <input
                  type="date"
                  value={newPayout.period_start}
                  onChange={(e) => setNewPayout({ ...newPayout, period_start: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Period End</label>
                <input
                  type="date"
                  value={newPayout.period_end}
                  onChange={(e) => setNewPayout({ ...newPayout, period_end: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Payout Method</label>
                <select
                  value={newPayout.payout_method}
                  onChange={(e) => setNewPayout({ ...newPayout, payout_method: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="momo">Mobile Money</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                <textarea
                  value={newPayout.notes}
                  onChange={(e) => setNewPayout({ ...newPayout, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  rows="3"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Payout
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreatePayout(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayouts;

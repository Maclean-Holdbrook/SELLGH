import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAlert } from '../../contexts/AlertContext';
import { supabase } from '../../config/supabase';
import VendorNavigation from '../../components/VendorNavigation';

const API_URL = import.meta.env.VITE_API_URL;

const VendorEarnings = () => {
  const { profile, vendorProfile, loading } = useAuth();
  const navigate = useNavigate();

  const [commissions, setCommissions] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    settled: 0,
    total_earned: 0,
    available_for_withdrawal: 0
  });

  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false);
  const [withdrawalData, setWithdrawalData] = useState({
    amount: '',
    payment_method: 'momo',
    account_number: '',
    account_name: '',
    provider: 'MTN',
    notes: ''
  });

  const [loadingData, setLoadingData] = useState(true);

  // Redirect if not vendor
  useEffect(() => {
    if (!loading && (!profile || profile.role !== 'vendor')) {
      navigate('/');
    }
  }, [loading, profile, navigate]);

  // Redirect to onboarding if no vendor profile
  useEffect(() => {
    if (!loading && !vendorProfile) {
      navigate('/vendor/onboarding');
    }
  }, [loading, vendorProfile, navigate]);

  useEffect(() => {
    if (vendorProfile?.id) {
      fetchCommissions();
      fetchPayouts();
    }
  }, [vendorProfile]);

  const fetchCommissions = async () => {
    try {
      setLoadingData(true);
      console.log('💰 Fetching vendor commissions...');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.error('No session token');
        return;
      }

      const response = await fetch(`${API_URL}/payouts/commissions`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      const data = await response.json();
      console.log('Commissions data:', data);

      if (data.success) {
        setCommissions(data.data.commissions || []);
        setStats(data.data.totals || {});
      }
    } catch (error) {
      console.error('Error fetching commissions:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchPayouts = async () => {
    try {
      console.log('💸 Fetching vendor payouts...');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.error('No session token');
        return;
      }

      const response = await fetch(`${API_URL}/payouts/history`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      const data = await response.json();
      console.log('Payouts data:', data);

      if (data.success) {
        setPayouts(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching payouts:', error);
    }
  };

  const handleRequestWithdrawal = async (e) => {
    e.preventDefault();

    const amount = parseFloat(withdrawalData.amount);
    if (amount > stats.pending) {
      alert.error(`Insufficient balance. Available: GHS ${stats.pending.toFixed(2)}`);
      return;
    }

    if (amount < 10) {
      alert.error('Minimum withdrawal amount is GHS 10.00');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        alert.error('Session expired. Please refresh and try again.');
        return;
      }

      console.log('📤 Requesting withdrawal:', withdrawalData);

      const response = await fetch(`${API_URL}/payouts/vendor/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          amount,
          payment_method: withdrawalData.payment_method,
          account_details: {
            account_number: withdrawalData.account_number,
            account_name: withdrawalData.account_name,
            provider: withdrawalData.provider
          },
          notes: withdrawalData.notes
        })
      });

      const data = await response.json();

      if (data.success) {
        alert.error('Withdrawal request submitted successfully! Admin will process it soon.');
        setShowWithdrawalForm(false);
        setWithdrawalData({
          amount: '',
          payment_method: 'momo',
          account_number: '',
          account_name: '',
          provider: 'MTN',
          notes: ''
        });
        fetchCommissions();
        fetchPayouts();
      } else {
        alert.error(data.error || 'Failed to submit withdrawal request');
      }
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      alert.error('Failed to submit withdrawal request');
    }
  };

  const formatCurrency = (amount) => {
    return `GHS ${parseFloat(amount || 0).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  if (loading || !vendorProfile) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <VendorNavigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Available for Withdrawal</div>
            <div className="text-2xl font-bold text-green-600 mt-2">
              {formatCurrency(stats.pending)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Your portion: 95% of sales</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Already Withdrawn</div>
            <div className="text-2xl font-bold text-gray-600 mt-2">
              {formatCurrency(stats.settled)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Total Earned</div>
            <div className="text-2xl font-bold text-indigo-600 mt-2">
              {formatCurrency(stats.total_earned)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Platform fee (5%) already deducted</p>
          </div>
        </div>

        {/* Request Withdrawal Button */}
        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Request Withdrawal</h2>
              <p className="text-sm text-gray-500">Withdraw your earnings to your mobile money or bank account</p>
            </div>
            <button
              onClick={() => setShowWithdrawalForm(true)}
              className={`px-6 py-3 rounded-lg font-semibold ${stats.pending >= 10
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                }`}
              disabled={stats.pending < 10}
              title={stats.pending < 10 ? 'Minimum withdrawal is GHS 10.00' : 'Request withdrawal'}
            >
              Request Withdrawal
            </button>
          </div>
          {stats.pending < 10 && stats.pending > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                You need at least GHS 10.00 to request a withdrawal. Current balance: {formatCurrency(stats.pending)}
              </p>
            </div>
          )}
        </div>

        {/* Withdrawal History */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Withdrawal History</h2>
          </div>
          <div className="p-6">
            {loadingData ? (
              <div className="text-center py-8">Loading...</div>
            ) : payouts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No withdrawals yet. Request your first withdrawal to get paid!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payouts.map((payout) => (
                      <tr key={payout.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(payout.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payout.payout_method === 'momo' ? 'Mobile Money' : 'Bank Transfer'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${payout.status === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : payout.status === 'processing'
                                ? 'bg-blue-100 text-blue-800'
                                : payout.status === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {payout.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(payout.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payout.paid_at ? formatDate(payout.paid_at) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Commission Details */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Commission Details</h2>
            <p className="text-sm text-gray-500">Track your earnings from each sale (95% of order value)</p>
          </div>
          <div className="p-6">
            {commissions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No commissions yet. Start making sales to earn!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Your Earnings (95%)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Platform Fee (5%)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {commissions.map((commission) => (
                      <tr key={commission.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(commission.order_total)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          {formatCurrency(commission.vendor_amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(commission.platform_commission)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${commission.status === 'settled'
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
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Withdrawal Request Modal */}
      {showWithdrawalForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Request Withdrawal</h2>
            <form onSubmit={handleRequestWithdrawal}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (Available: {formatCurrency(stats.pending)})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="10"
                  value={withdrawalData.amount}
                  onChange={(e) => setWithdrawalData({ ...withdrawalData, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Min: GHS 10.00"
                  max={stats.pending}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <select
                  value={withdrawalData.payment_method}
                  onChange={(e) => setWithdrawalData({ ...withdrawalData, payment_method: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="momo">Mobile Money</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>

              {withdrawalData.payment_method === 'momo' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Provider</label>
                  <select
                    value={withdrawalData.provider}
                    onChange={(e) => setWithdrawalData({ ...withdrawalData, provider: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="MTN">MTN Mobile Money</option>
                    <option value="VODAFONE">Vodafone Cash</option>
                    <option value="AIRTELTIGO">AirtelTigo Money</option>
                  </select>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                <input
                  type="text"
                  value={withdrawalData.account_number}
                  onChange={(e) => setWithdrawalData({ ...withdrawalData, account_number: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="0XXXXXXXXX"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Name</label>
                <input
                  type="text"
                  value={withdrawalData.account_name}
                  onChange={(e) => setWithdrawalData({ ...withdrawalData, account_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="Full name on account"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                <textarea
                  value={withdrawalData.notes}
                  onChange={(e) => setWithdrawalData({ ...withdrawalData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  rows="3"
                  placeholder="Any special instructions..."
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Submit Request
                </button>
                <button
                  type="button"
                  onClick={() => setShowWithdrawalForm(false)}
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

export default VendorEarnings;

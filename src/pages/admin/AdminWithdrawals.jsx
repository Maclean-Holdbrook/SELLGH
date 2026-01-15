import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAlert } from '../../contexts/AlertContext';
import { supabase } from '../../config/supabase';
import AdminNavigation from '../../components/AdminNavigation';

const API_URL = import.meta.env.VITE_API_URL;

const AdminWithdrawals = () => {
  const { profile, user, loading, session } = useAuth();
  const navigate = useNavigate();

  const [withdrawals, setWithdrawals] = useState([]);
  const [balance, setBalance] = useState({
    total_commission: 0,
    pending_commission: 0,
    completed_withdrawals: 0,
    pending_withdrawals: 0,
    available_balance: 0
  });

  const [showCreateWithdrawal, setShowCreateWithdrawal] = useState(false);
  const [newWithdrawal, setNewWithdrawal] = useState({
    amount: '',
    withdrawal_method: 'momo',
    account_number: '',
    account_name: '',
    provider: 'MTN',
    bank_name: '',
    notes: ''
  });

  const [loadingData, setLoadingData] = useState(true);

  // Redirect if not admin
  useEffect(() => {
    if (!loading && user && profile && profile.role !== 'admin') {
      navigate('/');
    }
  }, [loading, user, profile, navigate]);

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchBalance();
      fetchWithdrawals();
    }
  }, [profile]);

  const fetchBalance = async () => {
    try {
      console.log('💰 [Withdrawals] Fetching platform balance...');

      // Get current session
      const { data: { session: currentSession } } = await supabase.auth.getSession();

      if (!currentSession?.access_token) {
        console.error('❌ No session token available');
        return;
      }

      console.log('✅ Session token found, calling API...');
      const response = await fetch(`${API_URL}/payouts/admin/balance`, {
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`
        }
      });

      console.log('📡 Balance API response status:', response.status);
      const data = await response.json();
      console.log('📊 Balance API data:', data);

      if (data.success) {
        console.log('✅ Setting balance:', data.data);
        setBalance(data.data);
      } else {
        console.error('❌ API returned success=false:', data.error);
      }
    } catch (error) {
      console.error('❌ Error fetching balance:', error);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      setLoadingData(true);
      console.log('📥 [Withdrawals] Fetching withdrawal history...');

      // Get current session
      const { data: { session: currentSession } } = await supabase.auth.getSession();

      if (!currentSession?.access_token) {
        console.error('❌ No session token available');
        setLoadingData(false);
        return;
      }

      const response = await fetch(`${API_URL}/payouts/admin/withdrawals`, {
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`
        }
      });

      console.log('📡 Withdrawals API response status:', response.status);
      const data = await response.json();
      console.log('📊 Withdrawals API data:', data);

      if (data.success) {
        console.log('✅ Setting withdrawals:', data.data?.length || 0, 'records');
        setWithdrawals(data.data);
      } else {
        console.error('❌ API returned success=false:', data.error);
      }
    } catch (error) {
      console.error('❌ Error fetching withdrawals:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleCreateWithdrawal = async (e) => {
    e.preventDefault();

    if (parseFloat(newWithdrawal.amount) > balance.available_balance) {
      alert.error(`Insufficient balance. Available: GHS ${balance.available_balance.toFixed(2)}`);
      return;
    }

    try {
      // Get current session
      const { data: { session: currentSession } } = await supabase.auth.getSession();

      if (!currentSession?.access_token) {
        alert.error('Session expired. Please refresh the page and try again.');
        return;
      }

      // Prepare account details based on withdrawal method
      const account_details = newWithdrawal.withdrawal_method === 'momo'
        ? {
          account_number: newWithdrawal.account_number,
          account_name: newWithdrawal.account_name,
          provider: newWithdrawal.provider
        }
        : {
          account_number: newWithdrawal.account_number,
          account_name: newWithdrawal.account_name,
          bank_name: newWithdrawal.bank_name
        };

      console.log('📤 Creating withdrawal:', { amount: newWithdrawal.amount, method: newWithdrawal.withdrawal_method });

      const response = await fetch(`${API_URL}/payouts/admin/withdrawals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentSession.access_token}`
        },
        body: JSON.stringify({
          amount: parseFloat(newWithdrawal.amount),
          withdrawal_method: newWithdrawal.withdrawal_method,
          account_details,
          notes: newWithdrawal.notes
        })
      });

      const data = await response.json();

      if (data.success) {
        alert.error('Withdrawal request created successfully!');
        setShowCreateWithdrawal(false);
        setNewWithdrawal({
          amount: '',
          withdrawal_method: 'momo',
          account_number: '',
          account_name: '',
          provider: 'MTN',
          bank_name: '',
          notes: ''
        });
        fetchWithdrawals();
        fetchBalance();
      } else {
        alert.error(data.error || 'Failed to create withdrawal');
      }
    } catch (error) {
      console.error('Error creating withdrawal:', error);
      alert.error('Failed to create withdrawal');
    }
  };

  const handleUpdateWithdrawalStatus = async (withdrawalId, status, transactionRef = '') => {
    try {
      // Get current session
      const { data: { session: currentSession } } = await supabase.auth.getSession();

      if (!currentSession?.access_token) {
        alert.error('Session expired. Please refresh the page and try again.');
        return;
      }

      console.log('📝 Updating withdrawal status:', { withdrawalId, status });

      const response = await fetch(`${API_URL}/payouts/admin/withdrawals/${withdrawalId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentSession.access_token}`
        },
        body: JSON.stringify({
          status,
          transaction_reference: transactionRef
        })
      });

      const data = await response.json();

      if (data.success) {
        alert.error(`Withdrawal marked as ${status}!`);
        fetchWithdrawals();
        fetchBalance();
      } else {
        alert.error(data.error || 'Failed to update withdrawal');
      }
    } catch (error) {
      console.error('Error updating withdrawal:', error);
      alert.error('Failed to update withdrawal');
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
        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Total Commission</div>
            <div className="text-2xl font-bold text-gray-900 mt-2">
              {formatCurrency(balance.total_commission)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Available Balance</div>
            <div className="text-2xl font-bold text-green-600 mt-2">
              {formatCurrency(balance.available_balance)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Pending Withdrawals</div>
            <div className="text-2xl font-bold text-yellow-600 mt-2">
              {formatCurrency(balance.pending_withdrawals)}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500">Completed Withdrawals</div>
            <div className="text-2xl font-bold text-gray-600 mt-2">
              {formatCurrency(balance.completed_withdrawals)}
            </div>
          </div>
        </div>

        {/* Withdrawals Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Withdrawal History</h2>
              <button
                onClick={() => setShowCreateWithdrawal(true)}
                className={`px-4 py-2 rounded-lg ${balance.available_balance <= 0
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                disabled={balance.available_balance <= 0}
                title={balance.available_balance <= 0 ? 'No funds available for withdrawal' : 'Create a new withdrawal'}
              >
                New Withdrawal
              </button>
            </div>
          </div>

          <div className="p-6">
            {balance.available_balance <= 0 && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  No funds available for withdrawal. Your available balance is GHS 0.00
                </p>
              </div>
            )}

            {loadingData ? (
              <div className="text-center py-8">Loading withdrawals...</div>
            ) : withdrawals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No withdrawals yet. Create your first withdrawal to get your commission!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account Details</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {withdrawals.map((withdrawal) => (
                      <tr key={withdrawal.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(withdrawal.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {withdrawal.withdrawal_method === 'momo' ? 'Mobile Money' : 'Bank Transfer'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {withdrawal.account_details?.account_number}
                          <br />
                          <span className="text-xs text-gray-400">
                            {withdrawal.account_details?.provider || withdrawal.account_details?.bank_name}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${withdrawal.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : withdrawal.status === 'processing'
                                ? 'bg-blue-100 text-blue-800'
                                : withdrawal.status === 'failed'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {withdrawal.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(withdrawal.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {withdrawal.status === 'pending' && (
                            <>
                              <button
                                onClick={() => {
                                  const ref = prompt('Enter transaction reference:');
                                  if (ref) {
                                    handleUpdateWithdrawalStatus(withdrawal.id, 'completed', ref);
                                  }
                                }}
                                className="text-green-600 hover:text-green-800 mr-3"
                              >
                                Mark Completed
                              </button>
                              <button
                                onClick={() => handleUpdateWithdrawalStatus(withdrawal.id, 'failed')}
                                className="text-red-600 hover:text-red-800"
                              >
                                Mark Failed
                              </button>
                            </>
                          )}
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

      {/* Create Withdrawal Modal */}
      {showCreateWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Create Withdrawal</h2>
            <form onSubmit={handleCreateWithdrawal}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (Available: {formatCurrency(balance.available_balance)})
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newWithdrawal.amount}
                  onChange={(e) => setNewWithdrawal({ ...newWithdrawal, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="0.00"
                  max={balance.available_balance}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Withdrawal Method</label>
                <select
                  value={newWithdrawal.withdrawal_method}
                  onChange={(e) => setNewWithdrawal({ ...newWithdrawal, withdrawal_method: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="momo">Mobile Money</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>

              {newWithdrawal.withdrawal_method === 'momo' && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Money Provider</label>
                    <select
                      value={newWithdrawal.provider}
                      onChange={(e) => setNewWithdrawal({ ...newWithdrawal, provider: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="MTN">MTN Mobile Money</option>
                      <option value="VODAFONE">Vodafone Cash</option>
                      <option value="AIRTELTIGO">AirtelTigo Money</option>
                    </select>
                  </div>
                </>
              )}

              {newWithdrawal.withdrawal_method === 'bank_transfer' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                  <input
                    type="text"
                    value={newWithdrawal.bank_name}
                    onChange={(e) => setNewWithdrawal({ ...newWithdrawal, bank_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                <input
                  type="text"
                  value={newWithdrawal.account_number}
                  onChange={(e) => setNewWithdrawal({ ...newWithdrawal, account_number: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Name</label>
                <input
                  type="text"
                  value={newWithdrawal.account_name}
                  onChange={(e) => setNewWithdrawal({ ...newWithdrawal, account_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                <textarea
                  value={newWithdrawal.notes}
                  onChange={(e) => setNewWithdrawal({ ...newWithdrawal, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  rows="3"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Create Withdrawal
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateWithdrawal(false)}
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

export default AdminWithdrawals;

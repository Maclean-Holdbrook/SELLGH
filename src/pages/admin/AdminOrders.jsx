import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminNavigation from '../../components/AdminNavigation';

const API_URL = import.meta.env.VITE_API_URL;

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, [filter, paymentFilter]);

  const fetchOrders = async () => {
    try {
      // Get orders from API (bypasses RLS)
      const response = await fetch(`${API_URL}/orders/all`);

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const result = await response.json();
      let ordersList = result.data || [];

      // Apply filters
      if (filter !== 'all') {
        ordersList = ordersList.filter(order => order.status === filter);
      }

      if (paymentFilter !== 'all') {
        ordersList = ordersList.filter(order => order.payment_status === paymentFilter);
      }

      setOrders(ordersList);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-600 text-yellow-100',
      confirmed: 'bg-blue-600 text-blue-100',
      processing: 'bg-purple-600 text-purple-100',
      shipped: 'bg-indigo-600 text-indigo-100',
      delivered: 'bg-green-600 text-green-100',
      cancelled: 'bg-red-600 text-red-100'
    };
    return badges[status] || badges.pending;
  };

  const getPaymentBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-600 text-yellow-100',
      paid: 'bg-green-600 text-green-100',
      failed: 'bg-red-600 text-red-100',
      refunded: 'bg-gray-600 text-gray-100'
    };
    return badges[status] || badges.pending;
  };

  const totalRevenue = orders
    .filter(o => o.payment_status === 'paid')
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);

  const platformCommission = totalRevenue * 0.05;

  return (
    <div className="min-h-screen bg-gray-900">
      <AdminNavigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Stats */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Order Management</h1>
            <p className="text-gray-400 mt-1">
              {orders.length} orders • GH₵ {totalRevenue.toFixed(2)} revenue • GH₵ {platformCommission.toFixed(2)} commission
            </p>
          </div>
          <div className="flex space-x-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-gray-800 text-white px-4 py-2 rounded border border-gray-600"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="bg-gray-800 text-white px-4 py-2 rounded border border-gray-600"
            >
              <option value="all">All Payments</option>
              <option value="pending">Payment Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-750">
                    <td className="px-6 py-4">
                      <div className="text-white font-medium">{order.order_number}</div>
                      <div className="text-gray-400 text-sm">{order.payment_method || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white">{order.customer_name}</div>
                      <div className="text-gray-400 text-sm">{order.customer_email}</div>
                      <div className="text-gray-500 text-xs">{order.customer_phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-300">{order.order_items?.length || 0} items</div>
                      <div className="text-gray-500 text-xs max-w-xs truncate">
                        {order.order_items?.map(item => item.product_name).join(', ')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white font-medium">GH₵ {order.total_amount?.toFixed(2)}</div>
                      <div className="text-green-400 text-xs">5%: GH₵ {(order.total_amount * 0.05).toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getPaymentBadge(order.payment_status)}`}>
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">
                      {new Date(order.created_at).toLocaleDateString()}
                      <div className="text-gray-500 text-xs">
                        {new Date(order.created_at).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to={`/order/${order.id}`}
                        className="px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {orders.length === 0 && (
              <div className="text-center py-12 text-gray-400">No orders found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import AdminNavigation from '../../components/AdminNavigation';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AdminReports = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('all');
  const [reportData, setReportData] = useState({
    totalRevenue: 0,
    platformCommission: 0,
    totalOrders: 0,
    paidOrders: 0,
    pendingOrders: 0,
    averageOrderValue: 0,
    topVendors: [],
    topProducts: [],
    dailyRevenue: [],
    paymentMethods: {}
  });

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);

      // Build date filter
      let dateFilter = null;
      const now = new Date();
      if (dateRange === 'today') {
        dateFilter = new Date(now.setHours(0, 0, 0, 0)).toISOString();
      } else if (dateRange === 'week') {
        dateFilter = new Date(now.setDate(now.getDate() - 7)).toISOString();
      } else if (dateRange === 'month') {
        dateFilter = new Date(now.setMonth(now.getMonth() - 1)).toISOString();
      } else if (dateRange === 'year') {
        dateFilter = new Date(now.setFullYear(now.getFullYear() - 1)).toISOString();
      }

      // Fetch all orders from API (bypasses RLS)
      const ordersResponse = await fetch(`${API_URL}/orders/debug/all-orders`);
      if (!ordersResponse.ok) {
        throw new Error('Failed to fetch orders');
      }

      const ordersResult = await ordersResponse.json();
      let orders = ordersResult.data || [];

      // Apply date filter if needed
      if (dateFilter) {
        orders = orders.filter(order => order.created_at >= dateFilter);
      }

      // Calculate metrics
      const paidOrders = orders?.filter(o => o.payment_status === 'paid') || [];
      const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      const platformCommission = totalRevenue * 0.05;
      const averageOrderValue = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

      // Payment methods breakdown
      const paymentMethods = {};
      paidOrders.forEach(order => {
        const method = order.payment_method || 'unknown';
        if (!paymentMethods[method]) {
          paymentMethods[method] = { count: 0, revenue: 0 };
        }
        paymentMethods[method].count++;
        paymentMethods[method].revenue += order.total_amount || 0;
      });

      // Daily revenue (last 7 days)
      const dailyRevenue = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayOrders = paidOrders.filter(o =>
          o.created_at.startsWith(dateStr)
        );
        dailyRevenue.push({
          date: dateStr,
          revenue: dayOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
          orders: dayOrders.length
        });
      }

      // Top vendors by revenue
      const vendorRevenue = {};
      paidOrders.forEach(order => {
        order.order_items?.forEach(item => {
          if (!vendorRevenue[item.vendor_id]) {
            vendorRevenue[item.vendor_id] = 0;
          }
          vendorRevenue[item.vendor_id] += item.subtotal || 0;
        });
      });

      // Fetch vendor details
      const vendorIds = Object.keys(vendorRevenue);
      let topVendors = [];
      if (vendorIds.length > 0) {
        const { data: vendors } = await supabase
          .from('vendors')
          .select('id, business_name')
          .in('id', vendorIds);

        topVendors = vendors?.map(v => ({
          ...v,
          revenue: vendorRevenue[v.id] || 0
        })).sort((a, b) => b.revenue - a.revenue).slice(0, 5) || [];
      }

      // Top products by quantity sold
      const productSales = {};
      paidOrders.forEach(order => {
        order.order_items?.forEach(item => {
          if (!productSales[item.product_name]) {
            productSales[item.product_name] = { quantity: 0, revenue: 0 };
          }
          productSales[item.product_name].quantity += item.quantity || 0;
          productSales[item.product_name].revenue += item.subtotal || 0;
        });
      });

      const topProducts = Object.entries(productSales)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      setReportData({
        totalRevenue,
        platformCommission,
        totalOrders: orders?.length || 0,
        paidOrders: paidOrders.length,
        pendingOrders: orders?.filter(o => o.payment_status === 'pending').length || 0,
        averageOrderValue,
        topVendors,
        topProducts,
        dailyRevenue,
        paymentMethods
      });

    } catch (err) {
      console.error('Error fetching report data:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Revenue', `GH₵ ${reportData.totalRevenue.toFixed(2)}`],
      ['Platform Commission (5%)', `GH₵ ${reportData.platformCommission.toFixed(2)}`],
      ['Total Orders', reportData.totalOrders],
      ['Paid Orders', reportData.paidOrders],
      ['Pending Orders', reportData.pendingOrders],
      ['Average Order Value', `GH₵ ${reportData.averageOrderValue.toFixed(2)}`],
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sellgh-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <AdminNavigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Financial Reports</h1>
            <p className="text-gray-400 mt-1">Platform performance and revenue analytics</p>
          </div>
          <div className="flex space-x-4">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-gray-800 text-white px-4 py-2 rounded border border-gray-600"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="year">Last Year</option>
            </select>
            <button
              onClick={exportToCSV}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Export CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-green-900 p-6 rounded-lg border border-green-700">
                <h3 className="text-sm font-medium text-green-400">Total Revenue</h3>
                <p className="mt-2 text-3xl font-bold text-green-300">GH₵ {reportData.totalRevenue.toFixed(2)}</p>
              </div>
              <div className="bg-indigo-900 p-6 rounded-lg border border-indigo-700">
                <h3 className="text-sm font-medium text-indigo-400">Platform Commission (5%)</h3>
                <p className="mt-2 text-3xl font-bold text-indigo-300">GH₵ {reportData.platformCommission.toFixed(2)}</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h3 className="text-sm font-medium text-gray-400">Average Order Value</h3>
                <p className="mt-2 text-3xl font-bold text-white">GH₵ {reportData.averageOrderValue.toFixed(2)}</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h3 className="text-sm font-medium text-gray-400">Total Orders</h3>
                <p className="mt-2 text-3xl font-bold text-white">{reportData.totalOrders}</p>
              </div>
              <div className="bg-green-900 p-6 rounded-lg border border-green-700">
                <h3 className="text-sm font-medium text-green-400">Paid Orders</h3>
                <p className="mt-2 text-3xl font-bold text-green-300">{reportData.paidOrders}</p>
              </div>
              <div className="bg-yellow-900 p-6 rounded-lg border border-yellow-700">
                <h3 className="text-sm font-medium text-yellow-400">Pending Orders</h3>
                <p className="mt-2 text-3xl font-bold text-yellow-300">{reportData.pendingOrders}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Daily Revenue Chart */}
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h2 className="text-lg font-semibold text-white mb-4">Daily Revenue (Last 7 Days)</h2>
                <div className="space-y-3">
                  {reportData.dailyRevenue.map((day, index) => (
                    <div key={index} className="flex items-center">
                      <span className="text-gray-400 w-24 text-sm">{new Date(day.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })}</span>
                      <div className="flex-1 mx-4">
                        <div className="bg-gray-700 rounded-full h-4">
                          <div
                            className="bg-indigo-500 rounded-full h-4"
                            style={{
                              width: `${Math.min(100, (day.revenue / Math.max(...reportData.dailyRevenue.map(d => d.revenue), 1)) * 100)}%`
                            }}
                          ></div>
                        </div>
                      </div>
                      <span className="text-white font-medium w-28 text-right">GH₵ {day.revenue.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Methods */}
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h2 className="text-lg font-semibold text-white mb-4">Payment Methods</h2>
                {Object.keys(reportData.paymentMethods).length === 0 ? (
                  <p className="text-gray-500">No payment data available</p>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(reportData.paymentMethods).map(([method, data]) => (
                      <div key={method} className="flex justify-between items-center p-3 bg-gray-700 rounded">
                        <div>
                          <span className="text-white font-medium capitalize">{method.replace('_', ' ')}</span>
                          <span className="text-gray-400 text-sm ml-2">({data.count} orders)</span>
                        </div>
                        <span className="text-green-400 font-medium">GH₵ {data.revenue.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Vendors */}
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h2 className="text-lg font-semibold text-white mb-4">Top Vendors by Revenue</h2>
                {reportData.topVendors.length === 0 ? (
                  <p className="text-gray-500">No vendor data available</p>
                ) : (
                  <div className="space-y-3">
                    {reportData.topVendors.map((vendor, index) => (
                      <div key={vendor.id} className="flex justify-between items-center p-3 bg-gray-700 rounded">
                        <div className="flex items-center">
                          <span className="text-indigo-400 font-bold mr-3">#{index + 1}</span>
                          <span className="text-white">{vendor.business_name}</span>
                        </div>
                        <span className="text-green-400 font-medium">GH₵ {vendor.revenue.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Products */}
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h2 className="text-lg font-semibold text-white mb-4">Top Selling Products</h2>
                {reportData.topProducts.length === 0 ? (
                  <p className="text-gray-500">No product data available</p>
                ) : (
                  <div className="space-y-3">
                    {reportData.topProducts.map((product, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-700 rounded">
                        <div className="flex items-center">
                          <span className="text-indigo-400 font-bold mr-3">#{index + 1}</span>
                          <div>
                            <span className="text-white block">{product.name}</span>
                            <span className="text-gray-400 text-sm">{product.quantity} units sold</span>
                          </div>
                        </div>
                        <span className="text-green-400 font-medium">GH₵ {product.revenue.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminReports;

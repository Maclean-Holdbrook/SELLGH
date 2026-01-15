import { useState, useEffect } from 'react';
import AdminNavigation from '../../components/AdminNavigation';

const API_URL = import.meta.env.VITE_API_URL;

const AdminVendors = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchVendors();
  }, [filter]);

  const fetchVendors = async () => {
    try {
      const url = filter === 'all'
        ? `${API_URL}/vendors`
        : `${API_URL}/vendors?status=${filter}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch vendors');

      const data = await response.json();
      setVendors(data.vendors || []);
    } catch (err) {
      console.error('Error fetching vendors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (vendorId) => {
    try {
      const response = await fetch(`${API_URL}/vendors/${vendorId}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verification_status: 'approved',
          is_verified: true
        })
      });

      if (!response.ok) throw new Error('Failed to approve vendor');
      fetchVendors();
    } catch (err) {
      console.error('Error approving vendor:', err);
    }
  };

  const handleReject = async (vendorId) => {
    try {
      const response = await fetch(`${API_URL}/vendors/${vendorId}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verification_status: 'rejected',
          is_verified: false
        })
      });

      if (!response.ok) throw new Error('Failed to reject vendor');
      fetchVendors();
    } catch (err) {
      console.error('Error rejecting vendor:', err);
    }
  };

  const handleSuspend = async (vendorId) => {
    try {
      const response = await fetch(`${API_URL}/vendors/${vendorId}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verification_status: 'suspended',
          is_verified: false
        })
      });

      if (!response.ok) throw new Error('Failed to suspend vendor');
      fetchVendors();
    } catch (err) {
      console.error('Error suspending vendor:', err);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-600 text-yellow-100',
      approved: 'bg-green-600 text-green-100',
      rejected: 'bg-red-600 text-red-100',
      suspended: 'bg-gray-600 text-gray-100'
    };
    return badges[status] || badges.pending;
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <AdminNavigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Vendor Management</h1>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-gray-800 text-white px-4 py-2 rounded border border-gray-600"
          >
            <option value="all">All Vendors</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
          </select>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Business</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Owner</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {vendors.map((vendor) => (
                  <tr key={vendor.id}>
                    <td className="px-6 py-4">
                      <div className="text-white font-medium">{vendor.business_name}</div>
                      <div className="text-gray-400 text-sm">{vendor.business_address}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white">{vendor.users?.full_name}</div>
                      <div className="text-gray-400 text-sm">{vendor.users?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-300">{vendor.business_phone || vendor.phone || 'N/A'}</div>
                      <div className="text-gray-400 text-sm">{vendor.mtn_momo_number || vendor.momo_number || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(vendor.verification_status)}`}>
                        {vendor.verification_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm">
                      {new Date(vendor.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        {vendor.verification_status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(vendor.id)}
                              className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(vendor.id)}
                              className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {vendor.verification_status === 'approved' && (
                          <button
                            onClick={() => handleSuspend(vendor.id)}
                            className="px-2 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700"
                          >
                            Suspend
                          </button>
                        )}
                        {(vendor.verification_status === 'rejected' || vendor.verification_status === 'suspended') && (
                          <button
                            onClick={() => handleApprove(vendor.id)}
                            className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                          >
                            Activate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {vendors.length === 0 && (
              <div className="text-center py-12 text-gray-400">No vendors found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminVendors;

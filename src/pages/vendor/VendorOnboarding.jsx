import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAlert } from '../../contexts/AlertContext';
import VendorNavigation from '../../components/VendorNavigation';

const API_URL = import.meta.env.VITE_API_URL;

const VendorOnboarding = () => {
  const [formData, setFormData] = useState({
    business_name: '',
    business_description: '',
    business_address: '',
    business_phone: '',
    business_email: '',
    mtn_momo_number: '',
    vodafone_cash_number: '',
    airteltigo_number: '',
  });
  const [loading, setLoading] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const { vendorProfile, refreshVendorProfile, loading: authLoading, session } = useAuth();
  const alert = useAlert();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (vendorProfile) {
      navigate('/vendor/dashboard', { replace: true });
      return;
    }

    setCheckingProfile(false);
  }, [vendorProfile, navigate, authLoading]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/vendors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create vendor profile');
      }

      if (refreshVendorProfile) {
        await refreshVendorProfile();
      }

      navigate('/vendor/dashboard', { replace: true });
    } catch (err) {
      console.error('Error creating vendor profile:', err);
      alert.error(err.message || 'Failed to create vendor profile. Please try again.');
      setLoading(false);
    }
  };

  if (checkingProfile || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <VendorNavigation />
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Complete Your Vendor Profile</h2>
            <p className="mt-2 text-sm text-gray-600">Fill in your business details to start selling on SellGH</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Business Information</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="business_name" className="block text-sm font-medium text-gray-700">Business Name *</label>
                  <input id="business_name" name="business_name" type="text" required value={formData.business_name} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="Your Business Name" />
                </div>

                <div>
                  <label htmlFor="business_description" className="block text-sm font-medium text-gray-700">Business Description *</label>
                  <textarea id="business_description" name="business_description" required rows="4" value={formData.business_description} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="Tell customers about your business..." />
                </div>

                <div>
                  <label htmlFor="business_address" className="block text-sm font-medium text-gray-700">Business Address *</label>
                  <textarea id="business_address" name="business_address" required rows="2" value={formData.business_address} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="Your business address" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="business_phone" className="block text-sm font-medium text-gray-700">Business Phone *</label>
                    <input id="business_phone" name="business_phone" type="tel" required value={formData.business_phone} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="0XX XXX XXXX" />
                  </div>

                  <div>
                    <label htmlFor="business_email" className="block text-sm font-medium text-gray-700">Business Email *</label>
                    <input id="business_email" name="business_email" type="email" required value={formData.business_email} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="business@example.com" />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h3>
              <p className="text-sm text-gray-600 mb-4">Provide at least one mobile money number to receive payments</p>
              <div className="space-y-4">
                <div>
                  <label htmlFor="mtn_momo_number" className="block text-sm font-medium text-gray-700">MTN Mobile Money Number</label>
                  <input id="mtn_momo_number" name="mtn_momo_number" type="tel" value={formData.mtn_momo_number} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="024 XXX XXXX" />
                </div>

                <div>
                  <label htmlFor="vodafone_cash_number" className="block text-sm font-medium text-gray-700">Vodafone Cash Number</label>
                  <input id="vodafone_cash_number" name="vodafone_cash_number" type="tel" value={formData.vodafone_cash_number} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="020 XXX XXXX" />
                </div>

                <div>
                  <label htmlFor="airteltigo_number" className="block text-sm font-medium text-gray-700">AirtelTigo Number</label>
                  <input id="airteltigo_number" name="airteltigo_number" type="tel" value={formData.airteltigo_number} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="027 XXX XXXX" />
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Your vendor account will be reviewed by our team. You&apos;ll be notified once verified and can start adding products.
              </p>
            </div>

            <div className="flex gap-4">
              <button type="button" onClick={() => navigate('/vendor/dashboard')} className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'Submitting...' : 'Submit for Verification'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VendorOnboarding;

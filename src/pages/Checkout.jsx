import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useAlert } from '../contexts/AlertContext';

const API_URL = import.meta.env.VITE_API_URL;

const Checkout = () => {
  const { user, profile, session } = useAuth();
  const { cartItems, getCartTotal, getItemsByVendor, getCartCount } = useCart();
  const alert = useAlert();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    region: '',
    notes: '',
    payment_method: 'card',
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      full_name: profile?.full_name || prev.full_name,
      email: user?.email || prev.email,
      phone: profile?.phone || prev.phone,
    }));
  }, [profile, user]);

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
      if (!session?.access_token) {
        alert.error('Session expired. Please log in again.');
        setLoading(false);
        return;
      }

      if (cartItems.length === 0) {
        alert.error('Your cart is empty');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/orders/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          customer_name: formData.full_name,
          customer_email: formData.email,
          customer_phone: formData.phone,
          shipping_address: formData.address,
          shipping_city: formData.city,
          shipping_region: formData.region,
          notes: formData.notes,
          payment_method: formData.payment_method,
          cart_items: cartItems.map((item) => ({
            product_id: item.id,
            quantity: item.quantity,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create checkout');
      }

      localStorage.setItem('pending_order', JSON.stringify({
        order_id: result.data.order_id,
        cart_items: cartItems,
      }));

      alert.info('Redirecting to payment gateway...');
      window.location.href = result.data.authorization_url;
    } catch (err) {
      console.error('Checkout error:', err);
      alert.error(err.message || 'Failed to place order. Please try again.');
      setLoading(false);
    }
  };

  if (!user) {
    return <Navigate to="/login" state={{ from: { pathname: '/checkout' } }} replace />;
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h2>
          <Link to="/shop" className="text-indigo-600 hover:text-indigo-700">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const itemsByVendor = getItemsByVendor();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/">
                <h1 className="text-2xl font-bold text-indigo-600">SellGH</h1>
              </Link>
            </div>
            <div className="flex items-center">
              <span className="text-gray-600">Secure Checkout</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input type="text" name="full_name" required value={formData.full_name} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                    <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} placeholder="0XX XXX XXXX" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                    <textarea name="address" required rows="2" value={formData.address} onChange={handleChange} placeholder="Street address, house number, landmark..." className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                      <input type="text" name="city" required value={formData.city} onChange={handleChange} placeholder="e.g., Accra" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Region *</label>
                      <select name="region" required value={formData.region} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="">Select Region</option>
                        <option value="Greater Accra">Greater Accra</option>
                        <option value="Ashanti">Ashanti</option>
                        <option value="Western">Western</option>
                        <option value="Eastern">Eastern</option>
                        <option value="Central">Central</option>
                        <option value="Northern">Northern</option>
                        <option value="Volta">Volta</option>
                        <option value="Upper East">Upper East</option>
                        <option value="Upper West">Upper West</option>
                        <option value="Brong-Ahafo">Brong-Ahafo</option>
                        <option value="Western North">Western North</option>
                        <option value="Ahafo">Ahafo</option>
                        <option value="Bono East">Bono East</option>
                        <option value="Oti">Oti</option>
                        <option value="North East">North East</option>
                        <option value="Savannah">Savannah</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Notes (Optional)</h2>
                <textarea name="notes" rows="3" value={formData.notes} onChange={handleChange} placeholder="Any special instructions for your order..." className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h2>
                <div className="space-y-3">
                  <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input type="radio" name="payment_method" value="card" checked={formData.payment_method === 'card'} onChange={handleChange} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500" />
                    <div className="ml-3">
                      <span className="font-medium text-gray-900">Pay with Card</span>
                      <p className="text-sm text-gray-500">Pay securely with your debit/credit card</p>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input type="radio" name="payment_method" value="momo" checked={formData.payment_method === 'momo'} onChange={handleChange} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500" />
                    <div className="ml-3">
                      <span className="font-medium text-gray-900">Mobile Money</span>
                      <p className="text-sm text-gray-500">Pay with MTN, Vodafone Cash, or AirtelTigo</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="lg:hidden">
                <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-3 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50">
                  {loading ? 'Placing Order...' : `Place Order - GH₵ ${getCartTotal().toFixed(2)}`}
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                {itemsByVendor.map((vendorGroup) => (
                  <div key={vendorGroup.vendor_id}>
                    <p className="text-sm font-medium text-gray-600 mb-2">{vendorGroup.vendor_name}</p>
                    {vendorGroup.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm py-1">
                        <span className="text-gray-600">{item.name} x {item.quantity}</span>
                        <span className="text-gray-900">GH₵ {(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({getCartCount()} items)</span>
                  <span>GH₵ {getCartTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between text-lg font-semibold text-gray-900 pt-2 border-t">
                  <span>Total</span>
                  <span>GH₵ {getCartTotal().toFixed(2)}</span>
                </div>
              </div>

              <button type="submit" form="checkout-form" disabled={loading} className="hidden lg:block w-full mt-6 bg-indigo-600 text-white py-3 rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50">
                {loading ? 'Placing Order...' : 'Place Order'}
              </button>

              <Link to="/cart" className="block text-center mt-4 text-indigo-600 hover:text-indigo-700 text-sm">
                Edit Cart
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

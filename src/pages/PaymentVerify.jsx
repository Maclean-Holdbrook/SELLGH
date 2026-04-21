import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAlert } from '../contexts/AlertContext';
import { useAuth } from '../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL;

const PaymentVerify = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart, getCartTotal } = useCart();
  const alert = useAlert();
  const { session, user } = useAuth();
  const [status, setStatus] = useState('verifying');
  const [error, setError] = useState('');
  const [retrying, setRetrying] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null);

  useEffect(() => {
    const verifyPayment = async () => {
      const reference = searchParams.get('reference');

      if (!reference) {
        setStatus('failed');
        setError('No payment reference found');
        return;
      }

      try {
        const savedPendingOrder = localStorage.getItem('pending_order');
        if (savedPendingOrder) {
          setPendingOrder(JSON.parse(savedPendingOrder));
        }

        const response = await fetch(`${API_URL}/payments/verify/${reference}`);
        const data = await response.json();

        if (data.success && data.data.status === 'success') {
          clearCart();
          localStorage.removeItem('pending_order');
          alert.success('Payment successful. Redirecting to shop...');
          window.location.replace(`${window.location.origin}/shop`);
          return;
        }

        setStatus('failed');
        setError(data.error || 'Payment verification failed');
      } catch (err) {
        console.error('Payment verification error:', err);
        setStatus('failed');
        setError('Failed to verify payment. Please contact support.');
      }
    };

    verifyPayment();
  }, [searchParams, clearCart, navigate, alert]);

  const handleRetryPayment = async () => {
    if (!pendingOrder?.order_id) {
      alert.error('No pending order found to retry.');
      return;
    }

    if (!session?.access_token) {
      alert.error('Session expired. Please log in again before retrying payment.');
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
      return;
    }

    const retryAmount =
      pendingOrder.amount
      ?? (pendingOrder.cart_items || []).reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 0)), 0)
      ?? getCartTotal();

    const paymentMethod = pendingOrder.payment_method || 'card';
    const customerEmail = pendingOrder.customer_email || user?.email;

    if (!customerEmail || !retryAmount) {
      alert.error('Missing payment details. Please return to checkout.');
      return;
    }

    setRetrying(true);

    try {
      const response = await fetch(`${API_URL}/payments/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          order_id: pendingOrder.order_id,
          email: customerEmail,
          amount: retryAmount,
          payment_method: paymentMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to retry payment');
      }

      localStorage.setItem('pending_order', JSON.stringify({
        ...pendingOrder,
        amount: retryAmount,
        customer_email: customerEmail,
        payment_method: paymentMethod,
      }));

      alert.info('Redirecting to payment gateway...');
      window.location.href = data.data.authorization_url;
    } catch (err) {
      console.error('Retry payment error:', err);
      alert.error(err.message || 'Failed to retry payment.');
      setRetrying(false);
    }
  };

  if (status === 'verifying') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900">Verifying your payment...</h2>
          <p className="text-gray-600 mt-2">Please wait while we confirm your payment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h2>
        <p className="text-gray-600 mb-6">{error}</p>

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleRetryPayment}
            disabled={retrying}
            className="block w-full bg-indigo-600 text-white py-3 rounded-md font-medium hover:bg-indigo-700"
          >
            {retrying ? 'Retrying Payment...' : 'Try Payment Again'}
          </button>
          <Link
            to="/checkout"
            className="block w-full border border-gray-300 text-gray-700 py-3 rounded-md font-medium hover:bg-gray-50"
          >
            Back to Checkout
          </Link>
          <Link
            to="/shop"
            className="block w-full border border-gray-300 text-gray-700 py-3 rounded-md font-medium hover:bg-gray-50"
          >
            Continue Shopping
          </Link>
        </div>

        <p className="mt-6 text-sm text-gray-500">Need help? Contact our support team</p>
      </div>
    </div>
  );
};

export default PaymentVerify;

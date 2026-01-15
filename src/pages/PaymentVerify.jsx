import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';

const API_URL = import.meta.env.VITE_API_URL;

const PaymentVerify = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();

  const [status, setStatus] = useState('verifying'); // verifying, success, failed
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyPayment = async () => {
      const reference = searchParams.get('reference');

      if (!reference) {
        setStatus('failed');
        setError('No payment reference found');
        return;
      }

      try {
        const response = await fetch(`${API_URL}/payments/verify/${reference}`);
        const data = await response.json();

        if (data.success && data.data.status === 'success') {
          setStatus('success');
          setOrderData(data.data);

          // Clear cart after successful payment
          clearCart();

          // Remove pending order from localStorage
          localStorage.removeItem('pending_order');

          // Automatic redirect to shop after 2 seconds
          setTimeout(() => {
            navigate('/shop');
          }, 2000);
        } else {
          setStatus('failed');
          setError(data.error || 'Payment verification failed');
        }
      } catch (err) {
        console.error('Payment verification error:', err);
        setStatus('failed');
        setError('Failed to verify payment. Please contact support.');
      }
    };

    verifyPayment();
  }, [searchParams, clearCart]);

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

  if (status === 'failed') {
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
            <Link
              to="/checkout"
              className="block w-full bg-indigo-600 text-white py-3 rounded-md font-medium hover:bg-indigo-700"
            >
              Try Again
            </Link>
            <Link
              to="/shop"
              className="block w-full border border-gray-300 text-gray-700 py-3 rounded-md font-medium hover:bg-gray-50"
            >
              Continue Shopping
            </Link>
          </div>

          <p className="mt-6 text-sm text-gray-500">
            Need help? Contact our support team
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
        <p className="text-gray-600 mb-6">Thank you for your purchase</p>

        {orderData && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Order Number:</span>
              <span className="font-semibold">{orderData.order_number}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Amount Paid:</span>
              <span className="font-semibold">GH₵ {orderData.amount?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Date:</span>
              <span className="font-semibold">
                {orderData.paid_at ? new Date(orderData.paid_at).toLocaleDateString() : 'Just now'}
              </span>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {orderData && (
            <Link
              to={`/order-success/${orderData.order_id}`}
              className="block w-full bg-indigo-600 text-white py-3 rounded-md font-medium hover:bg-indigo-700"
            >
              View Order Details
            </Link>
          )}
          <Link
            to="/shop"
            className="block w-full border border-gray-300 text-gray-700 py-3 rounded-md font-medium hover:bg-gray-50"
          >
            Continue Shopping
          </Link>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          A confirmation email has been sent to your email address
        </p>
      </div>
    </div>
  );
};

export default PaymentVerify;

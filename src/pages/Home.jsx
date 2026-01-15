import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';

const Home = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect signed-in users to shop
  useEffect(() => {
    if (!loading && user) {
      navigate('/shop');
    }
  }, [user, loading, navigate]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // If user is logged in, they'll be redirected (this prevents flash)
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col bg-cover bg-center bg-fixed"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://images.unsplash.com/photo-1557821552-17105176677c?w=1920&h=1080&fit=crop')`,
      }}
    >
      {/* Navigation */}
      <Navbar activePage="home" />

      {/* Hero Section - Centered */}
      <div className="flex-grow flex items-center relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-white sm:text-5xl md:text-6xl">
              Welcome to <span className="text-indigo-400">SellGH</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-100 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Ghana's premier multi-vendor marketplace. Discover unique products from local vendors
              or start selling your own products today.
            </p>
            <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
              <div className="rounded-md shadow">
                <Link
                  to="/products"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
                >
                  Start Shopping
                </Link>
              </div>
              <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                <Link
                  to="/signup"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                >
                  Become a Vendor
                </Link>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-white bg-opacity-95 backdrop-blur-sm p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                <h3 className="text-lg font-semibold text-gray-900">Wide Selection</h3>
                <p className="mt-2 text-gray-600">
                  Browse products from multiple verified vendors in one place
                </p>
              </div>
              <div className="bg-white bg-opacity-95 backdrop-blur-sm p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                <h3 className="text-lg font-semibold text-gray-900">Secure Payments</h3>
                <p className="mt-2 text-gray-600">
                  Pay safely with card or mobile money (MTN, Vodafone, AirtelTigo)
                </p>
              </div>
              <div className="bg-white bg-opacity-95 backdrop-blur-sm p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                <h3 className="text-lg font-semibold text-gray-900">Easy Selling</h3>
                <p className="mt-2 text-gray-600">
                  Start your business with our simple vendor onboarding process
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white bg-opacity-95 backdrop-blur-sm border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">SellGH</h3>
              <p className="text-gray-600 text-sm">
                Ghana's premier multi-vendor marketplace connecting buyers with local vendors.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/products" className="text-gray-600 hover:text-indigo-600 text-sm">
                    Browse Products
                  </Link>
                </li>
                <li>
                  <Link to="/signup" className="text-gray-600 hover:text-indigo-600 text-sm">
                    Become a Vendor
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="text-gray-600 hover:text-indigo-600 text-sm">
                    Sign In
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Email: support@sellgh.com</li>
                <li>Phone: +233 20 928 7952</li>
                <li>Address: Accra, Ghana</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} SellGH. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;

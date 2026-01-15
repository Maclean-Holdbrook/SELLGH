import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const VendorNavigation = () => {
  const { profile, vendorProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/'); // Redirect to homepage
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand Name - Left */}
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-indigo-600">
              SellGH
            </Link>
            <span className="ml-2 px-2 py-1 text-xs font-semibold bg-indigo-600 text-white rounded">
              VENDOR
            </span>
          </div>

          {/* Desktop Navigation - Hidden on Mobile */}
          <div className="hidden lg:flex items-center space-x-4">
            <Link to="/vendor/dashboard" className="text-gray-700 hover:text-gray-900">
              Dashboard
            </Link>
            {vendorProfile && (
              <>
                <Link to="/vendor/products/new" className="text-gray-700 hover:text-gray-900">
                  Add Product
                </Link>
                <Link to="/vendor/products" className="text-gray-700 hover:text-gray-900">
                  Products
                </Link>
                <Link to="/vendor/orders" className="text-gray-700 hover:text-gray-900">
                  Orders
                </Link>
                <Link to="/vendor/earnings" className="text-green-600 hover:text-green-700">
                  Earnings
                </Link>
              </>
            )}
            {!vendorProfile && (
              <Link to="/vendor/onboarding" className="text-indigo-600 hover:text-indigo-700">
                Complete Setup
              </Link>
            )}
            <span className="text-sm text-gray-700">
              {profile?.full_name}
            </span>
            <button
              onClick={handleSignOut}
              className="text-gray-700 hover:text-gray-900"
            >
              Sign out
            </button>
          </div>

          {/* Mobile Hamburger Menu - Hidden on Desktop */}
          <div className="lg:hidden relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 focus:outline-none"
            >
              <div className="flex flex-col space-y-1.5 w-6">
                <span className={`block h-0.5 w-6 bg-gray-600 transition-transform ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                <span className={`block h-0.5 w-6 bg-gray-600 transition-opacity ${isMenuOpen ? 'opacity-0' : ''}`}></span>
                <span className={`block h-0.5 w-6 bg-gray-600 transition-transform ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
              </div>
            </button>

            {/* Mobile Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                <div className="py-2">
                  {/* User Info */}
                  <div className="px-4 py-2 border-b border-gray-200">
                    <p className="text-xs text-gray-500">Signed in as</p>
                    <p className="text-sm font-medium text-gray-900 truncate">{profile?.full_name}</p>
                    {vendorProfile && (
                      <p className="text-xs text-gray-500 truncate">{vendorProfile.business_name}</p>
                    )}
                  </div>

                  {/* Navigation Links */}
                  <div className="py-2">
                    <Link
                      to="/vendor/dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    {vendorProfile && (
                      <>
                        <Link
                          to="/vendor/products/new"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Add New Product
                        </Link>
                        <Link
                          to="/vendor/products"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Manage Products
                        </Link>
                        <Link
                          to="/vendor/orders"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          View Orders
                        </Link>
                        <Link
                          to="/vendor/earnings"
                          className="block px-4 py-2 text-sm text-green-600 hover:bg-gray-50 hover:text-green-700"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Earnings & Withdraw
                        </Link>
                      </>
                    )}
                    {!vendorProfile && (
                      <Link
                        to="/vendor/onboarding"
                        className="block px-4 py-2 text-sm text-indigo-600 hover:bg-gray-50"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Complete Vendor Setup
                      </Link>
                    )}
                  </div>

                  {/* Sign Out */}
                  <div className="border-t border-gray-200 pt-2">
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 hover:text-red-700"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default VendorNavigation;

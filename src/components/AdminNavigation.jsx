import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AdminNavigation = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/'); // Redirect to homepage
  };

  return (
    <nav className="bg-gray-800 shadow-lg border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand Name - Left */}
          <div className="flex items-center">
            <span className="text-2xl font-bold text-indigo-400">
              SellGH
            </span>
            <span className="ml-2 px-2 py-1 text-xs font-semibold bg-red-600 text-white rounded">
              ADMIN
            </span>
          </div>

          {/* Desktop Navigation - Hidden on Mobile */}
          <div className="hidden lg:flex items-center space-x-6">
            <Link to="/sellgh-admin/dashboard" className="text-gray-400 hover:text-white">
              Dashboard
            </Link>
            <Link to="/sellgh-admin/vendors" className="text-gray-400 hover:text-white">
              Vendors
            </Link>
            <Link to="/sellgh-admin/products" className="text-gray-400 hover:text-white">
              Products
            </Link>
            <Link to="/sellgh-admin/payouts" className="text-gray-400 hover:text-white">
              Payouts
            </Link>
            <Link to="/sellgh-admin/withdrawals" className="text-gray-400 hover:text-white">
              Withdrawals
            </Link>
            <Link to="/sellgh-admin/reports" className="text-gray-400 hover:text-white">
              Reports
            </Link>
            <span className="text-sm text-gray-400">
              {profile?.full_name || profile?.email}
            </span>
            <button
              onClick={handleSignOut}
              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
            >
              Sign out
            </button>
          </div>

          {/* Mobile Hamburger Menu - Hidden on Desktop */}
          <div className="lg:hidden relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center space-x-2 text-gray-400 hover:text-white focus:outline-none"
            >
              <div className="flex flex-col space-y-1.5 w-6">
                <span className={`block h-0.5 w-6 bg-gray-400 transition-transform ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                <span className={`block h-0.5 w-6 bg-gray-400 transition-opacity ${isMenuOpen ? 'opacity-0' : ''}`}></span>
                <span className={`block h-0.5 w-6 bg-gray-400 transition-transform ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
              </div>
            </button>

            {/* Mobile Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                <div className="py-2">
                  {/* User Info */}
                  <div className="px-4 py-2 border-b border-gray-700">
                    <p className="text-sm text-gray-400">Signed in as</p>
                    <p className="text-sm font-medium text-white truncate">{profile?.full_name || profile?.email}</p>
                  </div>

                  {/* Navigation Links */}
                  <div className="py-2">
                    <Link
                      to="/sellgh-admin/dashboard"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/sellgh-admin/vendors"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Vendors
                    </Link>
                    <Link
                      to="/sellgh-admin/products"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Products
                    </Link>
                    <Link
                      to="/sellgh-admin/payouts"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Payouts
                    </Link>
                    <Link
                      to="/sellgh-admin/withdrawals"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Withdrawals
                    </Link>
                    <Link
                      to="/sellgh-admin/reports"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Reports
                    </Link>
                  </div>

                  {/* Sign Out */}
                  <div className="border-t border-gray-700 pt-2">
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300"
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

export default AdminNavigation;

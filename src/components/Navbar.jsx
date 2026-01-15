import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useAlert } from '../contexts/AlertContext';
import { supabase } from '../config/supabase';

const API_URL = import.meta.env.VITE_API_URL;

const Navbar = ({ activePage = '' }) => {
  const { user, profile, signOut } = useAuth();
  const { getCartCount } = useCart();
  const { getWishlistCount } = useWishlist();
  const alert = useAlert();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleLogout = async () => {
    await signOut();
    setIsMenuOpen(false);
    navigate('/');
  };

  const handleUpgradeToVendor = async () => {
    const confirmed = await alert.confirm(
      'You will be redirected to complete your vendor profile and can start selling products after approval.',
      {
        title: 'Upgrade to Vendor Account',
        confirmText: 'Yes, Upgrade',
        cancelText: 'Cancel',
        type: 'info'
      }
    );

    if (!confirmed) {
      return;
    }

    setIsUpgrading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert.error('Please log in again');
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_URL}/users/upgrade-to-vendor`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upgrade account');
      }

      alert.success('Account upgraded successfully! Redirecting to vendor onboarding...');
      window.location.reload(); // Reload to update the auth context
      navigate('/vendor/onboarding');
    } catch (error) {
      console.error('Error upgrading account:', error);
      alert.error(error.message || 'Failed to upgrade account. Please try again.');
    } finally {
      setIsUpgrading(false);
    }
  };

  // Navigation links (to be shown in hamburger menu on mobile)
  const navLinks = [
    { to: '/', label: 'Home', show: true },
    { to: '/shop', label: 'Shop', show: true },
    { to: '/about', label: 'About', show: true },
    { to: '/support', label: 'Support', show: true },
    { to: '/orders', label: 'Orders', show: user && profile?.role === 'customer' },
  ];

  return (
    <>
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Left: Logo and Brand Name */}
            <div className="flex items-center">
              <Link to="/" onClick={() => setIsMenuOpen(false)}>
                <h1 className="text-2xl font-bold text-indigo-600">SellGH</h1>
              </Link>
              <p className="ml-3 text-xs sm:text-sm text-gray-600 hidden sm:block">
                Sell anything, reach everyone
              </p>
            </div>

            {/* Center Navigation Links - Desktop Only */}
            <div className="hidden md:flex items-center space-x-8">
              {navLinks
                .filter(link => link.show)
                .map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`font-medium ${activePage === link.label.toLowerCase()
                        ? 'text-indigo-600'
                        : 'text-gray-700 hover:text-indigo-600'
                      }`}
                  >
                    {link.label}
                  </Link>
                ))}
            </div>

            {/* Right: Icons and Auth - Desktop */}
            <div className="hidden md:flex items-center space-x-4">
              {/* Wishlist Icon */}
              <Link to="/wishlist" className="relative p-2 text-gray-700 hover:text-indigo-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                {getWishlistCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {getWishlistCount()}
                  </span>
                )}
              </Link>

              {/* Cart Icon */}
              <Link to="/cart" className="relative p-2 text-gray-700 hover:text-indigo-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {getCartCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {getCartCount()}
                  </span>
                )}
              </Link>

              {/* Auth Buttons */}
              {user ? (
                <>
                  <span className="text-sm text-gray-700">
                    Welcome, {profile?.full_name || user.email}
                  </span>
                  {profile?.role === 'vendor' && (
                    <Link
                      to="/vendor/dashboard"
                      className="text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Dashboard
                    </Link>
                  )}
                  {profile?.role === 'customer' && (
                    <button
                      onClick={handleUpgradeToVendor}
                      disabled={isUpgrading}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-medium text-sm disabled:opacity-50"
                    >
                      {isUpgrading ? 'Upgrading...' : 'Become a Vendor'}
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 font-medium text-sm"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-gray-700 hover:text-gray-900 font-medium">
                    Sign in
                  </Link>
                  <Link
                    to="/signup"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 font-medium"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>

            {/* Right: Mobile - User Icon (only when not logged in), Cart Icon, and Hamburger Menu */}
            <div className="flex md:hidden items-center space-x-1">
              {/* User Icon - Mobile (only show when not logged in) */}
              {!user && (
                <Link to="/login" className="p-2 text-gray-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </Link>
              )}

              {/* Cart Icon - Mobile */}
              <Link to="/cart" className="relative p-2 text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {getCartCount() > 0 && (
                  <span className="absolute top-0 right-0 bg-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {getCartCount()}
                  </span>
                )}
              </Link>

              {/* Hamburger Menu Button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-gray-700 hover:text-indigo-600 focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Popup (Not Slide) */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Menu Popup */}
          <div className="fixed top-16 right-4 w-64 bg-white rounded-lg shadow-2xl z-50 md:hidden animate-fade-in">
            <div className="py-2">
              {/* Navigation Links */}
              {navLinks
                .filter(link => link.show)
                .map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsMenuOpen(false)}
                    className={`block px-4 py-3 text-sm font-medium border-b border-gray-100 ${activePage === link.label.toLowerCase()
                        ? 'text-indigo-600 bg-indigo-50'
                        : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    {link.label}
                  </Link>
                ))}

              {/* Wishlist */}
              <Link
                to="/wishlist"
                onClick={() => setIsMenuOpen(false)}
                className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 border-b border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <span>Wishlist</span>
                  {getWishlistCount() > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {getWishlistCount()}
                    </span>
                  )}
                </div>
              </Link>

              {/* Auth Actions */}
              {user ? (
                <>
                  <div className="px-4 py-3 text-sm text-gray-500 border-b border-gray-100">
                    {profile?.full_name || user.email}
                  </div>
                  {profile?.role === 'vendor' && (
                    <Link
                      to="/vendor/dashboard"
                      onClick={() => setIsMenuOpen(false)}
                      className="block px-4 py-3 text-sm font-medium text-indigo-600 hover:bg-gray-50 border-b border-gray-100"
                    >
                      Vendor Dashboard
                    </Link>
                  )}
                  {profile?.role === 'customer' && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        handleUpgradeToVendor();
                      }}
                      disabled={isUpgrading}
                      className="w-full text-left px-4 py-3 text-sm font-medium text-green-600 hover:bg-gray-50 border-b border-gray-100 disabled:opacity-50"
                    >
                      {isUpgrading ? 'Upgrading...' : 'Become a Vendor'}
                    </button>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-gray-50"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 border-b border-gray-100"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-4 py-3 text-sm font-medium text-indigo-600 hover:bg-gray-50"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Navbar;

import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const About = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation */}
      <Navbar activePage="about" />

      {/* About Content */}
      <div className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-8">About SellGH</h1>

            <div className="prose prose-lg">
              <p className="text-gray-600 mb-6">
                SellGH is Ghana's premier multi-vendor marketplace platform, connecting buyers with local vendors across the country. We believe in empowering local businesses and making it easy for everyone to buy and sell products online.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Our Mission</h2>
              <p className="text-gray-600 mb-6">
                To provide a trusted and accessible platform that enables Ghanaian entrepreneurs to grow their businesses and reach customers nationwide, while offering buyers a convenient and secure shopping experience.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Why Choose SellGH?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">For Buyers</h3>
                  <ul className="text-gray-600 space-y-2 text-sm">
                    <li>Wide selection of products from verified vendors</li>
                    <li>Secure payment options including mobile money</li>
                    <li>Customer protection and support</li>
                    <li>Easy search and discovery</li>
                  </ul>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">For Vendors</h3>
                  <ul className="text-gray-600 space-y-2 text-sm">
                    <li>Easy setup and onboarding</li>
                    <li>Reach customers across Ghana</li>
                    <li>Manage inventory and orders</li>
                    <li>Grow your business online</li>
                  </ul>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Our Values</h2>
              <ul className="text-gray-600 space-y-3 mb-6">
                <li><strong>Trust:</strong> We verify all vendors and ensure secure transactions</li>
                <li><strong>Innovation:</strong> Continuously improving our platform for better user experience</li>
                <li><strong>Community:</strong> Supporting local businesses and the Ghanaian economy</li>
                <li><strong>Excellence:</strong> Committed to providing outstanding service to all users</li>
              </ul>

              <div className="bg-indigo-50 p-6 rounded-lg mt-8">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Ready to Get Started?</h3>
                <p className="text-gray-600 mb-4">
                  Join thousands of buyers and sellers on SellGH today.
                </p>
                <div className="flex space-x-4">
                  <Link
                    to="/signup"
                    className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 font-medium"
                  >
                    Sign Up
                  </Link>
                  <Link
                    to="/support"
                    className="bg-white text-indigo-600 px-6 py-2 rounded-md hover:bg-gray-50 font-medium border border-indigo-600"
                  >
                    Contact Us
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
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
                <li>Phone: +233 XX XXX XXXX</li>
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

export default About;

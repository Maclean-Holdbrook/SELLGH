import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Support = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation */}
      <Navbar activePage="support" />

      {/* Support Content */}
      <div className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Support Center</h1>
            <p className="text-xl text-gray-600 mb-12">
              We're here to help! Find answers to common questions or get in touch with our team.
            </p>

            {/* Contact Methods */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <div className="text-3xl mb-3">📧</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Us</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Get a response within 24 hours
                </p>
                <a
                  href="mailto:support@sellgh.com"
                  className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                >
                  support@sellgh.com
                </a>
              </div>

              <div className="bg-white p-6 rounded-lg shadow text-center">
                <div className="text-3xl mb-3">📞</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Call Us</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Mon-Fri, 9am-5pm GMT
                </p>
                <a
                  href="tel:+233XXXXXXXX"
                  className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                >
                  +233 XX XXX XXXX
                </a>
              </div>

              <div className="bg-white p-6 rounded-lg shadow text-center">
                <div className="text-3xl mb-3">💬</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Live Chat</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Chat with our support team
                </p>
                <button className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
                  Start Chat
                </button>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
              <div className="space-y-4">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">How do I become a vendor?</h3>
                  <p className="text-gray-600">
                    Simply sign up for an account, complete your profile, and submit the vendor onboarding form. Our team will review your application within 24-48 hours.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">What payment methods are accepted?</h3>
                  <p className="text-gray-600">
                    We accept credit/debit cards and all major mobile money services in Ghana including MTN Mobile Money, Vodafone Cash, and AirtelTigo Money.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">How long does delivery take?</h3>
                  <p className="text-gray-600">
                    Delivery times vary by vendor and location. Most orders within Accra are delivered within 1-3 business days. Other regions may take 3-7 business days.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">What is your return policy?</h3>
                  <p className="text-gray-600">
                    Returns are accepted within 7 days of delivery for most items. The product must be unused and in its original packaging. Please contact the vendor or our support team to initiate a return.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">How do I track my order?</h3>
                  <p className="text-gray-600">
                    Once your order is shipped, you'll receive a tracking number via email and SMS. You can also view order status in your account dashboard.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Are vendors verified?</h3>
                  <p className="text-gray-600">
                    Yes, all vendors go through a verification process before they can start selling. We verify business registration, contact information, and require valid identification.
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white p-8 rounded-lg shadow">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Send Us a Message</h2>
              <form className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="How can we help?"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows="5"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Tell us more about your inquiry..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 font-medium"
                >
                  Send Message
                </button>
              </form>
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

export default Support;

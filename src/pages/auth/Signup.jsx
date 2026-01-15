import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAlert } from '../../contexts/AlertContext';

const Signup = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'customer',
  });
  const [submitting, setSubmitting] = useState(false);
  const { signUp, signInWithGoogle, profile, user, loading, vendorProfile } = useAuth();
  const alert = useAlert();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the intended destination from location state
  const from = location.state?.from?.pathname || null;

  // If user is already logged in when they visit signup page, redirect them
  useEffect(() => {
    if (!loading && user && profile && !submitting) {
      console.log('✅ User already logged in, redirecting based on role:', profile.role);
      console.log('📋 Full profile object:', profile);
      redirectBasedOnRole(profile.role);
    }
  }, [loading, user, profile, submitting]);

  // Redirect when user successfully signs up (after form submission)
  useEffect(() => {
    if (!submitting) return;

    if (user && !loading && profile) {
      console.log('✅ Signup successful, redirecting...');
      console.log('📋 Profile role:', profile.role);
      console.log('📋 Full profile object:', profile);
      console.log('🎯 About to call redirectBasedOnRole with:', profile.role);
      redirectBasedOnRole(profile.role);
    }
  }, [user, profile, loading, submitting]);

  const redirectBasedOnRole = (role) => {
    console.log('🔀 redirectBasedOnRole called with role:', role);
    console.log('🔍 Type of role:', typeof role);
    console.log('🔍 role === "vendor"?', role === 'vendor');
    console.log('🔍 role === "admin"?', role === 'admin');

    // If there's an intended destination, redirect there (except for login/signup pages)
    if (from && from !== '/login' && from !== '/signup') {
      console.log('✅ Redirecting to intended page:', from);
      navigate(from, { replace: true });
      return;
    }

    // Otherwise, redirect based on role
    if (role === 'vendor') {
      console.log('✅ Redirecting to /vendor/dashboard');
      navigate('/vendor/dashboard');
    } else if (role === 'admin') {
      console.log('✅ Redirecting to /sellgh-admin/dashboard');
      // Admins should use the separate admin portal
      navigate('/sellgh-admin/dashboard');
    } else {
      console.log('✅ Redirecting to /shop (role is:', role, ')');
      // Customers go to shop page
      navigate('/shop');
    }
  };

  const handleChange = (e) => {
    console.log('🔄 Field changed:', e.target.name, '=', e.target.value);

    const newFormData = {
      ...formData,
      [e.target.name]: e.target.value,
    };

    console.log('📝 New formData:', newFormData);
    setFormData(newFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (formData.password !== formData.confirmPassword) {
      alert.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      alert.error('Password must be at least 6 characters');
      return;
    }

    console.log('🎯 SIGNUP FORM DATA:');
    console.log('  - Full Name:', formData.full_name);
    console.log('  - Email:', formData.email);
    console.log('  - Phone:', formData.phone);
    console.log('  - ROLE:', formData.role);
    console.log('  - Password:', formData.password ? '***' : 'EMPTY');

    const userDataToSend = {
      full_name: formData.full_name,
      phone: formData.phone,
      role: formData.role,
    };

    console.log('📋 USER DATA BEING SENT TO signUp():');
    console.log('  - full_name:', userDataToSend.full_name);
    console.log('  - phone:', userDataToSend.phone);
    console.log('  - ROLE:', userDataToSend.role);

    setSubmitting(true);

    try {
      const { data, error } = await signUp(formData.email, formData.password, userDataToSend);

      if (error) {
        alert.error(error.message || 'Signup failed. Please try again.');
        setSubmitting(false);
        return;
      }

      alert.success('Account created successfully! Redirecting...');

      // Set a timeout to stop loading if profile doesn't load
      setTimeout(() => {
        setSubmitting(false);
      }, 5000);

      // The useEffect will handle navigation once profile is loaded
    } catch (err) {
      alert.error(err.message || 'An error occurred. Please try again.');
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      // Pass the selected role to Google sign-in
      const { error } = await signInWithGoogle(formData.role);
      if (error) {
        alert.error(error.message || 'Google sign-in failed. Please try again.');
      } else {
        alert.info(`Redirecting to Google sign-in as ${formData.role}...`);
      }
      // The redirect happens automatically
    } catch (err) {
      alert.error(err.message || 'An error occurred with Google sign-in.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            SellGH
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sell anything, reach everyone
          </p>
          <h3 className="mt-4 text-center text-2xl font-bold text-gray-900">
            Create your account
          </h3>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                value={formData.full_name}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="0XX XXX XXXX"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Account Type
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="customer">Customer</option>
                <option value="vendor">Vendor</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {formData.role === 'vendor'
                  ? 'Sell your products on SellGH'
                  : 'Shop from multiple vendors'}
              </p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Minimum 6 characters"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Re-enter password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={submitting || loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting || loading ? 'Creating account...' : 'Sign up'}
            </button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Google Sign-In Button */}
          <div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign up with Google
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;

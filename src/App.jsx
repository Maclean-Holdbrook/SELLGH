import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { AlertProvider } from './contexts/AlertContext';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import FloatingCart from './components/FloatingCart';
import AlertContainer from './components/AlertContainer';

// Pages
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import PaymentVerify from './pages/PaymentVerify';
import About from './pages/About';
import Support from './pages/Support';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import VendorDashboard from './pages/vendor/VendorDashboard';
import VendorOnboarding from './pages/vendor/VendorOnboarding';
import Products from './pages/vendor/Products';
import ProductForm from './pages/vendor/ProductForm';
import VendorOrders from './pages/vendor/VendorOrders';
import VendorEarnings from './pages/vendor/VendorEarnings';

// Customer Order Pages
import OrderHistory from './pages/OrderHistory';
import OrderDetails from './pages/OrderDetails';
import Wishlist from './pages/Wishlist';

// Demo Pages
import AlertDemo from './pages/AlertDemo';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminVendors from './pages/admin/AdminVendors';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminReports from './pages/admin/AdminReports';
import AdminPayouts from './pages/admin/AdminPayouts';
import AdminWithdrawals from './pages/admin/AdminWithdrawals';

function App() {
  return (
    <Router>
      <ScrollToTop />
      <AuthProvider>
        <AlertProvider>
          <CartProvider>
            <WishlistProvider>
              <AlertContainer />
              <FloatingCart />
              <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/products" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-success/:orderId" element={<OrderSuccess />} />
          <Route path="/payment/verify" element={<PaymentVerify />} />
          <Route path="/orders" element={<OrderHistory />} />
          <Route path="/order/:orderId" element={<OrderDetails />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/about" element={<About />} />
          <Route path="/support" element={<Support />} />
          <Route path="/alert-demo" element={<AlertDemo />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Vendor Routes */}
          <Route
            path="/vendor/dashboard"
            element={
              <ProtectedRoute allowedRoles={['vendor']}>
                <VendorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/onboarding"
            element={
              <ProtectedRoute allowedRoles={['vendor']}>
                <VendorOnboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/products"
            element={
              <ProtectedRoute allowedRoles={['vendor']}>
                <Products />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/products/new"
            element={
              <ProtectedRoute allowedRoles={['vendor']}>
                <ProductForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/products/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['vendor']}>
                <ProductForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/orders"
            element={
              <ProtectedRoute allowedRoles={['vendor']}>
                <VendorOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/earnings"
            element={
              <ProtectedRoute allowedRoles={['vendor']}>
                <VendorEarnings />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes - Separate Portal */}
          <Route path="/sellgh-admin" element={<AdminLogin />} />
          <Route
            path="/sellgh-admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sellgh-admin/vendors"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminVendors />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sellgh-admin/products"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminProducts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sellgh-admin/orders"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sellgh-admin/reports"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sellgh-admin/payouts"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPayouts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sellgh-admin/withdrawals"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminWithdrawals />
              </ProtectedRoute>
            }
          />

          {/* Alias routes */}
          <Route
            path="/admin/payouts"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPayouts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/withdrawals"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminWithdrawals />
              </ProtectedRoute>
            }
          />

          {/* Legacy admin route - redirect to new portal */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900">404</h1>
                  <p className="mt-2 text-gray-600">Page not found</p>
                </div>
              </div>
            }
          />
              </Routes>
            </WishlistProvider>
          </CartProvider>
        </AlertProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

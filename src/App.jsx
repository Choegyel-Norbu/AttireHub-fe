import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AccountLayout from '@/components/layout/AccountLayout';

// Public pages
import HomePage from '@/pages/public/HomePage';
import ProductListPage from '@/pages/public/ProductListPage';
import ProductDetailPage from '@/pages/public/ProductDetailPage';
import CategoryPage from '@/pages/public/CategoryPage';
import SearchPage from '@/pages/public/SearchPage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import RegisterAddressPage from '@/pages/auth/RegisterAddressPage';

// Protected / account pages
import ProfilePage from '@/pages/account/ProfilePage';
import OrdersPage from '@/pages/account/OrdersPage';
import AccountSettingsPage from '@/pages/account/AccountSettingsPage';
import AccountAddressesPage from '@/pages/account/AccountAddressesPage';
import CartPage from '@/pages/cart/CartPage';
import CheckoutPage from '@/pages/checkout/CheckoutPage';

// Admin pages
import AdminLayout from '@/components/layout/AdminLayout';
import AddProductPage from '@/pages/admin/AddProductPage';
import ProductManagementPage from '@/pages/admin/ProductManagementPage';
import EditProductPage from '@/pages/admin/EditProductPage';
import OrderManagementPage from '@/pages/admin/OrderManagementPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductListPage />} />
            <Route path="/products/:slug" element={<ProductDetailPage />} />
            <Route path="/categories/:slug" element={<CategoryPage />} />
            <Route path="/search" element={<SearchPage />} />
            
            {/* Auth routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/register/address" element={<RegisterAddressPage />} />
            
            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route element={<AccountLayout />}>
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/account/settings" element={<AccountSettingsPage />} />
                <Route path="/account/addresses" element={<AccountAddressesPage />} />
              </Route>
            </Route>
            
            {/* Admin routes */}
            <Route element={<ProtectedRoute requiredRole="ADMIN" />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/products" replace />} />
                <Route path="products" element={<ProductManagementPage />} />
                <Route path="products/new" element={<AddProductPage />} />
                <Route path="products/edit/:slug" element={<EditProductPage />} />
                <Route path="orders" element={<OrderManagementPage />} />
              </Route>
            </Route>
          </Routes>
    </BrowserRouter>
  );
}

export default App;

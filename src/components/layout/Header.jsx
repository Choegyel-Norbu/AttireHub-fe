import { useState, useEffect, useContext, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Search, User, LogOut, X, ShoppingBag, Bell, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { CartContext } from '@/context/CartContext';
import {
  getNotifications,
  getAdminNotifications,
  filterNotificationsForAdmin,
  filterNotificationsForCustomer,
} from '@/services/notificationService';

const NAV_LINKS = [
  { to: '/products', label: 'Collection' },
  { to: '/products?newArrivalsOnly=true', label: 'New Arrivals' },
  { to: '/sale', label: 'Sale' },
];

function isAdmin(user) {
  return user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN';
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  
  const { isAuthenticated, user, logout } = useAuth();
  const showDashboard = isAuthenticated && isAdmin(user);
  const cart = useContext(CartContext);
  const totalItems = cart?.totalItems ?? 0;
  const navigate = useNavigate();
  const location = useLocation();

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, [location]);

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    const admin = isAdmin(user);
    try {
      let content = [];
      if (admin) {
        const result = await getAdminNotifications({
          read: false,
          page: 0,
          size: 50,
        });
        content = filterNotificationsForAdmin(result.content ?? []);
      } else {
        const result = await getNotifications({ read: false, size: 50 });
        content = filterNotificationsForCustomer(result.content ?? []);
      }
      setUnreadCount(content.length);
    } catch {
      setUnreadCount(0);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  useEffect(() => {
    const onFocus = () => fetchUnreadCount();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [fetchUnreadCount]);

  useEffect(() => {
    const onUpdated = () => fetchUnreadCount();
    window.addEventListener('notifications-updated', onUpdated);
    return () => window.removeEventListener('notifications-updated', onUpdated);
  }, [fetchUnreadCount]);

  // Allow other components (e.g. profile page) to request logout confirmation
  useEffect(() => {
    const handler = () => setShowLogoutConfirm(true);
    window.addEventListener('request-logout', handler);
    return () => window.removeEventListener('request-logout', handler);
  }, []);

  const handleLogoutClick = () => setShowLogoutConfirm(true);

  const handleLogoutConfirm = () => {
    setShowLogoutConfirm(false);
    setMobileOpen(false);
    logout();
  };

  const handleLogoutCancel = () => setShowLogoutConfirm(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchOpen(false);
    }
  };

  return (
    <>
      <header 
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-white'
        }`}
      >
        {/* Promo Bar */}
        <div className="bg-primary px-4 py-2 text-center text-[10px] font-bold uppercase tracking-widest text-white sm:text-xs">
          Complimentary shipping on orders over $75
        </div>

        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Mobile Menu Button */}
          <button
            type="button"
            className="p-2 -ml-2 text-primary lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" strokeWidth={1.5} />
          </button>

          {/* Desktop Nav (Left) */}
          <nav className="hidden items-center gap-8 lg:flex">
            {NAV_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="text-sm font-medium text-secondary transition-colors hover:text-primary"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Logo (Center) */}
          <Link
            to="/"
            className="absolute left-1/2 -translate-x-1/2 font-serif text-2xl font-medium tracking-tight text-primary lg:static lg:transform-none lg:text-3xl"
            aria-label="AttireHub Home"
          >
            AttireHub
          </Link>

          {/* Actions (Right) */}
          <div className="flex items-center gap-1 sm:gap-4">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-primary transition-colors hover:text-secondary"
              aria-label="Search"
            >
              <Search className="h-5 w-5" strokeWidth={1.5} />
            </button>

            {isAuthenticated ? (
              <div className="hidden items-center gap-4 sm:flex">
                {showDashboard && (
                  <Link
                    to="/admin"
                    className="text-xs font-bold uppercase tracking-wider text-primary hover:text-secondary"
                  >
                    Dashboard
                  </Link>
                )}
                <Link
                  to="/account/notifications"
                  className="relative p-2 text-primary transition-colors hover:text-secondary"
                >
                  <Bell className="h-5 w-5" strokeWidth={1.5} />
                  {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                  )}
                </Link>
                <Link
                  to="/profile"
                  className="p-2 text-primary transition-colors hover:text-secondary"
                >
                  <User className="h-5 w-5" strokeWidth={1.5} />
                </Link>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden text-sm font-medium text-primary hover:text-secondary sm:block"
              >
                Sign In
              </Link>
            )}

            {!showDashboard && (
              <Link
                to="/cart"
                className="relative p-2 text-primary transition-colors hover:text-secondary"
                aria-label="Cart"
              >
                <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
                {totalItems > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                    {totalItems}
                  </span>
                )}
              </Link>
            )}
          </div>
        </div>

        {/* Search Overlay */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-border bg-white overflow-hidden"
            >
              <div className="mx-auto max-w-7xl px-4 py-8">
                <form onSubmit={handleSearch} className="relative mx-auto max-w-2xl">
                  <input
                    type="search"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for products..."
                    className="w-full border-b border-primary/20 bg-transparent py-4 text-center text-xl text-primary placeholder:text-tertiary focus:border-primary focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-sm font-bold uppercase tracking-wider text-primary"
                  >
                    Search
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-full max-w-sm flex flex-col bg-white shadow-2xl lg:hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <span className="font-serif text-2xl tracking-tight text-primary">Menu</span>
                <button 
                  onClick={() => setMobileOpen(false)}
                  className="p-2 -mr-2 text-primary hover:bg-gray-50 rounded-full transition-colors"
                >
                  <X className="h-6 w-6" strokeWidth={1.5} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-8">
                <nav className="flex flex-col gap-8">
                  {/* Main Links */}
                  <div className="flex flex-col gap-6">
                    {NAV_LINKS.map(({ to, label }, i) => (
                      <motion.div
                        key={to}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + i * 0.1 }}
                      >
                        <Link
                          to={to}
                          className="text-3xl font-serif text-primary hover:text-secondary transition-colors block"
                          onClick={() => setMobileOpen(false)}
                        >
                          {label}
                        </Link>
                      </motion.div>
                    ))}
                  </div>

                  <div className="h-px w-full bg-gray-100 my-2" />

                  {/* Account Links */}
                  <div className="flex flex-col gap-4">
                    {isAuthenticated ? (
                      <>
                        <Link
                          to="/profile"
                          className="flex items-center gap-3 text-base font-medium text-secondary hover:text-primary"
                          onClick={() => setMobileOpen(false)}
                        >
                          <User className="h-5 w-5" />
                          My Profile
                        </Link>
                        <Link
                          to="/account/notifications"
                          className="flex items-center gap-3 text-base font-medium text-secondary hover:text-primary"
                          onClick={() => setMobileOpen(false)}
                        >
                          <Bell className="h-5 w-5" />
                          Notifications
                          {unreadCount > 0 && (
                            <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                              {unreadCount}
                            </span>
                          )}
                        </Link>
                        {showDashboard && (
                          <Link
                            to="/admin"
                            className="flex items-center gap-3 text-base font-medium text-secondary hover:text-primary"
                            onClick={() => setMobileOpen(false)}
                          >
                            <LayoutDashboard className="h-5 w-5" />
                            Admin Dashboard
                          </Link>
                        )}
                        <button
                          onClick={handleLogoutClick}
                          className="flex items-center gap-3 text-base font-medium text-red-600 hover:text-red-700 mt-2"
                        >
                          <LogOut className="h-5 w-5" />
                          Sign Out
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <Link
                          to="/login"
                          className="text-lg font-medium text-primary hover:underline"
                          onClick={() => setMobileOpen(false)}
                        >
                          Sign In
                        </Link>
                        <Link
                          to="/register"
                          className="text-lg font-medium text-secondary hover:text-primary"
                          onClick={() => setMobileOpen(false)}
                        >
                          Create Account
                        </Link>
                      </div>
                    )}
                  </div>
                </nav>
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-100">
                 <p className="text-xs text-tertiary text-center">
                   © {new Date().getFullYear()} AttireHub. All rights reserved.
                 </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleLogoutCancel}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 w-full max-w-sm overflow-hidden rounded-xl bg-white p-6 shadow-2xl"
            >
              <h2 className="text-lg font-serif font-medium text-primary">Sign Out</h2>
              <p className="mt-2 text-sm text-secondary">
                Are you sure you want to sign out of your account?
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleLogoutCancel}
                  className="flex-1 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-primary hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogoutConfirm}
                  className="flex-1 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-secondary"
                >
                  Sign Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

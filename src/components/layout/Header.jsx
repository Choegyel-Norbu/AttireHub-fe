import { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Menu, Search, User, LogOut, X, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { CartContext } from '@/context/CartContext';

const NAV_LINKS = [
  { to: '/products', label: 'All Products' },
  { to: '/categories/sale', label: 'Sale' },
];

function isAdmin(user) {
  return user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN';
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const showDashboard = isAuthenticated && isAdmin(user);
  const cart = useContext(CartContext);
  const totalItems = cart?.totalItems ?? 0;
  const navigate = useNavigate();

  const handleLogoutClick = () => setShowLogoutConfirm(true);

  const handleLogoutConfirm = () => {
    setShowLogoutConfirm(false);
    setMobileOpen(false);
    logout();
  };

  const handleLogoutCancel = () => setShowLogoutConfirm(false);

  useEffect(() => {
    if (!showLogoutConfirm) return;
    const onEscape = (e) => {
      if (e.key === 'Escape') handleLogoutCancel();
    };
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [showLogoutConfirm]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-tertiary bg-quaternary">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 text-primary transition-opacity hover:opacity-80"
          aria-label="AttireHub Home"
        >
          <ShoppingBag className="h-8 w-8" aria-hidden />
          <span className="text-xl font-semibold tracking-tight">AttireHub</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="text-sm font-medium text-primary transition-colors hover:text-secondary"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Search (desktop) */}
        <form
          onSubmit={handleSearch}
          className="hidden flex-1 max-w-xs lg:block lg:max-w-sm"
          role="search"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tertiary" aria-hidden />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full rounded-xl border border-tertiary bg-quaternary py-2 pl-10 pr-4 text-sm text-primary placeholder-tertiary outline-none transition-colors focus:border-secondary focus:ring-1 focus:ring-secondary"
              aria-label="Search products"
            />
          </div>
        </form>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            to="/cart"
            className="relative flex items-center justify-center rounded-full p-2 text-primary transition-colors hover:bg-tertiary/20 lg:p-2.5"
            aria-label={isAuthenticated && totalItems > 0 ? `Cart, ${totalItems} items` : 'Cart'}
          >
            <ShoppingCart className="h-5 w-5 shrink-0 lg:h-6 lg:w-6" aria-hidden />
            {isAuthenticated && totalItems > 0 && (
              <span
                className="absolute -right-0.5 -top-0.5 z-10 flex min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 py-0.5 text-[10px] font-bold leading-none text-white lg:-right-1 lg:-top-1 lg:min-w-[1.5rem] lg:px-1.5 lg:py-1 lg:text-xs"
                aria-hidden
              >
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </Link>
          {isAuthenticated ? (
            <div className="hidden items-center gap-2 sm:flex">
              {showDashboard && (
                <Link
                  to="/admin/products"
                  className="rounded-md px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-tertiary/20"
                >
                  Dashboard
                </Link>
              )}
              <Link
                to="/profile"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-tertiary/20"
              >
                <User className="h-4 w-4" aria-hidden />
                <span className="max-w-[100px] truncate">
                  {[user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.name || user?.email}
                </span>
              </Link>
              <button
                type="button"
                onClick={handleLogoutClick}
                className="rounded-md p-2 transition-colors hover:opacity-80"
                style={{ color: '#7BA4D0' }}
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden px-4 py-2 text-sm font-medium text-primary transition-colors hover:text-secondary sm:inline-flex"
            >
              Sign in
            </Link>
          )}
          <button
            type="button"
            className="rounded-md p-2 text-primary transition-colors hover:bg-tertiary/20 md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-expanded={mobileOpen}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-tertiary bg-tertiary px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-2" aria-label="Mobile">
            <Link
              to="/cart"
              className="rounded-md px-3 py-2 font-medium text-primary hover:bg-primary/10"
              onClick={() => setMobileOpen(false)}
            >
              Cart {isAuthenticated && totalItems > 0 ? `(${totalItems})` : ''}
            </Link>
            {showDashboard && (
              <Link
                to="/admin/products"
                className="rounded-md px-3 py-2 font-medium text-primary hover:bg-primary/10"
                onClick={() => setMobileOpen(false)}
              >
                Dashboard
              </Link>
            )}
            {NAV_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="rounded-md px-3 py-2 font-medium text-primary hover:bg-primary/10"
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </Link>
            ))}
          </nav>
          <form onSubmit={handleSearch} className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tertiary" aria-hidden />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full rounded-xl border border-tertiary bg-quaternary py-2 pl-10 pr-4 text-sm text-primary placeholder-tertiary outline-none transition-colors focus:border-secondary focus:ring-1 focus:ring-secondary"
                aria-label="Search products"
              />
            </div>
          </form>
          {!isAuthenticated && (
            <Link
              to="/login"
              className="mt-4 block px-4 py-2 text-center text-sm font-semibold text-primary hover:bg-primary/10"
              onClick={() => setMobileOpen(false)}
            >
              Sign in
            </Link>
          )}
        </div>
      )}

      {/* Logout confirmation dialog — portaled to body so it centers in the viewport */}
      {showLogoutConfirm &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-dialog-title"
            aria-describedby="logout-dialog-desc"
          >
            <div
              className="absolute inset-0 bg-quaternary/90 backdrop-blur-sm"
              aria-hidden
              onClick={handleLogoutCancel}
            />
            <div className="relative z-10 w-full max-w-sm rounded-2xl border border-tertiary bg-quaternary p-6 shadow-lg">
              <h2 id="logout-dialog-title" className="text-lg font-semibold text-primary">
                Sign out?
              </h2>
              <p id="logout-dialog-desc" className="mt-2 text-sm text-secondary">
                Are you sure you want to sign out of your account?
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={handleLogoutCancel}
                  className="flex-1 rounded-lg border border-tertiary bg-quaternary py-2.5 text-sm font-medium text-primary transition-colors hover:bg-tertiary/20"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleLogoutConfirm}
                  className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#7BA4D0' }}
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </header>
  );
}

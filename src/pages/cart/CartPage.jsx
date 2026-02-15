import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import {
  ShoppingCart,
  Trash2,
  ImageOff,
  Loader2,
  ArrowRight,
} from 'lucide-react';

function formatPrice(value) {
  if (typeof value !== 'number') return String(value ?? '');
  return Number.isInteger(value)
    ? value.toLocaleString()
    : value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function CartPage() {
  const { isAuthenticated } = useAuth();
  const {
    items,
    subtotal,
    totalItems,
    fetchCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();
  const [updatingId, setUpdatingId] = useState(null);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState(null);
  const [itemToRemove, setItemToRemove] = useState(null);
  const [showClearCartConfirm, setShowClearCartConfirm] = useState(false);
  const { show: showToast } = useToast();

  useEffect(() => {
    if (isAuthenticated && fetchCart) {
      fetchCart();
    }
  }, [isAuthenticated, fetchCart]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!itemToRemove) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setItemToRemove(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [itemToRemove]);

  useEffect(() => {
    if (!showClearCartConfirm) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setShowClearCartConfirm(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showClearCartConfirm]);

  const handleUpdateQty = async (itemId, newQty) => {
    if (newQty < 1) return;
    setError(null);
    setUpdatingId(itemId);
    try {
      await updateQuantity(itemId, newQty);
    } catch (err) {
      setError(err?.message ?? 'Failed to update quantity.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemoveClick = (item) => setItemToRemove(item);

  const handleRemoveConfirm = async () => {
    if (!itemToRemove) return;
    const itemId = itemToRemove.id;
    const productName = itemToRemove.productName;
    setItemToRemove(null);
    setError(null);
    setUpdatingId(itemId);
    try {
      await removeFromCart(itemId);
      showToast({
        title: 'Removed from cart',
        message: `${productName} has been removed from your cart.`,
        variant: 'success',
        position: 'bottom-right',
        duration: 4000,
      });
    } catch (err) {
      setError(err?.message ?? 'Failed to remove item.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleClearCartClick = () => setShowClearCartConfirm(true);

  const handleClearCartConfirm = async () => {
    setShowClearCartConfirm(false);
    setError(null);
    setClearing(true);
    try {
      await clearCart();
      showToast({
        title: 'Cart cleared',
        message: 'All items have been removed from your cart.',
        variant: 'success',
        position: 'bottom-right',
        duration: 4000,
      });
    } catch (err) {
      setError(err?.message ?? 'Failed to clear cart.');
    } finally {
      setClearing(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-quaternary px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl text-center">
            <ShoppingCart className="mx-auto h-14 w-14 text-tertiary" aria-hidden />
            <h1 className="mt-4 text-2xl font-semibold text-primary">Sign in to view your cart</h1>
            <p className="mt-2 text-sm text-secondary">
              Your cart is saved when you sign in. Add items and checkout with your account.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-quaternary transition-opacity hover:opacity-90"
            >
              Sign in
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-quaternary px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl xl:max-w-7xl 2xl:max-w-[1600px]">
          <div className="flex items-center gap-2 text-secondary">
            <ShoppingCart className="h-5 w-5" aria-hidden />
            <h1 className="text-2xl font-semibold text-primary">Your cart</h1>
          </div>
          <p className="mt-2 text-sm text-secondary">
            {totalItems > 0 ? `${totalItems} item${totalItems !== 1 ? 's' : ''}` : 'Your cart is empty.'}
          </p>

          {error && (
            <div className="mt-4 rounded-lg border border-border bg-quaternary p-4 text-sm text-primary">
              {error}
            </div>
          )}

          {items.length === 0 && isAuthenticated ? (
            <div className="mt-8 rounded-xl border border-border bg-quaternary py-16 text-center">
              <ShoppingCart className="mx-auto h-12 w-12 text-tertiary" aria-hidden />
              <p className="mt-4 font-medium text-primary">Your cart is empty</p>
              <p className="mt-1 text-sm text-secondary">Add items from the store to get started.</p>
              <Link
                to="/products"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-quaternary transition-opacity hover:opacity-90"
              >
                Shop products
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          ) : (
            <>
            <div className="mt-8">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {items.map((item) => (
                  <article
                    key={item.id}
                    className="flex flex-col gap-3 rounded-xl bg-quaternary p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-4"
                  >
                    <div className="flex flex-1 gap-3 sm:min-w-0 sm:flex-initial sm:flex-none">
                      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-tertiary/10 sm:h-24 sm:w-24">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-tertiary">
                            <ImageOff className="h-6 w-6 sm:h-8 sm:w-8" aria-hidden />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="font-semibold text-primary sm:text-base">{item.productName}</h2>
                        <p className="mt-0.5 text-xs text-secondary sm:text-sm">
                          {[item.size, item.color].filter(Boolean).join(' · ')}
                          {item.sku && ` · ${item.sku}`}
                        </p>
                        <p className="mt-1 text-sm font-medium text-primary sm:text-base">
                          Nu {formatPrice(item.unitPrice)} /-
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-3 sm:border-0 sm:justify-end sm:pt-0">
                      <div className="flex items-center rounded-lg border border-border bg-quaternary">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.id, Math.max(1, item.quantity - 1))}
                          disabled={updatingId === item.id || item.quantity <= 1}
                          className="touch-manipulation px-3 py-2 text-primary hover:bg-tertiary/20 disabled:opacity-50 sm:px-3 sm:py-2"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="min-w-[2.25rem] py-2 text-center text-sm font-medium text-primary">
                          {updatingId === item.id ? (
                            <Loader2 className="inline-block h-4 w-4 animate-spin" aria-hidden />
                          ) : (
                            item.quantity
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                          disabled={updatingId === item.id || (item.availableStock != null && item.quantity >= item.availableStock)}
                          className="touch-manipulation px-3 py-2 text-primary hover:bg-tertiary/20 disabled:opacity-50 sm:px-3 sm:py-2"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-semibold text-primary sm:text-base sm:w-24 sm:text-right">
                          Nu {formatPrice(item.totalPrice)} /-
                        </p>
                        <button
                          type="button"
                          onClick={() => handleRemoveClick(item)}
                          disabled={updatingId === item.id}
                          className="touch-manipulation rounded p-2 text-primary hover:bg-tertiary/20 disabled:opacity-50"
                          aria-label={`Remove ${item.productName} from cart`}
                        >
                          <Trash2 className="h-5 w-5" aria-hidden />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-4 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <p className="text-lg font-semibold text-primary">
                    Subtotal: Nu {formatPrice(subtotal)} /-
                  </p>
                  <button
                    type="button"
                    onClick={handleClearCartClick}
                    disabled={clearing || items.length === 0}
                    className="text-sm font-medium text-secondary hover:text-primary disabled:opacity-50"
                  >
                    {clearing ? 'Clearing…' : 'Clear cart'}
                  </button>
                </div>
                <Link
                  to="/checkout"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-quaternary transition-opacity hover:opacity-90"
                >
                  Proceed to checkout
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>

            {itemToRemove &&
                createPortal(
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="remove-item-title"
                    aria-describedby="remove-item-desc"
                  >
                    <button
                      type="button"
                      className="absolute inset-0 bg-quaternary/60 backdrop-blur-sm"
                      onClick={() => setItemToRemove(null)}
                      aria-label="Close"
                    />
                    <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-quaternary p-6 shadow-lg">
                      <h2 id="remove-item-title" className="text-lg font-semibold text-primary">
                        Remove from cart?
                      </h2>
                      <p id="remove-item-desc" className="mt-2 text-sm text-secondary">
                        Remove <strong className="text-primary">{itemToRemove.productName}</strong> from your cart?
                      </p>
                      <div className="mt-6 flex gap-3">
                        <button
                          type="button"
                          onClick={() => setItemToRemove(null)}
                          className="flex-1 rounded-lg border border-border bg-quaternary py-2.5 text-sm font-medium text-primary transition-colors hover:bg-tertiary/20"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveConfirm}
                          className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                          style={{ backgroundColor: '#7BA4D0' }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>,
                  document.body
                )}

            {showClearCartConfirm &&
                createPortal(
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="clear-cart-title"
                    aria-describedby="clear-cart-desc"
                  >
                    <button
                      type="button"
                      className="absolute inset-0 bg-quaternary/90 backdrop-blur-sm"
                      onClick={() => setShowClearCartConfirm(false)}
                      aria-label="Close"
                    />
                    <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-quaternary p-6 shadow-lg">
                      <h2 id="clear-cart-title" className="text-lg font-semibold text-primary">
                        Clear cart?
                      </h2>
                      <p id="clear-cart-desc" className="mt-2 text-sm text-secondary">
                        Remove all items from your cart? This cannot be undone.
                      </p>
                      <div className="mt-6 flex gap-3">
                        <button
                          type="button"
                          onClick={() => setShowClearCartConfirm(false)}
                          className="flex-1 rounded-lg border border-border bg-quaternary py-2.5 text-sm font-medium text-primary transition-colors hover:bg-tertiary/20"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleClearCartConfirm}
                          className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                          style={{ backgroundColor: '#7BA4D0' }}
                        >
                          Clear cart
                        </button>
                      </div>
                    </div>
                  </div>,
                  document.body
                )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/useToast';
import { getAddresses } from '@/services/addressService';
import { createOrder } from '@/services/orderService';
import { Package, MapPin, Loader2, ImageOff, ArrowRight } from 'lucide-react';

function formatPrice(value) {
  if (typeof value !== 'number') return String(value ?? '');
  return Number.isInteger(value)
    ? value.toLocaleString()
    : value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, totalItems, clearCart, fetchCart } = useCart();
  const { show: showToast } = useToast();
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState(null);
  const [placedOrder, setPlacedOrder] = useState(null);

  const [shippingAddressId, setShippingAddressId] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (totalItems === 0 && !placedOrder) {
      navigate('/cart', { replace: true });
      return;
    }
  }, [totalItems, placedOrder, navigate]);

  useEffect(() => {
    getAddresses()
      .then((list) => {
        setAddresses(Array.isArray(list) ? list : []);
        const shipping = (Array.isArray(list) ? list : []).filter(
          (a) => (a.addressType || a.type || '').toUpperCase() === 'SHIPPING'
        );
        const defaultAddr = shipping.find((a) => a.isDefault) ?? shipping[0];
        if (defaultAddr?.id) {
          setShippingAddressId(String(defaultAddr.id));
        } else if (list?.length > 0 && list[0]?.id) {
          setShippingAddressId(String(list[0].id));
        }
      })
      .catch(() => setAddresses([]))
      .finally(() => setLoadingAddresses(false));
  }, []);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!shippingAddressId?.trim()) {
      setError('Please select a shipping address.');
      return;
    }
    setError(null);
    setPlacing(true);
    try {
      const order = await createOrder({
        shippingAddressId: Number(shippingAddressId),
        couponCode: couponCode.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setPlacedOrder(order);
      await clearCart();
      if (fetchCart) fetchCart();
      showToast({
        title: 'Order placed',
        message: `Order ${order.orderNumber} has been placed successfully.`,
        variant: 'success',
        position: 'bottom-right',
        duration: 5000,
      });
    } catch (err) {
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        'Failed to place order. Your cart was not changed.';
      setError(msg);
    } finally {
      setPlacing(false);
    }
  };

  if (totalItems === 0 && !placedOrder) {
    return null;
  }

  if (placedOrder) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-quaternary px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <div className="rounded-xl border border-tertiary bg-quaternary p-6 text-center sm:p-8">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Package className="h-7 w-7" aria-hidden />
              </div>
              <h1 className="mt-4 text-2xl font-semibold text-primary">Thank you for your order</h1>
              <p className="mt-2 text-secondary">
                Order number: <strong className="text-primary">{placedOrder.orderNumber}</strong>
              </p>
              <p className="mt-1 text-sm text-secondary">
                Total: Nu {formatPrice(placedOrder.total)} /-
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link
                  to={`/account/orders?highlight=${encodeURIComponent(placedOrder.orderNumber)}`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-quaternary transition-opacity hover:opacity-90"
                >
                  View order
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <Link
                  to="/products"
                  className="inline-flex items-center justify-center rounded-lg border border-tertiary bg-quaternary px-5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-tertiary/20"
                >
                  Continue shopping
                </Link>
              </div>
            </div>
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
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center gap-2 text-secondary">
            <Package className="h-6 w-6" aria-hidden />
            <h1 className="text-2xl font-semibold text-primary sm:text-3xl">Checkout</h1>
          </div>

          <form onSubmit={handlePlaceOrder} className="mt-8 grid gap-8 lg:grid-cols-5">
            <div className="lg:col-span-3 flex flex-col gap-4">
              <section className="rounded-xl bg-quaternary p-4">
                <h2 className="text-lg font-semibold text-primary">Shipping address</h2>
                {loadingAddresses ? (
                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-tertiary bg-tertiary/10 p-3 text-secondary">
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                    <span className="text-sm">Loading addresses…</span>
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="mt-3 flex items-center gap-2 rounded-lg border border-tertiary bg-tertiary/10 p-3 text-secondary">
                    <MapPin className="h-5 w-5 shrink-0" aria-hidden />
                    <p className="text-sm">
                      No addresses found.{' '}
                      <Link to="/register/address" className="font-medium text-primary hover:underline">
                        Add an address
                      </Link>
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 space-y-2 rounded-lg border border-tertiary p-3">
                    {(addresses.filter(
                      (a) => (a.addressType || a.type || '').toUpperCase() === 'SHIPPING'
                    ).length > 0
                      ? addresses.filter(
                          (a) => (a.addressType || a.type || '').toUpperCase() === 'SHIPPING'
                        )
                      : addresses
                    ).map((addr) => (
                        <label
                          key={addr.id}
                          className="flex cursor-pointer items-start gap-3 rounded-lg bg-tertiary/10 p-3 transition-colors has-[:checked]:bg-primary/5 has-[:checked]:ring-2 has-[:checked]:ring-primary/30"
                        >
                          <input
                            type="radio"
                            name="shippingAddress"
                            value={addr.id}
                            checked={shippingAddressId === String(addr.id)}
                            onChange={() => setShippingAddressId(String(addr.id))}
                            className="mt-1.5 h-4 w-4 border-tertiary text-primary focus:ring-primary"
                            aria-label={`Select ${addr.streetAddress}, ${addr.city}`}
                          />
                          <div className="min-w-0 flex-1 text-sm">
                            <p className="font-medium text-primary">
                              {addr.streetAddress}
                              {addr.isDefault && (
                                <span className="ml-2 text-xs text-secondary">(Default)</span>
                              )}
                            </p>
                            <p className="text-secondary">
                              {[addr.city, addr.state, addr.postalCode, addr.country]
                                .filter(Boolean)
                                .join(', ')}
                            </p>
                          </div>
                        </label>
                      ))}
                  </div>
                )}
              </section>

              <section className="rounded-xl bg-quaternary p-4">
                <h2 className="text-lg font-semibold text-primary">Order notes (optional)</h2>
                <div className="mt-3">
                  <input
                    type="text"
                    id="checkout-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Delivery instructions, leave at door, etc."
                    className="w-full rounded-lg border border-tertiary bg-tertiary/10 px-3 py-2.5 text-sm text-primary placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    aria-label="Order notes"
                  />
                </div>
              </section>

              <section className="rounded-xl bg-quaternary p-4">
                <h2 className="text-lg font-semibold text-primary">Coupon (optional)</h2>
                <div className="mt-3">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter coupon code"
                    className="w-full rounded-lg border border-tertiary bg-tertiary/10 px-3 py-2.5 text-sm text-primary placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    aria-label="Coupon code"
                  />
                </div>
              </section>
            </div>

            <div className="lg:col-span-2">
              <section className="sticky top-24 rounded-xl border border-tertiary bg-quaternary p-6">
                <h2 className="text-lg font-semibold text-primary">Order summary</h2>
                <ul className="mt-4 space-y-3">
                  {items.map((item) => (
                    <li key={item.id} className="flex gap-3 border-b border-tertiary/50 pb-3 last:border-0">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-tertiary/20">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-tertiary">
                            <ImageOff className="h-6 w-6" aria-hidden />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-primary">
                          {item.productName}
                        </p>
                        <p className="text-xs text-secondary">
                          {item.size} / {item.color} × {item.quantity}
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-primary">
                          Nu {formatPrice(item.totalPrice)} /-
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 border-t border-tertiary pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-secondary">Subtotal</span>
                    <span className="font-medium text-primary">
                      Nu {formatPrice(subtotal)} /-
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-secondary">
                    Shipping and any discount will be applied when you place the order.
                  </p>
                </div>

                {error && (
                  <div
                    className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
                    role="alert"
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    placing ||
                    loadingAddresses ||
                    addresses.length === 0 ||
                    !shippingAddressId?.trim()
                  }
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-3 text-sm font-semibold text-quaternary transition-colors hover:bg-primary disabled:opacity-50 cursor-pointer"
                >
                  {placing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                      Placing order…
                    </>
                  ) : (
                    <>
                      Place order — Nu {formatPrice(subtotal)} /-
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </>
                  )}
                </button>

                <Link
                  to="/cart"
                  className="mt-3 block text-center text-sm font-medium text-primary hover:text-secondary"
                >
                  ← Back to cart
                </Link>
              </section>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}

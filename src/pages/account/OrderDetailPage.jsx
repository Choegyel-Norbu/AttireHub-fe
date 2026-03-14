import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getOrderByNumber } from '@/services/orderService';
import {
  createReview,
  updateReview,
  deleteReview,
  getProductReviews,
} from '@/services/reviewService';
import { getProductBySlug } from '@/services/productService';
import { useAuth } from '@/context/AuthContext';
import { 
  Package, 
  Loader2, 
  ArrowLeft, 
  MessageSquare, 
  Star, 
  Pencil, 
  Trash2, 
  MapPin, 
  CreditCard,
  Calendar,
  Truck
} from 'lucide-react';

function formatPrice(value) {
  if (typeof value !== 'number') return '—';
  return Number.isInteger(value)
    ? value.toLocaleString()
    : value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function StatusBadge({ status }) {
  const statusLower = (status || '').toLowerCase();
  const colors =
    statusLower === 'cancelled' || statusLower === 'returned'
      ? 'bg-red-50 text-red-700 border-red-100'
      : statusLower === 'delivered'
        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
        : statusLower === 'shipped'
          ? 'bg-blue-50 text-blue-700 border-blue-100'
          : statusLower === 'processing'
            ? 'bg-amber-50 text-amber-700 border-amber-100'
            : 'bg-gray-50 text-gray-700 border-gray-100';
            
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${colors}`}>
      {status || '—'}
    </span>
  );
}

export default function OrderDetailPage() {
  const { orderNumber } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Review state
  const [expandedReviewProductId, setExpandedReviewProductId] = useState(null);
  const [expandedReviewVariantId, setExpandedReviewVariantId] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  const [reviewDeletingId, setReviewDeletingId] = useState(null);
  const [myReviewsByProductId, setMyReviewsByProductId] = useState({});
  const [resolvedProductIdBySlug, setResolvedProductIdBySlug] = useState({});
  const [resolvingSlugForReview, setResolvingSlugForReview] = useState(null);

  useEffect(() => {
    if (!orderNumber) {
      setError('Order number is missing.');
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    getOrderByNumber(orderNumber)
      .then((data) => {
        if (!cancelled) setOrder(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message ?? 'Failed to load order.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [orderNumber]);

  const items = order?.items ?? [];
  const orderStatus = String(order?.status ?? '').trim().toUpperCase();
  const canReview = orderStatus === 'SHIPPED' || orderStatus === 'DELIVERED';
  const userId = user?.id != null ? String(user.id) : null;

  // Load existing reviews
  useEffect(() => {
    if (!order || !canReview || !userId) return;
    const orderItems = order.items ?? [];
    const ids = new Set();
    orderItems.forEach((i) => {
      const raw = i.productId ?? i.product_id;
      if (raw != null) {
        const id = Number(raw);
        if (!Number.isNaN(id)) ids.add(id);
      }
    });
    ids.forEach((productId) => {
      getProductReviews(productId, { page: 0, size: 50 })
        .then((data) => {
          const myReview = (data.content ?? []).find((r) => String(r.userId) === userId);
          if (myReview) {
            setMyReviewsByProductId((prev) => ({ ...prev, [productId]: myReview }));
          }
        })
        .catch(() => {});
    });
  }, [order?.id, canReview, userId]);

  const openReviewForm = useCallback((productId, existingReview, variantId = null) => {
    setExpandedReviewProductId(productId);
    setExpandedReviewVariantId(variantId != null && !Number.isNaN(Number(variantId)) ? Number(variantId) : null);
    setReviewError(null);
    if (existingReview) {
      setReviewForm({ rating: existingReview.rating, comment: (existingReview.comment ?? '').trim() });
    } else {
      setReviewForm({ rating: 5, comment: '' });
    }
  }, []);

  const closeReviewForm = useCallback(() => {
    setExpandedReviewProductId(null);
    setExpandedReviewVariantId(null);
    setReviewError(null);
  }, []);

  const openReviewFormForItem = useCallback(
    async (item) => {
      const rawId = item.productId ?? item.product_id;
      const slug = item.productSlug ?? item.product_slug;
      const rawVariantId = item.variantId ?? item.productVariantId ?? item.variant_id ?? null;
      const variantId = rawVariantId != null ? Number(rawVariantId) : null;
      let id = rawId != null ? Number(rawId) : null;
      if (id != null && !Number.isNaN(id)) {
        openReviewForm(id, myReviewsByProductId[id] ?? null, variantId);
        return;
      }
      if (slug != null && String(slug).trim()) {
        setReviewError(null);
        setResolvingSlugForReview(slug);
        try {
          const product = await getProductBySlug(String(slug).trim());
          const resolvedId = product?.id != null ? Number(product.id) : null;
          if (resolvedId != null && !Number.isNaN(resolvedId)) {
            setResolvedProductIdBySlug((prev) => ({ ...prev, [slug]: resolvedId }));
            openReviewForm(resolvedId, myReviewsByProductId[resolvedId] ?? null, variantId);
          } else {
            setReviewError('Could not load product. Try opening the product page to review.');
          }
        } catch {
          setReviewError('Could not load product. Try opening the product page to review.');
        } finally {
          setResolvingSlugForReview(null);
        }
        return;
      }
      setReviewError('Product link is missing.');
    },
    [openReviewForm, myReviewsByProductId]
  );

  const handleReviewSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const id = Number(expandedReviewProductId);
      if (Number.isNaN(id)) return;
      setReviewError(null);
      setReviewSubmitting(true);
      try {
        const myReview = myReviewsByProductId[id];
        if (myReview) {
          const updated = await updateReview(id, myReview.id, {
            rating: reviewForm.rating,
            comment: reviewForm.comment,
          });
          setMyReviewsByProductId((prev) => ({ ...prev, [id]: updated }));
        } else {
          const created = await createReview(id, {
            rating: reviewForm.rating,
            comment: reviewForm.comment,
            variantId: expandedReviewVariantId,
          });
          setMyReviewsByProductId((prev) => ({ ...prev, [id]: created }));
        }
        setExpandedReviewProductId(null);
        setExpandedReviewVariantId(null);
        setReviewForm({ rating: 5, comment: '' });
      } catch (err) {
        setReviewError(err?.message ?? 'Failed to save review.');
      } finally {
        setReviewSubmitting(false);
      }
    },
    [reviewForm.rating, reviewForm.comment, myReviewsByProductId, expandedReviewProductId, expandedReviewVariantId]
  );

  const handleReviewDelete = useCallback(async (productId, reviewId) => {
    const id = Number(productId);
    if (Number.isNaN(id)) return;
    setReviewDeletingId(reviewId);
    setReviewError(null);
    try {
      await deleteReview(id, reviewId);
      setMyReviewsByProductId((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setExpandedReviewProductId(null);
    } catch (err) {
      setReviewError(err?.message ?? 'Failed to delete review.');
    } finally {
      setReviewDeletingId(null);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <Package className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-medium text-primary">{error ?? 'Order not found'}</h2>
        <Link
          to="/account/orders"
          className="mt-6 inline-flex items-center gap-2 rounded-full border border-border px-6 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-16">
      {/* Header */}
      <div className="space-y-4">
        <Link
          to="/account/orders"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-secondary transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Orders
        </Link>
        
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl text-primary">
              Order #{order.orderNumber ?? order.id}
            </h1>
            <p className="mt-1 flex items-center gap-2 text-sm text-secondary">
              <Calendar className="h-4 w-4 text-tertiary" />
              Placed on {formatDate(order.createdAt ?? order.created_at)}
            </p>
          </div>
          <StatusBadge status={order.status} />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content - Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="overflow-hidden rounded-xl border border-border bg-white">
            <div className="border-b border-border bg-gray-50/50 px-6 py-4">
              <h2 className="font-medium text-primary">Items ({items.length})</h2>
            </div>
            <ul className="divide-y divide-border">
              {items.map((item, idx) => {
                const rawId = item.productId ?? item.product_id;
                const productSlug = item.productSlug ?? item.product_slug ?? rawId;
                const productPath = productSlug != null ? `/products/${encodeURIComponent(String(productSlug))}` : null;
                const idFromItem = rawId != null ? Number(rawId) : null;
                const id = (idFromItem != null && !Number.isNaN(idFromItem))
                  ? idFromItem
                  : (productSlug != null ? resolvedProductIdBySlug[productSlug] : null);
                const myReview = id != null ? myReviewsByProductId[id] : null;
                const isFormExpanded = expandedReviewProductId === id;
                const isResolving = resolvingSlugForReview === (item.productSlug ?? item.product_slug);

                return (
                  <li key={item.id ?? idx} className="p-6">
                    <div className="flex gap-4 sm:gap-6">
                      {/* Product Image Placeholder or Actual */}
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-gray-50 sm:h-24 sm:w-24">
                        {item.imageUrl || item.image_url ? (
                          <img 
                            src={item.imageUrl || item.image_url} 
                            alt={item.productName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-tertiary">
                            <Package className="h-8 w-8 opacity-20" />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-1 flex-col justify-between">
                        <div className="flex justify-between gap-4">
                          <div>
                            <h3 className="font-medium text-primary">
                              {productPath ? (
                                <Link to={productPath} className="hover:underline">
                                  {item.productName ?? item.product_name ?? 'Product'}
                                </Link>
                              ) : (
                                item.productName ?? item.product_name ?? 'Product'
                              )}
                            </h3>
                            <p className="mt-1 text-sm text-secondary">
                              {[item.size, item.color].filter(Boolean).join(' · ')}
                              {item.sku && <span className="text-tertiary"> · {item.sku}</span>}
                            </p>
                          </div>
                          <p className="text-right font-medium text-primary">
                            Nu {formatPrice(item.totalPrice ?? item.total_price)}
                          </p>
                        </div>
                        
                        <div className="mt-4 flex items-center justify-between">
                          <p className="text-xs text-secondary">
                            Qty: {item.quantity ?? 0} × Nu {formatPrice(item.unitPrice ?? item.unit_price)}
                          </p>
                          
                          {canReview && !isFormExpanded && !myReview && (
                            <button
                              onClick={() => openReviewFormForItem(item)}
                              disabled={isResolving}
                              className="text-xs font-bold uppercase tracking-wider text-primary hover:text-secondary disabled:opacity-50"
                            >
                              {isResolving ? 'Loading...' : 'Write Review'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Review Section */}
                    <AnimatePresence>
                      {(isFormExpanded || myReview) && canReview && (
                        <motion.div
                          initial={{ height: 0, opacity: 0, marginTop: 0 }}
                          animate={{ height: 'auto', opacity: 1, marginTop: 24 }}
                          exit={{ height: 0, opacity: 0, marginTop: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="rounded-lg border border-border bg-gray-50/50 p-4">
                            {myReview && !isFormExpanded ? (
                              <div className="flex gap-4">
                                <div className="shrink-0">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-amber-400 shadow-sm">
                                    <Star className="h-5 w-5 fill-current" />
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <p className="font-medium text-primary">Your Review</p>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => openReviewForm(id, myReview)}
                                        className="p-1 text-secondary hover:text-primary"
                                        title="Edit review"
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => handleReviewDelete(id, myReview.id)}
                                        disabled={reviewDeletingId === myReview.id}
                                        className="p-1 text-secondary hover:text-red-600 disabled:opacity-50"
                                        title="Delete review"
                                      >
                                        {reviewDeletingId === myReview.id ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <Trash2 className="h-4 w-4" />
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                  <div className="mt-1 flex text-amber-400">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                      <Star key={s} className={`h-3.5 w-3.5 ${s <= myReview.rating ? 'fill-current' : 'text-gray-300'}`} />
                                    ))}
                                  </div>
                                  {myReview.comment && (
                                    <p className="mt-2 text-sm text-secondary">{myReview.comment}</p>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <form onSubmit={handleReviewSubmit}>
                                <div className="mb-4">
                                  <label className="block text-xs font-bold uppercase tracking-wider text-secondary">Rating</label>
                                  <div className="mt-2 flex gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <button
                                        key={star}
                                        type="button"
                                        onClick={() => setReviewForm((f) => ({ ...f, rating: star }))}
                                        className="focus:outline-none"
                                      >
                                        <Star
                                          className={`h-6 w-6 transition-colors ${
                                            reviewForm.rating >= star ? 'fill-amber-400 text-amber-400' : 'text-gray-300 hover:text-amber-200'
                                          }`}
                                        />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div className="mb-4">
                                  <label className="block text-xs font-bold uppercase tracking-wider text-secondary">Review</label>
                                  <textarea
                                    value={reviewForm.comment}
                                    onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                                    rows={3}
                                    className="mt-2 w-full rounded-lg border border-border bg-white p-3 text-sm text-primary placeholder:text-tertiary focus:border-primary focus:outline-none focus:ring-0"
                                    placeholder="How was the product?"
                                  />
                                </div>
                                <div className="flex gap-3">
                                  <button
                                    type="submit"
                                    disabled={reviewSubmitting}
                                    className="rounded-full bg-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-secondary disabled:opacity-50"
                                  >
                                    {reviewSubmitting ? 'Saving...' : 'Submit Review'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={closeReviewForm}
                                    className="rounded-full border border-border px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary hover:bg-gray-50"
                                  >
                                    Cancel
                                  </button>
                                </div>
                                {reviewError && (
                                  <p className="mt-3 text-xs text-red-600">{reviewError}</p>
                                )}
                              </form>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Sidebar - Summary */}
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-white p-6">
            <h2 className="mb-4 font-serif text-lg text-primary">Order Summary</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between text-secondary">
                <dt>Subtotal</dt>
                <dd>Nu {formatPrice(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between text-secondary">
                <dt>Shipping</dt>
                <dd>{order.shippingCost > 0 ? `Nu ${formatPrice(order.shippingCost)}` : 'Free'}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <dt>Discount</dt>
                  <dd>- Nu {formatPrice(order.discount)}</dd>
                </div>
              )}
              {order.tax > 0 && (
                <div className="flex justify-between text-secondary">
                  <dt>Tax</dt>
                  <dd>Nu {formatPrice(order.tax)}</dd>
                </div>
              )}
              <div className="border-t border-border pt-3 flex justify-between font-bold text-primary text-base">
                <dt>Total</dt>
                <dd>Nu {formatPrice(order.total)}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-border bg-white p-6">
            <h2 className="mb-4 font-serif text-lg text-primary">Delivery Details</h2>
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 text-secondary" />
              <div className="text-sm text-secondary">
                <p className="font-medium text-primary">Shipping Address</p>
                {/* Assuming shippingAddress is available or falling back to generic text if structure unknown */}
                {order.shippingAddress ? (
                  <div className="mt-1 space-y-0.5">
                    <p>{order.shippingAddress.streetAddress}</p>
                    <p>{[order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.postalCode].filter(Boolean).join(', ')}</p>
                    <p>{order.shippingAddress.country}</p>
                  </div>
                ) : (
                  <p className="mt-1 italic text-tertiary">Address details not available</p>
                )}
              </div>
            </div>
            <div className="mt-6 flex items-start gap-3">
              <CreditCard className="mt-0.5 h-5 w-5 text-secondary" />
              <div className="text-sm text-secondary">
                <p className="font-medium text-primary">Payment Method</p>
                <p className="mt-1 capitalize">{order.paymentMethod?.replace(/_/g, ' ') ?? '—'}</p>
              </div>
            </div>
            {order.status === 'SHIPPED' && (
              <div className="mt-6 flex items-start gap-3">
                <Truck className="mt-0.5 h-5 w-5 text-secondary" />
                <div className="text-sm text-secondary">
                  <p className="font-medium text-primary">Shipping Status</p>
                  <p className="mt-1">On the way</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

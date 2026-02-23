import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrderByNumber } from '@/services/orderService';
import {
  createReview,
  updateReview,
  deleteReview,
  getProductReviews,
} from '@/services/reviewService';
import { getProductBySlug } from '@/services/productService';
import { useAuth } from '@/context/AuthContext';
import { Package, Loader2, ArrowLeft, MessageSquare, Star, Pencil, Trash2 } from 'lucide-react';

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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function StatusBadge({ status }) {
  const statusLower = (status || '').toLowerCase();
  const colors =
    statusLower === 'cancelled' || statusLower === 'returned'
      ? 'bg-red-100 text-red-800'
      : statusLower === 'delivered'
        ? 'bg-green-100 text-green-800'
        : statusLower === 'shipped' || statusLower === 'processing'
          ? 'bg-blue-100 text-blue-800'
          : statusLower === 'confirmed'
            ? 'bg-amber-100 text-amber-800'
            : 'bg-tertiary/30 text-primary';
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${colors}`}>
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

  // Inline review state: which product's form is expanded, form values, and saved reviews per product
  const [expandedReviewProductId, setExpandedReviewProductId] = useState(null);
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

  // Load existing reviews for products in this order (when shipped/delivered)
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

  const openReviewForm = useCallback((productId, existingReview) => {
    setExpandedReviewProductId(productId);
    setReviewError(null);
    if (existingReview) {
      setReviewForm({ rating: existingReview.rating, comment: (existingReview.comment ?? '').trim() });
    } else {
      setReviewForm({ rating: 5, comment: '' });
    }
  }, []);

  const closeReviewForm = useCallback(() => {
    setExpandedReviewProductId(null);
    setReviewError(null);
  }, []);

  const openReviewFormForItem = useCallback(
    async (item) => {
      const rawId = item.productId ?? item.product_id;
      const slug = item.productSlug ?? item.product_slug;
      let id = rawId != null ? Number(rawId) : null;
      if (id != null && !Number.isNaN(id)) {
        openReviewForm(id, myReviewsByProductId[id] ?? null);
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
            openReviewForm(resolvedId, myReviewsByProductId[resolvedId] ?? null);
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
      setReviewError('Product link is missing. Open the product page from the store to leave a review.');
    },
    [openReviewForm, myReviewsByProductId]
  );

  const handleReviewSubmit = useCallback(
    async (e, productId) => {
      e.preventDefault();
      const id = Number(productId);
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
          });
          setMyReviewsByProductId((prev) => ({ ...prev, [id]: created }));
        }
        setExpandedReviewProductId(null);
        setReviewForm({ rating: 5, comment: '' });
      } catch (err) {
        setReviewError(err?.message ?? 'Failed to save review.');
      } finally {
        setReviewSubmitting(false);
      }
    },
    [reviewForm.rating, reviewForm.comment, myReviewsByProductId]
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
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
        <span className="sr-only">Loading order…</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <>
        <p className="text-primary">{error ?? 'Order not found.'}</p>
        <Link
          to="/account/orders"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-secondary hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to orders
        </Link>
      </>
    );
  }

  const total = order.total ?? 0;

  return (
    <>
      <Link
        to="/account/orders"
        className="inline-flex items-center gap-2 text-sm font-medium text-secondary hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to orders
      </Link>
      <div className="mt-6 rounded-xl border border-border bg-quaternary p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-lg font-bold text-primary">
              <Package className="h-5 w-5" aria-hidden />
              Order {order.orderNumber ?? order.id}
            </h1>
            <p className="mt-1 text-sm text-secondary">{formatDate(order.createdAt ?? order.created_at)}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        {items.length > 0 && (
          <div className="mt-6 border-t border-border pt-4">
            <h2 className="text-sm font-semibold text-primary">Items</h2>
            {canReview && (
              <p className="mt-1 text-sm text-secondary">
                You can leave a review for each item below. Your feedback helps other customers.
              </p>
            )}
            {reviewError && (
              <p className="mt-2 text-sm text-red-500" role="alert">
                {reviewError}
              </p>
            )}
            <ul className="mt-3 space-y-3">
              {items.map((item, idx) => {
                const rawId = item.productId ?? item.product_id;
                const productSlug = item.productSlug ?? item.product_slug ?? rawId;
                const productPath = productSlug != null ? `/products/${encodeURIComponent(String(productSlug))}#reviews` : null;
                const idFromItem = rawId != null ? Number(rawId) : null;
                const id = (idFromItem != null && !Number.isNaN(idFromItem))
                  ? idFromItem
                  : (productSlug != null ? resolvedProductIdBySlug[productSlug] : null);
                const myReview = id != null ? myReviewsByProductId[id] : null;
                const isFormExpanded = expandedReviewProductId === id;
                const canReviewThis = canReview;
                const isResolving = resolvingSlugForReview === (item.productSlug ?? item.product_slug);
                return (
                  <li
                    key={item.id ?? idx}
                    className="rounded-lg border border-border p-3 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-primary">
                          {item.productName ?? item.product_name ?? 'Product'}
                        </p>
                        <p className="text-sm text-secondary">
                          {[item.size, item.color].filter(Boolean).join(' · ')}
                          {item.sku && ` · ${item.sku}`}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-primary">
                        Qty {item.quantity ?? 0} × Nu {formatPrice(item.unitPrice ?? item.unit_price)} = Nu {formatPrice(item.totalPrice ?? item.total_price)} /-
                      </p>
                    </div>
                    {canReviewThis && (
                      <div className="border-t border-border/50 pt-3">
                        {myReview && !isFormExpanded ? (
                          <div>
                            <p className="text-sm font-medium text-primary flex items-center gap-2">
                              <span className="flex gap-0.5" aria-label={`Your rating: ${myReview.rating} out of 5`}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-3 w-3 ${star <= myReview.rating ? 'fill-amber-400 text-amber-400' : 'text-tertiary'}`}
                                    aria-hidden
                                  />
                                ))}
                              </span>
                              Your review
                            </p>
                            {myReview.comment && (
                              <p className="mt-1 text-sm text-secondary whitespace-pre-wrap">{myReview.comment}</p>
                            )}
                            <div className="mt-2 flex gap-2">
                              <button
                                type="button"
                                onClick={() => openReviewForm(id, myReview)}
                                className="inline-flex items-center gap-1 rounded border border-border bg-quaternary px-3 py-1.5 text-sm font-medium text-primary hover:bg-tertiary/20"
                              >
                                <Pencil className="h-3.5 w-3.5" aria-hidden />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReviewDelete(id, myReview.id)}
                                disabled={reviewDeletingId === myReview.id}
                                className="inline-flex items-center gap-1 rounded border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
                              >
                                {reviewDeletingId === myReview.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                                )}
                                Delete
                              </button>
                            </div>
                          </div>
                        ) : isFormExpanded && id != null ? (
                          <form
                            onSubmit={(e) => handleReviewSubmit(e, id)}
                            className="space-y-3"
                          >
                            <div>
                              <label className="block text-xs font-medium text-primary">Rating</label>
                              <div className="mt-1 flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => setReviewForm((f) => ({ ...f, rating: star }))}
                                    className="rounded p-1 transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[#80B5AE]"
                                    aria-label={`${star} star${star !== 1 ? 's' : ''}`}
                                    aria-pressed={reviewForm.rating === star}
                                  >
                                    <Star
                                      className={`h-5 w-5 ${reviewForm.rating >= star ? 'fill-amber-400 text-amber-400' : 'text-tertiary'}`}
                                      aria-hidden
                                    />
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-primary">Comment (optional)</label>
                              <textarea
                                value={reviewForm.comment}
                                onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                                maxLength={2000}
                                rows={3}
                                className="mt-1 w-full rounded-lg border border-border bg-quaternary px-3 py-2 text-sm text-primary placeholder:text-tertiary focus:border-[#80B5AE] focus:outline-none focus:ring-2 focus:ring-[#80B5AE]/40"
                                placeholder="Share your experience..."
                              />
                              <p className="mt-0.5 text-xs text-secondary">{reviewForm.comment.length}/2000</p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="submit"
                                disabled={reviewSubmitting}
                                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                                style={{ backgroundColor: '#80B5AE' }}
                              >
                                {reviewSubmitting ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                    Saving…
                                  </>
                                ) : myReview ? (
                                  'Save changes'
                                ) : (
                                  'Submit review'
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={closeReviewForm}
                                className="rounded-lg border border-border bg-quaternary px-4 py-2 text-sm font-medium text-primary hover:bg-tertiary/20"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openReviewFormForItem(item)}
                              disabled={isResolving}
                              className="inline-flex items-center gap-1.5 rounded-lg border-2 border-[#80B5AE] bg-[#80B5AE]/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-[#80B5AE]/20 disabled:opacity-50"
                              style={{ color: '#80B5AE' }}
                            >
                              {isResolving ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                  Loading…
                                </>
                              ) : (
                                <>
                                  <MessageSquare className="h-4 w-4" aria-hidden />
                                  Write a review
                                </>
                              )}
                            </button>
                            {productPath && (
                              <Link
                                to={productPath}
                                className="text-sm font-medium text-secondary hover:text-primary"
                              >
                                View product reviews
                              </Link>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="mt-6 border-t border-border pt-4 text-right">
          <p className="text-base font-semibold text-primary">
            Total: Nu {formatPrice(total)} /-
          </p>
        </div>
      </div>
    </>
  );
}

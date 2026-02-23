import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useParams, useLocation } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getProductBySlug, getProducts } from '@/services/productService';
import { getProductReviews } from '@/services/reviewService';
import { useCart } from '@/hooks/useCart';
import {
  ArrowLeft,
  Package,
  ImageOff,
  Loader2,
  ShoppingCart,
  Tag,
  Layers,
  CheckCircle,
  Star,
  MessageSquare,
} from 'lucide-react';

function formatPrice(value) {
  if (typeof value !== 'number') return String(value ?? '');
  return Number.isInteger(value)
    ? value.toLocaleString()
    : value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const REVIEWS_PAGE_SIZE = 10;

export default function ProductDetailPage() {
  const { slug } = useParams();
  const location = useLocation();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [cartError, setCartError] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  // Reviews (read-only list)
  const [reviewsPage, setReviewsPage] = useState({
    content: [],
    page: 0,
    totalElements: 0,
    totalPages: 0,
    last: true,
  });
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState(null);
  const [reviewPageIndex, setReviewPageIndex] = useState(0);

  const fetchProduct = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getProductBySlug(slug);
      setProduct(data);
      const variants = Array.isArray(data?.variants) ? data.variants.filter((v) => v.isActive !== false && v.active !== false) : [];
      setSelectedVariant(variants.length > 0 ? variants[0] : null);
      setQuantity(1);
    } catch (err) {
      setError(err?.message ?? 'Product not found.');
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    if (location.hash === '#reviews' && !loading && product) {
      const el = document.getElementById('reviews');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash, loading, product]);

  const categorySlug = product?.categorySlug ?? product?.category_slug ?? null;

  useEffect(() => {
    if (!categorySlug) {
      setRelatedProducts([]);
      setRelatedLoading(false);
      return;
    }
    setRelatedLoading(true);
    getProducts({ category: categorySlug, size: 8 })
      .then((res) => {
        const list = res?.content ?? [];
        const currentSlug = product?.slug ?? product?.id;
        const filtered = list.filter((p) => String(p.slug ?? p.id) !== String(currentSlug));
        setRelatedProducts(filtered.slice(0, 8));
      })
      .catch(() => setRelatedProducts([]))
      .finally(() => setRelatedLoading(false));
  }, [categorySlug, product?.slug, product?.id]);

  const productId = product?.id != null ? Number(product.id) : null;
  const prevProductIdRef = useRef(null);
  const fetchReviews = useCallback(
    (page = 0) => {
      if (productId == null) return;
      setReviewsLoading(true);
      setReviewsError(null);
      getProductReviews(productId, { page, size: REVIEWS_PAGE_SIZE })
        .then((data) =>
          setReviewsPage({
            content: data.content ?? [],
            page: data.page ?? 0,
            totalElements: data.totalElements ?? 0,
            totalPages: data.totalPages ?? 0,
            last: data.last ?? true,
          })
        )
        .catch((err) => {
          setReviewsError(err?.message ?? 'Failed to load reviews.');
          setReviewsPage((prev) => ({ ...prev, content: [] }));
        })
        .finally(() => setReviewsLoading(false));
    },
    [productId]
  );

  useEffect(() => {
    if (productId == null) return;
    const isNewProduct = prevProductIdRef.current !== productId;
    if (isNewProduct) {
      prevProductIdRef.current = productId;
      setReviewPageIndex(0);
    }
    const pageToFetch = isNewProduct ? 0 : reviewPageIndex;
    fetchReviews(pageToFetch);
  }, [productId, reviewPageIndex, fetchReviews]);

  useEffect(() => {
    if (!addedToCart) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setAddedToCart(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [addedToCart]);

  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const activeVariants = variants.filter((v) => v.isActive !== false && v.active !== false);
  const sizes = [...new Set(activeVariants.map((v) => v.size).filter(Boolean))];
  const colors = [...new Set(activeVariants.map((v) => v.color).filter(Boolean))];

  const actualPrice = selectedVariant != null && typeof selectedVariant.price === 'number'
    ? selectedVariant.price
    : product?.basePrice;
  const discountAmount = selectedVariant?.discount ?? 0;
  const hasDiscount = typeof discountAmount === 'number' && discountAmount > 0;
  const priceAfterDiscount = hasDiscount ? actualPrice - discountAmount : actualPrice;
  const displayPrice = priceAfterDiscount;
  const displayImage = selectedVariant?.imageUrl || product?.imageUrl || activeVariants[0]?.imageUrl;
  const maxQty = selectedVariant != null && typeof selectedVariant.stockQuantity === 'number'
    ? Math.max(0, selectedVariant.stockQuantity)
    : 99;
  const canAddToCart = activeVariants.length === 0 || selectedVariant != null;
  const outOfStock = selectedVariant != null && (selectedVariant.stockQuantity ?? 0) <= 0;

  const handleAddToCart = async () => {
    if (!canAddToCart || outOfStock) return;
    if (activeVariants.length > 0 && selectedVariant) {
      setCartError(null);
      try {
        await addToCart(selectedVariant.id, quantity);
        setAddedToCart(true);
      } catch (err) {
        setCartError(err?.message ?? 'Failed to add to cart. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-quaternary px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-6xl items-center justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
            <span className="sr-only">Loading product…</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 bg-quaternary px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <Package className="mx-auto h-14 w-14 text-tertiary" aria-hidden />
            <h1 className="mt-4 text-xl font-semibold text-primary">Product not found</h1>
            <p className="mt-2 text-sm text-secondary">{error ?? 'This product may have been removed or the link is invalid.'}</p>
            <Link
              to="/products"
              className="mt-6 inline-flex items-center gap-2 rounded-lg border border-border bg-quaternary px-4 py-2.5 text-sm font-medium text-primary hover:bg-tertiary/20"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back to products
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
        <div className="mx-auto max-w-6xl">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: '#80B5AE' }}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to products
          </Link>

          <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Image + variant preview */}
            <div className="space-y-3">
              <div className="group relative mx-auto max-w-md overflow-hidden rounded-xl bg-tertiary/10 transition-shadow duration-300 hover:shadow-[0_12px_40px_-12px_rgba(128,181,174,0.35)]">
                {(product?.newArrival === true || product?.new_arrival === true) && (
                  <span className="absolute left-6 top-6 z-10 rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-sm" style={{ backgroundColor: '#80B5AE' }}>
                    New arrival
                  </span>
                )}
                {outOfStock && (
                  <span
                    className="absolute right-6 top-6 z-10 flex items-center gap-1.5 rounded-lg border-2 border-white/90 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg backdrop-blur-sm"
                    style={{ backgroundColor: 'rgba(45, 45, 48, 0.95)' }}
                    aria-hidden
                  >
                    Out of stock
                  </span>
                )}
                <div className="aspect-square w-full overflow-hidden rounded-lg">
                  {displayImage ? (
                    <>
                      <img
                        src={displayImage}
                        alt={selectedVariant ? [selectedVariant.size, selectedVariant.color].filter(Boolean).join(' ') : 'Product'}
                        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                      />
                      <span
                        className="product-image-shine pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                        style={{
                          background: 'linear-gradient(105deg, transparent 0%, transparent 35%, rgba(255,255,255,0.18) 50%, transparent 65%, transparent 100%)',
                          backgroundSize: '200% 100%',
                          backgroundPosition: '-200% 0',
                        }}
                        aria-hidden
                      />
                    </>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-tertiary">
                      <ImageOff className="h-24 w-24" aria-hidden />
                    </div>
                  )}
                </div>
                <span
                  className="pointer-events-none absolute inset-0 rounded-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    boxShadow: 'inset 0 0 0 1px rgba(128, 181, 174, 0.25)',
                  }}
                  aria-hidden
                />
              </div>
              {activeVariants.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  <span className="sr-only">Variant preview</span>
                  {activeVariants.map((v) => {
                    const isSelected = selectedVariant?.id === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariant(v)}
                        className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                          isSelected
                            ? 'ring-2'
                            : 'border-border hover:border-secondary'
                        }`}
                        style={isSelected ? { borderColor: '#80B5AE', boxShadow: '0 0 0 2px rgba(128, 181, 174, 0.3)' } : undefined}
                        aria-pressed={isSelected}
                        aria-label={[v.size, v.color].filter(Boolean).join(' ') || `Variant ${v.sku}`}
                      >
                        {v.imageUrl ? (
                          <img
                            src={v.imageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-tertiary/30 text-tertiary">
                            <ImageOff className="h-6 w-6" aria-hidden />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex flex-col">
              {product.categoryName && (
                <Link
                  to={`/categories/${product.categorySlug || ''}`}
                  className="text-sm font-medium transition-colors hover:opacity-80"
                  style={{ color: '#80B5AE' }}
                >
                  {product.categoryName}
                </Link>
              )}
              <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold text-primary sm:text-3xl">
                    {product.name}
                  </h1>
                  {(product.newArrival === true || product.new_arrival === true) && (
                    <span className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white" style={{ backgroundColor: '#80B5AE' }}>
                      New arrival
                    </span>
                  )}
                </div>
                <p className="shrink-0 text-xl font-semibold">
                  {hasDiscount ? (
                    <span className="inline-flex flex-row items-baseline gap-2">
                      <span className="text-lg font-semibold line-through text-red-500">Nu {formatPrice(actualPrice)} /-</span>
                      <span className="text-lg font-semibold" style={{ color: '#80B5AE' }}>Nu {formatPrice(priceAfterDiscount)} /-</span>
                    </span>
                  ) : (
                    <span style={{ color: '#80B5AE' }}>Nu {formatPrice(displayPrice)} /-</span>
                  )}
                </p>
              </div>

              {(product.averageRating != null || (product.reviewCount != null && Number(product.reviewCount) > 0)) && (
                <div className="mt-2 flex items-center gap-2 text-sm text-secondary">
                  <span className="flex items-center gap-0.5" aria-label={`Rating: ${Number(product.averageRating ?? 0).toFixed(1)} out of 5`}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-3 w-3 ${star <= (product.averageRating ?? 0) ? 'fill-amber-400 text-amber-400' : 'text-tertiary'}`}
                        aria-hidden
                      />
                    ))}
                  </span>
                  <span>{Number(product.averageRating ?? 0).toFixed(1)}</span>
                  <span>·</span>
                  <span>{Number(product.reviewCount ?? 0)} review{Number(product.reviewCount ?? 0) !== 1 ? 's' : ''}</span>
                </div>
              )}

              {product.description && (
                <div className="mt-6">
                  <h2 className="text-sm font-medium uppercase tracking-wider" style={{ color: '#80B5AE' }}>Description</h2>
                  <p className="mt-2 text-primary whitespace-pre-wrap">{product.description}</p>
                </div>
              )}

              {(product.brand || product.material) && (
                <dl className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  {product.brand && (
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-tertiary" aria-hidden />
                      <span className="text-secondary">Brand:</span>
                      <span className="font-medium text-primary">{product.brand}</span>
                    </div>
                  )}
                  {product.material && (
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4" style={{ color: '#80B5AE' }} aria-hidden />
                      <span className="text-secondary">Material:</span>
                      <span className="font-medium text-primary">{product.material}</span>
                    </div>
                  )}
                </dl>
              )}

              {/* Variant selection */}
              {activeVariants.length > 0 && (
                <div className="mt-8 space-y-4">
                  <h2 className="text-sm font-medium uppercase tracking-wider" style={{ color: '#80B5AE' }}>Options</h2>
                  {sizes.length > 1 && (
                    <div>
                      <span className="block text-sm font-medium" style={{ color: '#80B5AE' }}>Size</span>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {sizes.map((size) => {
                          const variant =
                            activeVariants.find(
                              (v) => v.size === size && (colors.length <= 1 || v.color === (selectedVariant?.color ?? colors[0]))
                            ) ?? activeVariants.find((v) => v.size === size);
                          const isSelected = selectedVariant?.size === size;
                          const out = variant && (variant.stockQuantity ?? 0) <= 0;
                          return (
                            <button
                              key={`${size}-${variant?.color ?? ''}`}
                              type="button"
                              onClick={() => variant && setSelectedVariant(variant)}
                              disabled={out}
                              className={`min-w-[2.5rem] rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                                isSelected
                                  ? 'text-white'
                                  : out
                                    ? 'cursor-not-allowed border-border text-tertiary'
                                    : 'border-border bg-quaternary text-primary hover:border-secondary hover:bg-tertiary/20'
                              }`}
                            style={isSelected ? { borderColor: '#80B5AE', backgroundColor: '#80B5AE' } : undefined}
                            >
                              {size}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {colors.length > 1 && (
                    <div>
                      <span className="block text-sm font-medium" style={{ color: '#80B5AE' }}>Color</span>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {colors.map((color) => {
                          const variant =
                            activeVariants.find(
                              (v) => v.color === color && (sizes.length <= 1 || v.size === (selectedVariant?.size ?? sizes[0]))
                            ) ?? activeVariants.find((v) => v.color === color);
                          const isSelected = selectedVariant?.color === color;
                          const out = variant && (variant.stockQuantity ?? 0) <= 0;
                          return (
                            <button
                              key={`${color}-${variant?.size ?? ''}`}
                              type="button"
                              onClick={() => variant && setSelectedVariant(variant)}
                              disabled={out}
                              className={`min-w-[2.5rem] rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                                isSelected
                                  ? 'text-white'
                                  : out
                                    ? 'cursor-not-allowed border-border text-tertiary'
                                    : 'border-border bg-quaternary text-primary hover:border-secondary hover:bg-tertiary/20'
                              }`}
                            style={isSelected ? { borderColor: '#80B5AE', backgroundColor: '#80B5AE' } : undefined}
                            >
                              {color}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {sizes.length <= 1 && colors.length <= 1 && activeVariants.length > 1 && (
                    <select
                      value={selectedVariant?.id ?? ''}
                      onChange={(e) => {
                        const v = activeVariants.find((x) => x.id === Number(e.target.value));
                        if (v) setSelectedVariant(v);
                      }}
                      className="w-full rounded-lg border border-border bg-quaternary px-4 py-2.5 text-primary focus:border-[#80B5AE] focus:outline-none focus:ring-2 focus:ring-[#80B5AE]/40"
                      aria-label="Select variant"
                    >
                      <option value="">Select option</option>
                      {activeVariants.map((v) => {
                        const vDiscount = v.discount ?? 0;
                        const vHasDiscount = typeof vDiscount === 'number' && vDiscount > 0;
                        const vDisplayPrice = vHasDiscount ? v.price - vDiscount : v.price;
                        return (
                          <option key={v.id} value={v.id} disabled={(v.stockQuantity ?? 0) <= 0}>
                            {[v.size, v.color].filter(Boolean).join(' / ')} — Nu {formatPrice(vDisplayPrice)} /-{vHasDiscount ? ` (was Nu ${formatPrice(v.price)} /-)` : ''}
                            {(v.stockQuantity ?? 0) <= 0 ? ' (Out of stock)' : ''}
                          </option>
                        );
                      })}
                    </select>
                  )}
                  {selectedVariant && (selectedVariant.stockQuantity ?? 0) <= 0 && (
                    <p className="text-sm font-medium text-red-500">This option is currently out of stock.</p>
                  )}
                </div>
              )}

              {/* Quantity & Add to cart */}
              {activeVariants.length > 0 && (
                <div className="mt-8 space-y-3">
                  {cartError && (
                    <p className="text-sm text-primary">{cartError}</p>
                  )}
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center rounded-lg border border-border bg-quaternary">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="px-4 py-2.5 text-primary hover:bg-tertiary/20 disabled:opacity-50"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="min-w-[3rem] py-2.5 text-center text-sm font-medium text-primary" aria-live="polite">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                      disabled={quantity >= maxQty}
                      className="px-4 py-2.5 text-primary hover:bg-tertiary/20 disabled:opacity-50"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={!canAddToCart || outOfStock || (activeVariants.length > 0 && !selectedVariant)}
                    className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#80B5AE' }}
                  >
                    <ShoppingCart className="h-4 w-4" aria-hidden />
                    {addedToCart ? 'Added to cart' : outOfStock ? 'Out of stock' : 'Add to cart'}
                  </button>
                </div>
                </div>
              )}
            </div>
          </div>

          {/* Reviews */}
          <section id="reviews" className="mt-16 border-t border-border pt-12 scroll-mt-6" aria-labelledby="reviews-heading">
            <h2 id="reviews-heading" className="text-xl font-semibold text-primary sm:text-2xl flex items-center gap-2">
              Reviews
            </h2>
            {/* <p className="mt-2 text-sm text-secondary">
              You can leave a review from your order details once your order is shipped or delivered.
            </p> */}

            {reviewsError && (
              <p className="mt-4 text-sm text-red-500" role="alert">
                {reviewsError}
              </p>
            )}

            {reviewsLoading ? (
              <div className="mt-6 flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
                <span className="sr-only">Loading reviews…</span>
              </div>
            ) : reviewsPage.content.length === 0 ? (
              <p className="mt-6 text-sm text-secondary">No reviews yet. Be the first to review this product.</p>
            ) : (
              <ul className="mt-6 space-y-4">
                {reviewsPage.content.map((review) => (
                    <li
                      key={review.id}
                      className="rounded-xl border border-border bg-quaternary/30 p-4 sm:p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="flex gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-3 w-3 ${star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-tertiary'}`}
                                aria-hidden
                              />
                            ))}
                          </span>
                          <span className="font-medium text-primary">{review.userDisplayName ?? 'Customer'}</span>
                          {review.verifiedPurchase && (
                            <span className="rounded bg-[#80B5AE]/20 px-2 py-0.5 text-xs font-medium" style={{ color: '#80B5AE' }}>
                              Verified purchase
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-secondary">
                          {review.createdAt ? new Date(review.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' }) : ''}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="mt-2 text-primary whitespace-pre-wrap">{review.comment}</p>
                      )}
                    </li>
                  ))}
              </ul>
            )}

            {!reviewsLoading && reviewsPage.totalPages > 1 && (
              <nav className="mt-6 flex items-center justify-center gap-2" aria-label="Reviews pagination">
                <button
                  type="button"
                  onClick={() => setReviewPageIndex((p) => Math.max(0, p - 1))}
                  disabled={reviewsPage.page <= 0}
                  className="rounded-lg border border-border bg-quaternary px-4 py-2 text-sm font-medium text-primary hover:bg-tertiary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-secondary">
                  Page {reviewsPage.page + 1} of {reviewsPage.totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setReviewPageIndex((p) => p + 1)}
                  disabled={reviewsPage.last}
                  className="rounded-lg border border-border bg-quaternary px-4 py-2 text-sm font-medium text-primary hover:bg-tertiary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            )}
          </section>

          {/* Related products - always show when product is loaded */}
          <section className="mt-16 border-t border-border pt-12" aria-labelledby="related-products-heading">
            <h2 id="related-products-heading" className="text-xl font-semibold text-primary sm:text-2xl">
              Related products
            </h2>
            {!categorySlug ? (
              <p className="mt-4 text-sm text-secondary">No category for this product.</p>
            ) : relatedLoading ? (
              <div className="mt-6 flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
                <span className="sr-only">Loading related products…</span>
              </div>
            ) : relatedProducts.length === 0 ? (
              <p className="mt-4 text-sm text-secondary">No related products in this category.</p>
            ) : (
                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {relatedProducts.map((p) => {
                    const firstVariant = Array.isArray(p.variants) && p.variants.length > 0 ? p.variants[0] : null;
                    const vDiscount = firstVariant?.discount ?? 0;
                    const pPrice = firstVariant && (vDiscount ?? 0) > 0
                      ? (firstVariant.price - (firstVariant.discount ?? 0))
                      : (p.basePrice ?? 0);
                    return (
                      <Link
                        key={p.id}
                        to={`/products/${encodeURIComponent(p.slug ?? p.id)}`}
                        className="group flex flex-col overflow-hidden rounded-lg border border-border bg-quaternary transition-all hover:border-[#80B5AE]/50 hover:shadow-md"
                      >
                        <div className="aspect-[3/4] w-full overflow-hidden rounded-t-lg bg-tertiary/20">
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt=""
                              className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-tertiary">
                              <ImageOff className="h-12 w-12" aria-hidden />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-1 flex-col p-3">
                          <h3 className="line-clamp-2 text-sm font-medium text-primary group-hover:text-secondary">
                            {p.name}
                          </h3>
                          <p className="mt-1 text-sm font-semibold" style={{ color: '#80B5AE' }}>
                            Nu {formatPrice(pPrice)} /-
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
            )}
          </section>
        </div>
      </main>
      <Footer />

      {/* Added to cart success dialog */}
      {addedToCart &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex min-h-screen items-start justify-center pt-[18%] p-4 sm:pt-[14%] lg:pt-[10%]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="added-to-cart-title"
            aria-describedby="added-to-cart-desc"
          >
            <div
              className="absolute inset-0"
              aria-hidden
              onClick={() => setAddedToCart(false)}
            />
            <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-quaternary p-6 shadow-xl">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#80B5AE]/20" aria-hidden>
                  <CheckCircle className="h-8 w-8 text-[#80B5AE]" aria-hidden />
                </div>
                <h2 id="added-to-cart-title" className="mt-4 text-lg font-semibold text-primary">
                  Added to cart
                </h2>
                <p id="added-to-cart-desc" className="mt-1 text-sm text-secondary">
                  {product?.name} has been added to your cart.
                </p>
                <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row">
                  <Link
                    to="/cart"
                    onClick={() => setAddedToCart(false)}
                    className="flex-1 rounded-lg bg-[#80B5AE] px-4 py-2.5 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    View cart
                  </Link>
                  <button
                    type="button"
                    onClick={() => setAddedToCart(false)}
                    className="flex-1 rounded-lg border border-border bg-quaternary px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-tertiary/20"
                  >
                    Continue shopping
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

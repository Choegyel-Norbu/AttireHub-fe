import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/product/ProductCard';
import { getProductBySlug, getProducts } from '@/services/productService';
import { getProductReviews } from '@/services/reviewService';
import { useCart } from '@/hooks/useCart';
import {
  ArrowLeft,
  Package,
  ImageOff,
  Loader2,
  ShoppingBag,
  Star,
  Check,
  Minus,
  Plus,
  Share2,
  ShieldCheck,
  Truck
} from 'lucide-react';

function formatPrice(value) {
  if (typeof value !== 'number') return String(value ?? '');
  return Number.isInteger(value)
    ? value.toLocaleString()
    : value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const REVIEWS_PAGE_SIZE = 5;

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

  // Reviews state
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

  // Fetch Product
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

  // Scroll to top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // Scroll to reviews if hash present
  useEffect(() => {
    if (location.hash === '#reviews' && !loading && product) {
      const el = document.getElementById('reviews');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash, loading, product]);

  // Fetch Related Products
  const categorySlug = product?.categorySlug ?? product?.category_slug ?? null;
  useEffect(() => {
    if (!categorySlug) {
      setRelatedProducts([]);
      return;
    }
    setRelatedLoading(true);
    getProducts({ category: categorySlug, size: 4 })
      .then((res) => {
        const list = res?.content ?? [];
        const currentSlug = product?.slug ?? product?.id;
        const filtered = list.filter((p) => String(p.slug ?? p.id) !== String(currentSlug));
        setRelatedProducts(filtered.slice(0, 4));
      })
      .catch(() => setRelatedProducts([]))
      .finally(() => setRelatedLoading(false));
  }, [categorySlug, product?.slug, product?.id]);

  // Fetch Reviews
  const productId = product?.id != null ? Number(product.id) : null;
  const selectedVariantId = selectedVariant?.id != null ? Number(selectedVariant.id) : null;
  const prevProductIdRef = useRef(null);
  const prevVariantIdRef = useRef(null);

  const fetchReviews = useCallback(
    (page = 0) => {
      if (productId == null) return;
      setReviewsLoading(true);
      setReviewsError(null);
      const params = { page, size: REVIEWS_PAGE_SIZE };
      if (selectedVariantId != null && !Number.isNaN(selectedVariantId)) {
        params.variantId = selectedVariantId;
      }
      getProductReviews(productId, params)
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
    [productId, selectedVariantId]
  );

  useEffect(() => {
    if (productId == null) return;
    const isNewProduct = prevProductIdRef.current !== productId;
    const isNewVariant = prevVariantIdRef.current !== selectedVariantId;
    if (isNewProduct || isNewVariant) {
      prevProductIdRef.current = productId;
      prevVariantIdRef.current = selectedVariantId;
      setReviewPageIndex(0);
      fetchReviews(0);
      return;
    }
    fetchReviews(reviewPageIndex);
  }, [productId, selectedVariantId, reviewPageIndex, fetchReviews]);

  // Derived State
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
  
  // Image Logic
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
      <div className="flex min-h-screen flex-col bg-white">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
          <Package className="h-16 w-16 text-tertiary/50" />
          <h1 className="mt-4 text-2xl font-serif text-primary">Product Not Found</h1>
          <p className="mt-2 text-secondary/70">{error ?? 'This product may have been removed.'}</p>
          <Link
            to="/products"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold uppercase tracking-wider text-white hover:bg-secondary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Shop
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      
      <main className="flex-1">
        {/* Breadcrumb / Back */}
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-secondary/60 hover:text-primary"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Collection
          </Link>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            
            {/* Left: Image Gallery */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-4 max-w-md mx-auto lg:mx-0 lg:max-w-none"
            >
              <div className="relative aspect-[3/4] w-full max-w-md mx-auto overflow-hidden rounded-sm bg-[#F0F0F0]">
                {(product.newArrival === true || product.new_arrival === true) && (
                  <span className="absolute left-4 top-4 z-10 bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary backdrop-blur-sm">
                    New Arrival
                  </span>
                )}
                {displayImage ? (
                  <img
                    src={displayImage}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-tertiary">
                    <ImageOff className="h-12 w-12 opacity-30" />
                  </div>
                )}
              </div>
              
              {/* Thumbnail strip (if variants have images) */}
              {activeVariants.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  {activeVariants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-sm border transition-all ${
                        selectedVariant?.id === v.id 
                          ? 'border-primary ring-1 ring-primary' 
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      {v.imageUrl ? (
                        <img src={v.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-gray-100" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Right: Product Info */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col"
            >
              <div className="mb-2 flex items-center gap-2 text-sm text-secondary/60">
                {product.categoryName && (
                  <Link to={`/products?category=${product.categorySlug}`} className="hover:text-primary hover:underline">
                    {product.categoryName}
                  </Link>
                )}
                {product.brand && (
                  <>
                    <span>•</span>
                    <span>{product.brand}</span>
                  </>
                )}
              </div>

              <h1 className="font-serif text-3xl text-primary sm:text-4xl lg:text-5xl">
                {product.name}
              </h1>

              <div className="mt-4 flex items-baseline gap-4">
                <p className="text-2xl font-medium text-primary">
                  Nu {formatPrice(displayPrice)}
                </p>
                {hasDiscount && (
                  <p className="text-lg text-secondary/50 line-through">
                    Nu {formatPrice(actualPrice)}
                  </p>
                )}
              </div>

              {/* Rating */}
              <div className="mt-4 flex items-center gap-2">
                <div className="flex text-primary">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= (product.averageRating ?? 0) ? 'fill-primary' : 'fill-transparent text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <a href="#reviews" className="text-sm text-secondary underline underline-offset-4 hover:text-primary">
                  {product.reviewCount ?? 0} Reviews
                </a>
              </div>

              <div className="my-6 h-px w-full bg-border" />

              {/* Description */}
              <div className="text-sm leading-relaxed text-secondary/80">
                <p>{product.description}</p>
              </div>

              {/* Options */}
              <div className="mt-8 space-y-6">
                {/* Colors */}
                {colors.length > 0 && (
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">Color: <span className="font-normal text-secondary">{selectedVariant?.color}</span></span>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {colors.map((color) => {
                        const variant = activeVariants.find(v => v.color === color);
                        const isSelected = selectedVariant?.color === color;
                        return (
                          <button
                            key={color}
                            onClick={() => variant && setSelectedVariant(variant)}
                            className={`relative flex h-10 min-w-[3rem] items-center justify-center rounded-md border px-3 text-sm transition-all ${
                              isSelected 
                                ? 'border-primary bg-primary text-white' 
                                : 'border-border bg-white text-primary hover:border-primary'
                            }`}
                          >
                            {color}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sizes */}
                {sizes.length > 0 && (
                  <div>
                    <div className="flex justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary">Size: <span className="font-normal text-secondary">{selectedVariant?.size}</span></span>
                      {/* Placeholder for size guide */}
                      <button className="text-xs text-secondary underline hover:text-primary">Size Guide</button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {sizes.map((size) => {
                        const variant = activeVariants.find(v => v.size === size);
                        const isSelected = selectedVariant?.size === size;
                        const disabled = !variant || (variant.stockQuantity ?? 0) <= 0;
                        return (
                          <button
                            key={size}
                            onClick={() => variant && setSelectedVariant(variant)}
                            disabled={disabled}
                            className={`relative flex h-10 min-w-[3rem] items-center justify-center rounded-md border px-3 text-sm transition-all ${
                              isSelected 
                                ? 'border-primary bg-primary text-white' 
                                : disabled
                                  ? 'cursor-not-allowed border-transparent bg-gray-100 text-gray-400 decoration-slice line-through'
                                  : 'border-border bg-white text-primary hover:border-primary'
                            }`}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                {/* Quantity */}
                <div className="flex h-12 w-32 items-center justify-between rounded-full border border-border px-4">
                  <button 
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="text-secondary hover:text-primary"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="font-medium text-primary">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(q => Math.min(maxQty, q + 1))}
                    className="text-secondary hover:text-primary"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Add to Cart */}
                <button
                  onClick={handleAddToCart}
                  disabled={!canAddToCart || outOfStock}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-8 text-sm font-bold uppercase tracking-wider text-white transition-all hover:bg-secondary disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                >
                  <ShoppingBag className="h-4 w-4" />
                  {outOfStock ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </div>

              {cartError && (
                <p className="mt-2 text-sm text-red-600">{cartError}</p>
              )}

              {/* Trust Badges */}
              <div className="mt-8 grid grid-cols-2 gap-4 border-t border-border pt-8 text-sm text-secondary">
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-primary" />
                  <span>Free shipping over $75</span>
                </div>
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <span>Secure payment</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Reviews Section */}
          <div id="reviews" className="mt-24 border-t border-border pt-16">
            <div className="mb-10 flex items-center justify-between">
              <h2 className="font-serif text-2xl text-primary sm:text-3xl">Customer Reviews</h2>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-primary">{Number(product.averageRating ?? 0).toFixed(1)}</span>
                <div className="flex text-primary">
                  <Star className="h-5 w-5 fill-primary" />
                </div>
                <span className="text-sm text-secondary">({product.reviewCount ?? 0})</span>
              </div>
            </div>

            {reviewsLoading ? (
               <div className="flex justify-center py-12">
                 <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
               </div>
            ) : reviewsPage.content.length === 0 ? (
              <div className="bg-gray-50 p-8 text-center rounded-lg">
                <p className="text-secondary">No reviews yet. Be the first to share your thoughts!</p>
              </div>
            ) : (
              <div className="grid gap-8 lg:grid-cols-2">
                {reviewsPage.content.map((review) => (
                  <div key={review.id} className="border-b border-border pb-8 last:border-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-primary">{review.userDisplayName || 'Customer'}</span>
                        {review.verifiedPurchase && (
                          <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-green-600">
                            <Check className="h-3 w-3" /> Verified
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-secondary/60">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="mt-2 flex text-primary">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3 w-3 ${star <= review.rating ? 'fill-primary' : 'fill-transparent text-gray-200'}`}
                        />
                      ))}
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-secondary">
                      {review.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}
            
            {/* Pagination */}
            {reviewsPage.totalPages > 1 && (
              <div className="mt-8 flex justify-center gap-2">
                <button
                   onClick={() => setReviewPageIndex(p => Math.max(0, p - 1))}
                   disabled={reviewsPage.page === 0}
                   className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                   onClick={() => setReviewPageIndex(p => p + 1)}
                   disabled={reviewsPage.last}
                   className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-24 border-t border-border pt-16 pb-24">
              <h2 className="mb-10 font-serif text-2xl text-primary sm:text-3xl">You May Also Like</h2>
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
                {relatedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Added to Cart Modal */}
      <AnimatePresence>
        {addedToCart && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAddedToCart(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative z-10 w-full max-w-sm overflow-hidden rounded-xl bg-white p-6 shadow-2xl"
            >
              <div className="flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <Check className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-primary">Added to Bag</h3>
                <p className="mt-2 text-sm text-secondary">
                  {product?.name} is now in your cart.
                </p>
                <div className="mt-6 flex w-full flex-col gap-3">
                  <Link
                    to="/cart"
                    className="flex w-full items-center justify-center rounded-full bg-primary py-3 text-sm font-bold uppercase tracking-wider text-white hover:bg-secondary"
                  >
                    View Cart
                  </Link>
                  <button
                    onClick={() => setAddedToCart(false)}
                    className="w-full text-sm font-medium text-secondary hover:text-primary"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

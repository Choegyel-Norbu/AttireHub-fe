import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getProductBySlug } from '@/services/productService';
import { useCart } from '@/hooks/useCart';
import {
  ArrowLeft,
  Package,
  ImageOff,
  Loader2,
  ShoppingCart,
  Tag,
  Layers,
} from 'lucide-react';

function formatPrice(value) {
  if (typeof value !== 'number') return String(value ?? '');
  return Number.isInteger(value)
    ? value.toLocaleString()
    : value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [cartError, setCartError] = useState(null);

  const fetchProduct = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getProductBySlug(slug);
      setProduct(data);
      const variants = Array.isArray(data?.variants) ? data.variants.filter((v) => v.isActive !== false && v.active !== false) : [];
      if (variants.length === 1) {
        setSelectedVariant(variants[0]);
      } else {
        setSelectedVariant(null);
      }
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

  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const activeVariants = variants.filter((v) => v.isActive !== false && v.active !== false);
  const sizes = [...new Set(activeVariants.map((v) => v.size).filter(Boolean))];
  const colors = [...new Set(activeVariants.map((v) => v.color).filter(Boolean))];

  const displayPrice = selectedVariant != null && typeof selectedVariant.price === 'number'
    ? selectedVariant.price
    : product?.basePrice;
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
        setTimeout(() => setAddedToCart(false), 3000);
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
              className="mt-6 inline-flex items-center gap-2 rounded-lg border border-tertiary bg-quaternary px-4 py-2.5 text-sm font-medium text-primary hover:bg-tertiary/20"
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
            className="inline-flex items-center gap-2 text-sm font-medium text-secondary hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to products
          </Link>

          <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Image + variant preview */}
            <div className="space-y-3">
              <div className="relative mx-auto max-w-md overflow-hidden rounded-xl border border-tertiary bg-tertiary/10 p-4">
                {(product?.newArrival === true || product?.new_arrival === true) && (
                  <span className="absolute left-6 top-6 z-10 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-quaternary shadow-sm">
                    New arrival
                  </span>
                )}
                <div className="aspect-square w-full overflow-hidden rounded-lg">
                  {displayImage ? (
                    <img
                      src={displayImage}
                      alt={selectedVariant ? [selectedVariant.size, selectedVariant.color].filter(Boolean).join(' ') : 'Product'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-tertiary">
                      <ImageOff className="h-24 w-24" aria-hidden />
                    </div>
                  )}
                </div>
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
                            ? 'border-primary ring-2 ring-primary/30'
                            : 'border-tertiary hover:border-secondary'
                        }`}
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
                  className="text-sm font-medium text-secondary hover:text-primary"
                >
                  {product.categoryName}
                </Link>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold text-primary sm:text-3xl">
                  {product.name}
                </h1>
                {(product.newArrival === true || product.new_arrival === true) && (
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-quaternary">
                    New arrival
                  </span>
                )}
              </div>
              <p className="mt-4 text-xl font-semibold text-primary">
                Nu {formatPrice(displayPrice)} /-
              </p>

              {product.description && (
                <div className="mt-6">
                  <h2 className="text-sm font-medium uppercase tracking-wider text-secondary">Description</h2>
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
                      <Layers className="h-4 w-4 text-tertiary" aria-hidden />
                      <span className="text-secondary">Material:</span>
                      <span className="font-medium text-primary">{product.material}</span>
                    </div>
                  )}
                </dl>
              )}

              {/* Variant selection */}
              {activeVariants.length > 0 && (
                <div className="mt-8 space-y-4">
                  <h2 className="text-sm font-medium uppercase tracking-wider text-secondary">Options</h2>
                  {sizes.length > 1 && (
                    <div>
                      <span className="block text-sm font-medium text-primary">Size</span>
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
                                  ? 'border-primary bg-primary text-quaternary'
                                  : out
                                    ? 'cursor-not-allowed border-tertiary text-tertiary'
                                    : 'border-tertiary bg-quaternary text-primary hover:border-secondary hover:bg-tertiary/20'
                              }`}
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
                      <span className="block text-sm font-medium text-primary">Color</span>
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
                                  ? 'border-primary bg-primary text-quaternary'
                                  : out
                                    ? 'cursor-not-allowed border-tertiary text-tertiary'
                                    : 'border-tertiary bg-quaternary text-primary hover:border-secondary hover:bg-tertiary/20'
                              }`}
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
                      className="w-full rounded-lg border border-tertiary bg-quaternary px-4 py-2.5 text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      aria-label="Select variant"
                    >
                      <option value="">Select option</option>
                      {activeVariants.map((v) => (
                        <option key={v.id} value={v.id} disabled={(v.stockQuantity ?? 0) <= 0}>
                          {[v.size, v.color].filter(Boolean).join(' / ')} — Nu {formatPrice(v.price)} /-
                          {(v.stockQuantity ?? 0) <= 0 ? ' (Out of stock)' : ''}
                        </option>
                      ))}
                    </select>
                  )}
                  {selectedVariant && (selectedVariant.stockQuantity ?? 0) <= 0 && (
                    <p className="text-sm font-medium text-primary">This option is currently out of stock.</p>
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
                  <div className="flex items-center rounded-lg border border-tertiary bg-quaternary">
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
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-quaternary transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart className="h-4 w-4" aria-hidden />
                    {addedToCart ? 'Added to cart' : outOfStock ? 'Out of stock' : 'Add to cart'}
                  </button>
                </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

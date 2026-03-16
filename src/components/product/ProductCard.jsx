import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageOff, ShoppingBag, Loader2, Check } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/useToast';

const ProductCard = ({ product }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();
  const { show: showToast } = useToast();

  const variants = Array.isArray(product.variants) ? product.variants : [];
  const firstVariant = variants.length > 0 ? variants[0] : null;
  const displayImage = firstVariant?.imageUrl ?? variants.find((v) => v.imageUrl)?.imageUrl;
  const displayPrice = firstVariant?.price ?? product.basePrice;
  const hasDiscount = firstVariant?.discount > 0;
  const priceAfterDiscount =
    hasDiscount && typeof firstVariant.price === 'number' && typeof firstVariant.discount === 'number'
      ? firstVariant.price - firstVariant.discount
      : null;
  const discountPercent =
    hasDiscount && typeof firstVariant.price === 'number' && firstVariant.price > 0
      ? Math.round((firstVariant.discount / firstVariant.price) * 100)
      : null;

  const distinctColors = [...new Set(variants.map((v) => v.color).filter(Boolean))];
  const distinctSizes = [...new Set(variants.map((v) => v.size).filter(Boolean))];

  const formatPrice = (value) => {
    if (typeof value !== 'number') return String(value ?? '');
    return Number.isInteger(value)
      ? value.toLocaleString()
      : value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!firstVariant?.id || adding) return;
    setAdding(true);
    setAdded(false);
    try {
      await addToCart(firstVariant.id, 1);
      setAdded(true);
      showToast({ message: 'Added to cart', variant: 'success' });
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      showToast({ message: err?.message ?? 'Could not add to cart', variant: 'error' });
    } finally {
      setAdding(false);
    }
  };

  return (
    <Link
      to={`/products/${encodeURIComponent(product.slug ?? product.id)}`}
      className="group relative flex h-full flex-col bg-white/90 p-2 transition-transform duration-300 hover:-translate-y-1 sm:p-3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-[3/4] w-full flex-shrink-0 overflow-hidden bg-[#F5F5F5]">
        {/* Badges */}
        <div className="absolute left-3 top-3 z-10 flex flex-col gap-1">
          {(product.newArrival === true || product.new_arrival === true) && (
            <span className="inline-flex items-center rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary backdrop-blur-sm">
              New
            </span>
          )}
          {hasDiscount && discountPercent != null && (
            <span className="inline-flex items-center rounded-full bg-primary text-[10px] font-semibold uppercase tracking-[0.18em] text-white/95 px-2 py-0.5">
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* Image: first variant or product */}
        {displayImage ? (
          <motion.img
            src={displayImage}
            alt={product.name}
            className="h-full w-full object-cover object-center"
            initial={{ scale: 1 }}
            animate={{ scale: isHovered ? 1.05 : 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-tertiary">
            <ImageOff className="h-8 w-8 opacity-40" strokeWidth={1.5} />
          </div>
        )}

        {/* Quick Actions Overlay (Desktop) */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-4 left-4 right-4 hidden gap-2 lg:flex"
            >
              <button
                type="button"
                disabled={!firstVariant || adding}
                onClick={handleAddToCart}
                className="flex flex-1 items-center justify-center gap-2 rounded-full border border-[var(--color-accent-blush)] bg-[var(--color-accent-blush)] py-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary shadow-sm transition-all hover:bg-[#f4d7c5] hover:border-[#f4d7c5] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {adding ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : added ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <ShoppingBag className="h-3.5 w-3.5" />
                )}
                {adding ? 'Adding…' : added ? 'Added' : 'Add to Cart'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Product Info */}
      <div className="mt-2 flex min-h-[112px] flex-col gap-1 sm:mt-4 sm:min-h-[140px]">
        {/* Meta row */}
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-[10px] font-medium uppercase tracking-[0.18em] text-secondary/70 sm:text-[11px]">
            {product.categoryName || product.brand || 'Apparel'}
          </p>
          {distinctColors.length > 0 && (
            <p className="text-[10px] text-secondary/50 sm:text-[11px]">
              {distinctColors.length} color{distinctColors.length > 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Name */}
        <h3 className="line-clamp-2 min-w-0 text-xs font-medium text-primary underline-offset-4 group-hover:underline sm:text-sm">
          {product.name}
        </h3>

        {/* Price block */}
        <div className="mt-0.5 flex items-baseline gap-2">
          <span className="text-sm font-semibold text-primary sm:text-base">
            Nu {formatPrice(priceAfterDiscount ?? displayPrice)}
          </span>
          {hasDiscount && priceAfterDiscount != null && (
            <span className="text-[11px] text-secondary/60 line-through">
              Nu {formatPrice(displayPrice)}
            </span>
          )}
        </div>

        {/* Subline */}
        <p className="mt-0.5 text-[10px] text-secondary/60 sm:text-xs">
          {distinctSizes.length > 0
            ? `Available in ${distinctSizes.length} size${distinctSizes.length > 1 ? 's' : ''}`
            : '\u00A0'}
        </p>

        {/* Mobile Add to Cart — always reserve space when variants exist for consistent height */}
        {firstVariant ? (
          <button
            type="button"
            disabled={adding}
            onClick={handleAddToCart}
            className="mt-1.5 flex w-full min-h-8 items-center justify-center gap-1.5 rounded-full border border-[var(--color-accent-blush)] bg-[var(--color-accent-blush)] py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary transition-all hover:bg-[#f4d7c5] hover:border-[#f4d7c5] disabled:opacity-60 sm:mt-2 sm:py-2 sm:text-xs lg:hidden"
          >
            {adding ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : added ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <ShoppingBag className="h-3.5 w-3.5" />
            )}
            {adding ? 'Adding…' : added ? 'Added' : 'Add to Cart'}
          </button>
        ) : (
          <div className="mt-2 h-9" aria-hidden />
        )}
      </div>
    </Link>
  );
};

export default ProductCard;

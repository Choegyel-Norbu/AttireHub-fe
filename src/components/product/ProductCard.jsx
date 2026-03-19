import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageOff, ShoppingBag, Loader2, Check, Heart } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/context/AuthContext';
import { getProductCardImageUrl } from '@/utils/productImages';
import { addWishlistItem } from '@/services/wishlistService';

const ProductCard = ({ product }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [wishlisting, setWishlisting] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { show: showToast } = useToast();

  const variantGroups = Array.isArray(product.variantGroups) ? product.variantGroups : [];
  const legacyVariants = Array.isArray(product.variants) ? product.variants : [];

  // Flatten sizeOptions from all active groups (new model).
  const sizeOptions = variantGroups.flatMap((g) =>
    Array.isArray(g?.sizeOptions)
      ? g.sizeOptions.map((s) => ({
          ...s,
          color: s.color ?? g.color,
        }))
      : []
  );

  // Pick a primary purchasable variant: first active size in first active group, else legacy first variant.
  const primarySizeOption =
    sizeOptions.find((s) => s.active !== false && s.isActive !== false) || sizeOptions[0] || null;
  const firstVariant = primarySizeOption || (legacyVariants.length > 0 ? legacyVariants[0] : null);

  const displayImage = getProductCardImageUrl(product);
  // Pricing & discount logic with variantGroups support.
  const activeSizeEntries = sizeOptions
    .filter((s) => s.active !== false && s.isActive !== false && typeof s.price === 'number')
    .map((s) => ({
      price: Number(s.price),
      discount: typeof s.discount === 'number' ? Number(s.discount) : 0,
    }));

  const productLevelDiscount = typeof product.discount === 'number' ? Number(product.discount) : 0;

  const anySizeDiscount = activeSizeEntries.some((e) => e.discount > 0);
  const hasDiscount = anySizeDiscount || productLevelDiscount > 0;

  // Base price candidates (no discount applied yet)
  const minActivePrice =
    activeSizeEntries.length > 0
      ? Math.min(...activeSizeEntries.map((e) => e.price))
      : typeof firstVariant?.price === 'number'
        ? Number(firstVariant.price)
        : typeof product.basePrice === 'number'
          ? Number(product.basePrice)
          : null;

  // Original price for discounted variants (used as struck-through value).
  const minDiscountedBasePrice =
    anySizeDiscount && activeSizeEntries.length > 0
      ? Math.min(...activeSizeEntries.filter((e) => e.discount > 0).map((e) => e.price))
      : minActivePrice;

  // Effective price after discount.
  const minEffectiveSizePrice =
    activeSizeEntries.length > 0
      ? Math.min(
          ...activeSizeEntries.map((e) =>
            e.discount > 0 && e.discount < e.price ? e.price - e.discount : e.price
          )
        )
      : null;

  let displayPrice = minActivePrice;
  let priceBeforeDiscount = null;
  let priceAfterDiscount = null;

  if (hasDiscount) {
    if (anySizeDiscount && minEffectiveSizePrice != null) {
      displayPrice = minEffectiveSizePrice;
      priceBeforeDiscount = minDiscountedBasePrice ?? minActivePrice;
      priceAfterDiscount = displayPrice;
    } else if (productLevelDiscount > 0 && minActivePrice != null) {
      priceBeforeDiscount = minActivePrice;
      priceAfterDiscount = Math.max(0, minActivePrice - productLevelDiscount);
      displayPrice = priceAfterDiscount;
    }
  }

  if (!hasDiscount && displayPrice == null && typeof firstVariant?.price === 'number') {
    displayPrice = Number(firstVariant.price);
  }
  if (!hasDiscount && displayPrice == null && typeof product.basePrice === 'number') {
    displayPrice = Number(product.basePrice);
  }

  const discountPercent =
    hasDiscount && priceBeforeDiscount != null && priceAfterDiscount != null && priceBeforeDiscount > 0
      ? Math.round(((priceBeforeDiscount - priceAfterDiscount) / priceBeforeDiscount) * 100)
      : null;

  const showStruckOriginalPrice =
    hasDiscount &&
    priceBeforeDiscount != null &&
    priceAfterDiscount != null &&
    priceBeforeDiscount > priceAfterDiscount;

  const distinctColors =
    variantGroups.length > 0
      ? [...new Set(variantGroups.map((g) => g.color).filter(Boolean))]
      : [...new Set(legacyVariants.map((v) => v.color).filter(Boolean))];
  const distinctSizes =
    sizeOptions.length > 0
      ? [...new Set(sizeOptions.map((s) => s.size).filter(Boolean))]
      : [...new Set(legacyVariants.map((v) => v.size).filter(Boolean))];

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

  const handleAddToWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product?.id || wishlisting) return;

    if (!isAuthenticated) {
      showToast({
        message: 'Please sign in to add items to wishlist.',
        variant: 'error',
      });
      return;
    }

    setWishlisting(true);
    try {
      await addWishlistItem(product.id);
      setWishlisted(true);
      showToast({ message: 'Added to wishlist', variant: 'success' });
    } catch (err) {
      if (err?.status === 409) {
        setWishlisted(true);
        showToast({ message: err?.message ?? 'Product already in wishlist.', variant: 'success' });
      } else {
        showToast({ message: err?.message ?? 'Could not add to wishlist', variant: 'error' });
      }
    } finally {
      setWishlisting(false);
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
          <span className="text-xs font-semibold text-primary sm:text-sm">
            Nu {formatPrice(priceAfterDiscount ?? displayPrice)}
          </span>
          {showStruckOriginalPrice && (
            <span className="text-[11px] text-secondary/60 line-through">
              Nu {formatPrice(priceBeforeDiscount)}
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
          <div className="mt-1.5 space-y-2 sm:mt-2">
            <button
              type="button"
              disabled={adding}
              onClick={handleAddToCart}
              className="flex w-full min-h-8 items-center justify-center gap-1.5 rounded-full border border-[var(--color-accent-blush)] bg-[var(--color-accent-blush)] py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary transition-all hover:bg-[#f4d7c5] hover:border-[#f4d7c5] disabled:opacity-60 sm:py-2 sm:text-xs lg:hidden"
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

            <button
              type="button"
              disabled={wishlisting}
              onClick={handleAddToWishlist}
              className={`flex w-full min-h-8 items-center justify-center gap-1.5 rounded-full border py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] transition-all sm:py-2 sm:text-xs ${
                wishlisted
                  ? 'border-primary/30 bg-primary/5 text-primary'
                  : 'border-border bg-white text-secondary hover:border-primary hover:text-primary'
              } disabled:opacity-60`}
            >
              {wishlisting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Heart className={`h-3.5 w-3.5 ${wishlisted ? 'fill-primary/20' : ''}`} />
              )}
              {wishlisted ? 'Wishlisted' : 'Add to Wishlist'}
            </button>
          </div>
        ) : (
          <div className="mt-2 h-9" aria-hidden />
        )}
      </div>
    </Link>
  );
};

export default ProductCard;

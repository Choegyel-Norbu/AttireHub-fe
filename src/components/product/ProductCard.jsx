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
  const displayImage = firstVariant?.imageUrl || product.imageUrl;
  const displayPrice = firstVariant?.price ?? product.basePrice;
  const hasDiscount = firstVariant?.discount > 0;
  const priceAfterDiscount =
    hasDiscount && typeof firstVariant.price === 'number' && typeof firstVariant.discount === 'number'
      ? firstVariant.price - firstVariant.discount
      : null;

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
      className="group relative flex h-full flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-[3/4] w-full flex-shrink-0 overflow-hidden bg-[#F0F0F0]">
        {/* Badges */}
        {(product.newArrival === true || product.new_arrival === true) && (
          <span className="absolute left-3 top-3 z-10 bg-white/90 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-primary backdrop-blur-sm">
            New
          </span>
        )}

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
              className="absolute bottom-4 left-4 right-4 hidden lg:flex gap-2"
            >
              <button
                type="button"
                disabled={!firstVariant || adding}
                onClick={handleAddToCart}
                className="flex flex-1 items-center justify-center gap-2 bg-white py-3 text-xs font-bold uppercase tracking-wider text-primary shadow-sm transition-colors hover:bg-primary hover:text-white disabled:opacity-60 disabled:cursor-not-allowed"
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

      {/* Product Info — fixed height for uniform card size; smaller on narrow cards */}
      <div className="mt-2 flex min-h-[100px] flex-col gap-0.5 sm:mt-4 sm:min-h-[132px] sm:gap-1">
        <div className="flex justify-between items-start gap-1 sm:gap-2">
          <h3 className="text-xs font-medium text-primary line-clamp-2 group-hover:underline decoration-1 underline-offset-2 flex-1 min-w-0 sm:text-sm sm:underline-offset-4 sm:decoration-primary/30">
            {product.name}
          </h3>
          <p className="text-xs font-semibold text-primary whitespace-nowrap flex-shrink-0 sm:text-sm">
            Nu {formatPrice(priceAfterDiscount ?? displayPrice)}
          </p>
        </div>

        <p className="text-[10px] text-secondary/60 line-clamp-1 min-h-[1rem] sm:text-xs sm:min-h-[1.25rem]">
          {product.categoryName || '\u00A0'}
        </p>

        {/* Mobile Add to Cart — always reserve space when variants exist for consistent height */}
        {firstVariant ? (
          <button
            type="button"
            disabled={adding}
            onClick={handleAddToCart}
            className="mt-1.5 flex w-full min-h-8 items-center justify-center gap-1.5 rounded-full border border-border bg-transparent py-1.5 text-[10px] font-bold uppercase tracking-wider text-primary transition-colors hover:bg-primary hover:text-white disabled:opacity-60 sm:mt-2 sm:py-2 sm:text-xs lg:hidden"
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

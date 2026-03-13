import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageOff, ShoppingBag, Eye } from 'lucide-react';

const ProductCard = ({ product }) => {
  const [isHovered, setIsHovered] = useState(false);

  const formatPrice = (value) => {
    if (typeof value !== 'number') return String(value ?? '');
    return Number.isInteger(value)
      ? value.toLocaleString()
      : value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <Link
      to={`/products/${encodeURIComponent(product.slug ?? product.id)}`}
      className="group relative block h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F0F0F0]">
        {/* Badges */}
        {(product.newArrival === true || product.new_arrival === true) && (
          <span className="absolute left-3 top-3 z-10 bg-white/90 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-primary backdrop-blur-sm">
            New
          </span>
        )}
        
        {/* Image */}
        {product.imageUrl ? (
          <motion.img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover object-center"
            initial={{ scale: 1 }}
            animate={{ scale: isHovered ? 1.05 : 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
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
                className="flex flex-1 items-center justify-center gap-2 bg-white py-3 text-xs font-bold uppercase tracking-wider text-primary shadow-sm transition-colors hover:bg-primary hover:text-white"
                onClick={(e) => {
                  e.preventDefault();
                  // Add to cart logic would go here
                }}
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                Add to Cart
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Product Info */}
      <div className="mt-4 flex flex-col gap-1">
        <div className="flex justify-between items-start">
          <h3 className="text-sm font-medium text-primary line-clamp-1 group-hover:underline decoration-1 underline-offset-4 decoration-primary/30">
            {product.name}
          </h3>
          <p className="text-sm font-semibold text-primary">
            Nu {formatPrice(product.basePrice)}
          </p>
        </div>
        
        {product.categoryName && (
          <p className="text-xs text-secondary/60">
            {product.categoryName}
          </p>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;

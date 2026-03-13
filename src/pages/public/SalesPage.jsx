import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/product/ProductCard';
import { getProducts } from '@/services/productService';
import {
  Tag,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowDownWideNarrow,
  Percent
} from 'lucide-react';

const PAGE_SIZE = 24;

const SORT_OPTIONS = [
  { value: '', label: 'Recommended' },
  { value: 'basePrice,asc', label: 'Price: Low to High' },
  { value: 'basePrice,desc', label: 'Price: High to Low' },
  { value: 'name,asc', label: 'Name: A–Z' },
  { value: 'name,desc', label: 'Name: Z–A' },
];

function getSalePrice(product) {
  const base = typeof product.basePrice === 'number' ? product.basePrice : 0;
  const variants = Array.isArray(product.variants) ? product.variants : [];
  let bestPrice = base;
  let discountAmount = 0;
  for (const v of variants) {
    const d = typeof v.discount === 'number' ? v.discount : 0;
    if (d > 0) {
      const p = (typeof v.price === 'number' ? v.price : base) - d;
      if (p < bestPrice) {
        bestPrice = p;
        discountAmount = d;
      }
    }
  }
  return {
    price: bestPrice,
    hasDiscount: discountAmount > 0,
    discountAmount: discountAmount > 0 ? discountAmount : undefined,
  };
}

export default function SalesPage() {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [last, setLast] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sort, setSort] = useState('');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getProducts({
        page,
        size: PAGE_SIZE,
        sort: sort.trim() || undefined,
        onSale: true,
      });
      setProducts(result.content);
      setTotalElements(result.totalElements);
      setTotalPages(result.totalPages);
      setLast(result.last);
    } catch (err) {
      setError(err?.message ?? 'Failed to load sale products.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [page, sort]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  const from = totalElements === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min((page + 1) * PAGE_SIZE, totalElements);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Section header / banner */} 
          <div className="mb-10 border-b border-border pb-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="font-serif text-3xl text-primary sm:text-4xl">Sale</h1>
                <p className="mt-2 text-sm text-secondary/80">
                  Curated markdowns on seasonal favorites and everyday essentials.
                </p>
              </div>
              <div className="flex flex-col items-start gap-2 sm:items-end">
                <p className="text-sm text-secondary">
                  Showing <span className="font-medium text-primary">{totalElements}</span> items on sale
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-secondary">Sort by:</span>
                  <div className="relative">
                    <select
                      value={sort}
                      onChange={(e) => {
                        setSort(e.target.value);
                        setPage(0);
                      }}
                      className="appearance-none rounded-md border-none bg-transparent py-1 pr-8 text-sm font-medium text-primary focus:ring-0 cursor-pointer hover:text-secondary"
                    >
                      {SORT_OPTIONS.map((opt) => (
                        <option key={opt.value || 'default'} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ArrowDownWideNarrow className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-8 rounded-lg bg-red-50 p-4 text-center text-sm text-red-600">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex h-96 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
                <Tag className="h-8 w-8 text-secondary/50" />
              </div>
              <h2 className="mt-6 font-serif text-2xl text-primary">No Active Sales</h2>
              <p className="mt-2 max-w-md text-secondary/70">
                Our sale items have been snapped up! Check back soon for new additions or explore our full collection.
              </p>
              <Link
                to="/products"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-bold uppercase tracking-wider text-white hover:bg-secondary"
              >
                View Full Collection
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
                {products.map((p) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-[210px] mx-auto w-full"
                  >
                    <ProductCard product={p} />
                  </motion.div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-16 flex items-center justify-center gap-4 border-t border-border pt-8">
                  <button
                    onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                    disabled={page === 0}
                    className="flex items-center gap-2 rounded-full px-6 py-2 text-sm font-medium text-primary transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <span className="text-sm font-medium text-secondary">
                    Page {page + 1} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((prev) => prev + 1)}
                    disabled={last}
                    className="flex items-center gap-2 rounded-full px-6 py-2 text-sm font-medium text-primary transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

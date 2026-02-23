import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getProducts } from '@/services/productService';
import {
  Tag,
  ChevronLeft,
  ChevronRight,
  ImageOff,
  Loader2,
} from 'lucide-react';

const PAGE_SIZE = 24;

const SORT_OPTIONS = [
  { value: '', label: 'Default' },
  { value: 'basePrice,asc', label: 'Price: low to high' },
  { value: 'basePrice,desc', label: 'Price: high to low' },
  { value: 'name,asc', label: 'Name: A–Z' },
  { value: 'name,desc', label: 'Name: Z–A' },
];

function formatPrice(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  return Number.isInteger(value)
    ? value.toLocaleString()
    : value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

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
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-quaternary">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 id="sale-heading" className="text-xl font-semibold text-primary sm:text-2xl">
            Sales
          </h1>
          <div
            className="sticky top-16 z-[100] -mx-4 mt-6 flex flex-col gap-4 border-b border-border bg-quaternary px-4 py-3 sm:-mx-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:-mx-8 lg:px-8"
            role="toolbar"
            aria-label="Sort and filter sale products"
          >
            <p className="text-sm text-secondary">
              {totalElements > 0
                ? `${totalElements} product${totalElements !== 1 ? 's' : ''} on sale`
                : 'No sale products right now.'}
            </p>
            <label className="flex items-center gap-2 text-sm text-primary">
              <span className="font-medium">Sort by</span>
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(0);
                }}
                className="rounded-lg border border-border bg-quaternary px-3 py-2 text-sm text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                aria-label="Sort sale products"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value || 'default'} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error && (
            <div className="mt-6 rounded-lg border border-border bg-quaternary p-4 text-sm text-primary">
              {error}
            </div>
          )}

          {loading ? (
            <div className="mt-12 flex items-center justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
              <span className="sr-only">Loading sale products…</span>
            </div>
          ) : products.length === 0 ? (
            <div className="mt-12 rounded-xl border border-border bg-quaternary py-16 text-center">
              <Tag className="mx-auto h-12 w-12 text-tertiary" aria-hidden />
              <p className="mt-4 font-medium text-primary">No sale products right now</p>
              <p className="mt-1 text-sm text-secondary">
                Check back later for new discounts, or browse our full catalog.
              </p>
              <Link
                to="/products"
                className="mt-4 inline-block rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-quaternary transition-opacity hover:opacity-90"
              >
                View all products
              </Link>
            </div>
          ) : (
            <>
              <ul
                className="mt-6 grid grid-cols-2 gap-2 sm:mt-8 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5"
                aria-label="Sale products"
              >
                {products.map((p) => {
                  const { price, hasDiscount } = getSalePrice(p);
                  const basePrice = typeof p.basePrice === 'number' ? p.basePrice : 0;
                  return (
                    <li key={p.id}>
                      <Link
                        to={`/products/${encodeURIComponent(p.slug ?? p.id)}`}
                        className="group flex flex-col overflow-hidden rounded-lg bg-quaternary transition-all duration-200 ease-out hover:-translate-y-1 hover:bg-tertiary/10 hover:shadow-md"
                      >
                        <div className="relative p-2 pb-0 sm:p-3 sm:pb-0">
                          <span
                            className="absolute left-2 top-2 z-10 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white shadow-sm sm:left-4 sm:top-4 sm:px-2.5 sm:py-1 sm:text-[10px]"
                            style={{ backgroundColor: '#80B5AE' }}
                          >
                            Sale
                          </span>
                          <div className="aspect-[3/4] w-full overflow-hidden rounded-lg bg-tertiary/20 sm:aspect-[4/5]">
                            {p.imageUrl ? (
                              <img
                                src={p.imageUrl}
                                alt=""
                                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-tertiary">
                                <ImageOff className="h-6 w-6 sm:h-10 sm:w-10" aria-hidden />
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-1 flex-col p-2 sm:p-3">
                          <h2 className="line-clamp-2 text-xs font-semibold text-primary group-hover:text-secondary sm:text-sm">
                            {p.name}
                          </h2>
                          {p.categoryName && (
                            <p className="mt-0.5 text-[10px] text-secondary sm:text-xs">{p.categoryName}</p>
                          )}
                          <div className="mt-1 flex flex-wrap items-baseline gap-2 sm:mt-1.5">
                            {hasDiscount && basePrice > price && (
                              <span className="text-xs text-tertiary line-through">
                                Nu {formatPrice(basePrice)} /-
                              </span>
                            )}
                            <p className="text-sm font-semibold text-primary sm:text-base" style={{ color: '#5d3543' }}>
                              Nu {formatPrice(price)} /-
                            </p>
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {totalPages > 1 && (
                <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-8">
                  <p className="text-sm text-secondary">
                    Showing {from}–{to} of {totalElements}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                      disabled={page === 0}
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-quaternary px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-tertiary/20 disabled:opacity-50 disabled:hover:bg-transparent"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" aria-hidden />
                      Previous
                    </button>
                    <span className="px-3 text-sm text-secondary">
                      Page {page + 1} of {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPage((prev) => prev + 1)}
                      disabled={last}
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-quaternary px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-tertiary/20 disabled:opacity-50 disabled:hover:bg-transparent"
                      aria-label="Next page"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
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

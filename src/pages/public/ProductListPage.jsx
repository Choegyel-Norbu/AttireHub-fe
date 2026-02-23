import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getProducts } from '@/services/productService';
import { getCategories, flattenCategoriesWithSlug } from '@/services/categoryService';
import {
  Package,
  ChevronLeft,
  ChevronRight,
  ImageOff,
  Loader2,
  Filter,
  Search,
  X,
} from 'lucide-react';

const PAGE_SIZE = 24;

const SORT_OPTIONS = [
  { value: '', label: 'Default' },
  { value: 'basePrice,asc', label: 'Price: low to high' },
  { value: 'basePrice,desc', label: 'Price: high to low' },
  { value: 'name,asc', label: 'Name: A–Z' },
  { value: 'name,desc', label: 'Name: Z–A' },
];

function getFiltersFromSearchParams(searchParams) {
  return {
    search: searchParams.get('search') ?? '',
    category: searchParams.get('category') ?? '',
    sort: searchParams.get('sort') ?? '',
    minPrice: searchParams.get('minPrice') ?? '',
    maxPrice: searchParams.get('maxPrice') ?? '',
  };
}

export default function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [last, setLast] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const initialFromUrl = getFiltersFromSearchParams(searchParams);
  const [filters, setFilters] = useState(initialFromUrl);
  const [appliedFilters, setAppliedFilters] = useState(initialFromUrl);

  useEffect(() => {
    const fromUrl = getFiltersFromSearchParams(searchParams);
    setFilters(fromUrl);
    setAppliedFilters(fromUrl);
    setPage(0);
  }, [searchParams]);

  // Scroll to top when opening or when params change so content is visible (fixes mobile showing footer)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [searchParams]);

  useEffect(() => {
    getCategories()
      .then((tree) => setCategories(flattenCategoriesWithSlug(Array.isArray(tree) ? tree : [])))
      .catch(() => setCategories([]));
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const newArrivalsOnly = searchParams.get('newArrivalsOnly') === 'true';
      const trending = searchParams.get('trending') === 'true';
      const params = {
        page,
        size: PAGE_SIZE,
        search: appliedFilters.search.trim() || undefined,
        category: appliedFilters.category || undefined,
        sort: appliedFilters.sort || undefined,
        minPrice: appliedFilters.minPrice === '' ? undefined : Number(appliedFilters.minPrice),
        maxPrice: appliedFilters.maxPrice === '' ? undefined : Number(appliedFilters.maxPrice),
        newArrivalsOnly: newArrivalsOnly || undefined,
        trending: trending || undefined,
      };
      const result = await getProducts(params);
      setProducts(result.content);
      setTotalElements(result.totalElements);
      setTotalPages(result.totalPages);
      setLast(result.last);
    } catch (err) {
      setError(err?.message ?? 'Failed to load products.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [page, appliedFilters, searchParams]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const applyFilters = () => {
    setAppliedFilters(filters);
    setPage(0);
    setFiltersOpen(false);
    const params = new URLSearchParams();
    if (filters.search.trim()) params.set('search', filters.search.trim());
    if (filters.category) params.set('category', filters.category);
    if (filters.sort) params.set('sort', filters.sort);
    if (filters.minPrice !== '') params.set('minPrice', filters.minPrice);
    if (filters.maxPrice !== '') params.set('maxPrice', filters.maxPrice);
    if (searchParams.get('newArrivalsOnly') === 'true') params.set('newArrivalsOnly', 'true');
    if (searchParams.get('trending') === 'true') params.set('trending', 'true');
    setSearchParams(params, { replace: true });
  };

  const clearFilters = () => {
    const empty = { search: '', category: '', sort: '', minPrice: '', maxPrice: '' };
    setFilters(empty);
    setAppliedFilters(empty);
    setPage(0);
    setFiltersOpen(false);
    setSearchParams({}, { replace: true });
  };

  const hasActiveFilters =
    appliedFilters.search ||
    appliedFilters.category ||
    appliedFilters.sort ||
    appliedFilters.minPrice !== '' ||
    appliedFilters.maxPrice !== '';

  const from = totalElements === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min((page + 1) * PAGE_SIZE, totalElements);

  const filterForm = (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tertiary" aria-hidden />
        <input
          type="search"
          placeholder="Search products..."
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
          className="w-full rounded-xl border border-border bg-quaternary py-2.5 pl-10 pr-3 text-sm text-primary placeholder-tertiary focus:border-[#80B5AE] focus:outline-none focus:ring-2 focus:ring-[#80B5AE]/20"
          aria-label="Search products"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="filter-category" className="mb-1 block text-xs font-medium text-secondary">
            Category
          </label>
          <select
            id="filter-category"
            value={filters.category}
            onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
            className="w-full rounded-xl border border-border bg-quaternary px-3 py-2.5 text-sm text-primary focus:border-[#80B5AE] focus:outline-none focus:ring-2 focus:ring-[#80B5AE]/20"
            aria-label="Category"
          >
            <option value="">All categories</option>
            {categories
              .filter((c) => c.slug)
              .map((c) => (
                <option key={c.id} value={c.slug}>
                  {'—'.repeat(c.depth)} {c.name}
                </option>
              ))}
          </select>
        </div>
        <div>
          <label htmlFor="filter-sort" className="mb-1 block text-xs font-medium text-secondary">
            Sort by
          </label>
          <select
            id="filter-sort"
            value={filters.sort}
            onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}
            className="w-full rounded-xl border border-border bg-quaternary px-3 py-2.5 text-sm text-primary focus:border-[#80B5AE] focus:outline-none focus:ring-2 focus:ring-[#80B5AE]/20"
            aria-label="Sort by"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value || 'default'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="filter-min" className="mb-1 block text-xs font-medium text-secondary">
            Min price
          </label>
          <input
            id="filter-min"
            type="number"
            min="0"
            step="1"
            placeholder="0"
            value={filters.minPrice}
            onChange={(e) => setFilters((f) => ({ ...f, minPrice: e.target.value }))}
            className="w-full rounded-xl border border-border bg-quaternary px-3 py-2.5 text-sm text-primary placeholder-tertiary focus:border-[#80B5AE] focus:outline-none focus:ring-2 focus:ring-[#80B5AE]/20"
            aria-label="Minimum price"
          />
        </div>
        <div>
          <label htmlFor="filter-max" className="mb-1 block text-xs font-medium text-secondary">
            Max price
          </label>
          <input
            id="filter-max"
            type="number"
            min="0"
            step="1"
            placeholder="Any"
            value={filters.maxPrice}
            onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value }))}
            className="w-full rounded-xl border border-border bg-quaternary px-3 py-2.5 text-sm text-primary placeholder-tertiary focus:border-[#80B5AE] focus:outline-none focus:ring-2 focus:ring-[#80B5AE]/20"
            aria-label="Maximum price"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          onClick={applyFilters}
          className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 sm:flex-none"
          style={{ backgroundColor: '#80B5AE' }}
        >
          Apply filters
        </button>
        <button
          type="button"
          onClick={clearFilters}
          className="rounded-xl border border-border bg-quaternary px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-tertiary/15"
        >
          Clear
        </button>
      </div>
    </div>
  );

  const pageTitle = searchParams.get('newArrivalsOnly') === 'true' ? 'New arrivals' : 'All products';

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-quaternary px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Page header */}
          <header className="flex flex-wrap items-end justify-between gap-4 pb-2">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
                {pageTitle}
              </h1>
              <div className="mt-2 flex items-center gap-3">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {totalElements > 0
                    ? `${totalElements} product${totalElements !== 1 ? 's' : ''}`
                    : searchParams.get('newArrivalsOnly') === 'true'
                      ? 'No new arrivals'
                      : 'Browse catalog'}
                </span>
              </div>
            </div>
          </header>

          {/* Sticky filters */}
          <div
            className="sticky top-16 z-[100] -mx-4 mt-6 bg-quaternary/95 px-4 py-3 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
            role="toolbar"
            aria-label="Filter and sort products"
          >
            <div className="md:hidden">
              <button
                type="button"
                onClick={() => setFiltersOpen((o) => !o)}
                className="flex w-full items-center justify-between rounded-xl border border-border bg-quaternary px-4 py-3.5 text-sm font-medium text-primary transition-colors hover:border-tertiary hover:bg-tertiary/10"
                aria-expanded={filtersOpen}
                aria-controls="mobile-filters"
              >
                <span className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-secondary" aria-hidden />
                  Filters
                  {hasActiveFilters && (
                    <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white" style={{ backgroundColor: '#80B5AE' }}>
                      Active
                    </span>
                  )}
                </span>
                <ChevronRight className={`h-5 w-5 text-tertiary transition-transform ${filtersOpen ? 'rotate-90' : ''}`} aria-hidden />
              </button>
              <div
                id="mobile-filters"
                className={`overflow-hidden transition-all duration-200 ${
                  filtersOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                }`}
                aria-hidden={!filtersOpen}
              >
                <div className="mt-3 rounded-xl border border-border bg-quaternary p-4">
                  {filterForm}
                </div>
              </div>
            </div>

            <div className="hidden md:flex md:flex-wrap md:items-center md:gap-3">
              <div className="relative min-w-0 flex-1 basis-56">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-tertiary" aria-hidden />
                <input
                  type="search"
                  placeholder="Search products..."
                  value={filters.search}
                  onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                  className="w-full rounded-xl border border-border bg-quaternary py-2.5 pl-10 pr-4 text-sm text-primary placeholder-tertiary transition-colors focus:border-[#80B5AE] focus:outline-none focus:ring-2 focus:ring-[#80B5AE]/20"
                  aria-label="Search products"
                />
              </div>
              <select
                value={filters.category}
                onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
                className="rounded-xl border border-border bg-quaternary px-4 py-2.5 text-sm text-primary transition-colors focus:border-[#80B5AE] focus:outline-none focus:ring-2 focus:ring-[#80B5AE]/20"
                aria-label="Category"
              >
                <option value="">All categories</option>
                {categories
                  .filter((c) => c.slug)
                  .map((c) => (
                    <option key={c.id} value={c.slug}>
                      {c.depth > 0 ? '— ' : ''}{c.name}
                    </option>
                  ))}
              </select>
              <select
                value={filters.sort}
                onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}
                className="rounded-xl border border-border bg-quaternary px-4 py-2.5 text-sm text-primary transition-colors focus:border-[#80B5AE] focus:outline-none focus:ring-2 focus:ring-[#80B5AE]/20"
                aria-label="Sort by"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value || 'default'} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-1.5 rounded-xl border border-border bg-quaternary px-2 py-1">
                <input
                  type="number"
                  min="0"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(e) => setFilters((f) => ({ ...f, minPrice: e.target.value }))}
                  className="w-20 rounded-lg border-0 bg-transparent px-2 py-1.5 text-sm text-primary placeholder-tertiary focus:outline-none"
                  aria-label="Min price"
                />
                <span className="text-tertiary">–</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value }))}
                  className="w-20 rounded-lg border-0 bg-transparent px-2 py-1.5 text-sm text-primary placeholder-tertiary focus:outline-none"
                  aria-label="Max price"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={applyFilters}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#80B5AE' }}
                >
                  Apply
                </button>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="flex items-center gap-1.5 rounded-xl border border-border bg-quaternary px-3 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-tertiary/15"
                    aria-label="Clear filters"
                  >
                    <X className="h-4 w-4" aria-hidden />
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-primary">
              {error}
            </div>
          )}

          {loading ? (
            <div className="mt-10 flex flex-col items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-[#80B5AE]" aria-hidden />
              <span className="mt-3 text-sm text-secondary">Loading products…</span>
            </div>
          ) : products.length === 0 ? (
            <div className="mt-10 flex flex-col items-center rounded-2xl border border-border bg-quaternary/50 py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-tertiary/20">
                <Package className="h-8 w-8 text-tertiary" aria-hidden />
              </div>
              <p className="mt-6 text-lg font-semibold text-primary">No products found</p>
              <p className="mt-1 max-w-sm text-sm text-secondary">
                Try adjusting your filters or browse all categories.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-6 rounded-xl border border-border bg-quaternary px-5 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-tertiary/15"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                {products.map((p) => (
                  <li key={p.id}>
                    <Link
                      to={`/products/${encodeURIComponent(p.slug ?? p.id)}`}
                      className="group flex flex-col overflow-hidden rounded-2xl bg-quaternary transition-all duration-200 ease-out hover:shadow-lg hover:shadow-primary/5"
                    >
                      <div className="relative aspect-[3/4] w-full overflow-hidden bg-tertiary/10 sm:aspect-[4/5]">
                        {p.imageUrl ? (
                          <img
                            src={p.imageUrl}
                            alt=""
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-tertiary">
                            <ImageOff className="h-10 w-10 sm:h-12 sm:w-12" aria-hidden />
                          </div>
                        )}
                        {(p.newArrival === true || p.new_arrival === true) && (
                          <span
                            className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white"
                            style={{ backgroundColor: '#80B5AE' }}
                          >
                            New
                          </span>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col p-4">
                        <h2 className="line-clamp-2 text-sm font-semibold text-primary group-hover:text-secondary">
                          {p.name}
                        </h2>
                        {p.categoryName && (
                          <p className="mt-1 text-xs text-secondary">{p.categoryName}</p>
                        )}
                        <p className="mt-2 text-base font-semibold text-primary" style={{ color: '#5d3543' }}>
                          Nu {typeof p.basePrice === 'number'
                            ? Number.isInteger(p.basePrice)
                              ? p.basePrice.toLocaleString()
                              : p.basePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            : p.basePrice}{' '}
                          /-
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>

              {totalPages > 1 && (
                <nav className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-8" aria-label="Pagination">
                  <p className="text-sm text-secondary">
                    <span className="font-medium text-primary">{from}–{to}</span>
                    <span className="ml-1">of {totalElements}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                      disabled={page === 0}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-quaternary px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-tertiary/15 disabled:pointer-events-none disabled:opacity-50"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4" aria-hidden />
                      Previous
                    </button>
                    <span className="min-w-[6rem] text-center text-sm text-secondary">
                      Page {page + 1} of {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPage((prev) => prev + 1)}
                      disabled={last}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-quaternary px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-tertiary/15 disabled:pointer-events-none disabled:opacity-50"
                      aria-label="Next page"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </nav>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

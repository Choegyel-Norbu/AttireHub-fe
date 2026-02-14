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
      const params = {
        page,
        size: PAGE_SIZE,
        search: appliedFilters.search.trim() || undefined,
        category: appliedFilters.category || undefined,
        sort: appliedFilters.sort || undefined,
        minPrice: appliedFilters.minPrice === '' ? undefined : Number(appliedFilters.minPrice),
        maxPrice: appliedFilters.maxPrice === '' ? undefined : Number(appliedFilters.maxPrice),
        newArrivalsOnly: newArrivalsOnly || undefined,
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
          className="w-full rounded-lg bg-quaternary py-2.5 pl-10 pr-3 text-sm text-primary placeholder-tertiary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
            className="w-full rounded-lg bg-quaternary px-3 py-2.5 text-sm text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
            className="w-full rounded-lg bg-quaternary px-3 py-2.5 text-sm text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
            className="w-full rounded-lg bg-quaternary px-3 py-2.5 text-sm text-primary placeholder-tertiary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
            className="w-full rounded-lg bg-quaternary px-3 py-2.5 text-sm text-primary placeholder-tertiary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            aria-label="Maximum price"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          onClick={applyFilters}
          className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-quaternary transition-opacity hover:opacity-90 sm:flex-none"
        >
          Apply filters
        </button>
        <button
          type="button"
          onClick={clearFilters}
          className="rounded-lg bg-quaternary px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-tertiary/20"
        >
          Clear
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-quaternary px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-2 text-secondary">
            <Package className="h-6 w-6" aria-hidden />
            <h1 className="text-2xl font-semibold text-primary sm:text-3xl">
              {searchParams.get('newArrivalsOnly') === 'true' ? 'New arrivals' : 'All products'}
            </h1>
          </div>
          <p className="mt-1 text-sm text-secondary">
            {totalElements > 0
              ? `${totalElements} product${totalElements !== 1 ? 's' : ''} found`
              : searchParams.get('newArrivalsOnly') === 'true'
                ? 'No new arrivals right now.'
                : 'Browse our catalog.'}
          </p>

          {/* Filters: mobile = collapsible panel, desktop = inline bar */}
          <div className="mt-6">
            {/* Mobile: Filters toggle + collapsible panel */}
            <div className="md:hidden">
              <button
                type="button"
                onClick={() => setFiltersOpen((o) => !o)}
                className="flex w-full items-center justify-between rounded-lg bg-quaternary px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-tertiary/20"
                aria-expanded={filtersOpen}
                aria-controls="mobile-filters"
              >
                <span className="flex items-center gap-2">
                  <Filter className="h-4 w-4" aria-hidden />
                  Filters
                  {hasActiveFilters && (
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
                      On
                    </span>
                  )}
                </span>
                <span
                  className={`inline-block transition-transform ${filtersOpen ? 'rotate-180' : ''}`}
                  aria-hidden
                >
                  <ChevronRight className="h-4 w-4" />
                </span>
              </button>
              <div
                id="mobile-filters"
                className={`overflow-hidden transition-all duration-200 ${
                  filtersOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                }`}
                aria-hidden={!filtersOpen}
              >
                <div className="mt-3 rounded-lg bg-quaternary p-4">
                  {filterForm}
                </div>
              </div>
            </div>

            {/* Desktop: inline filter bar */}
            <div className="hidden md:block">
              <div className="flex flex-wrap items-end gap-3 rounded-lg bg-quaternary p-4">
                <div className="relative min-w-0 flex-1 basis-48">
                  <Search
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tertiary"
                    aria-hidden
                  />
                  <input
                    type="search"
                    placeholder="Search..."
                    value={filters.search}
                    onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                    className="w-full rounded-lg bg-quaternary py-2 pl-9 pr-3 text-sm text-primary placeholder-tertiary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    aria-label="Search products"
                  />
                </div>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
                  className="rounded-lg bg-quaternary px-3 py-2 text-sm text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
                  className="rounded-lg bg-quaternary px-3 py-2 text-sm text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  aria-label="Sort by"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value || 'default'} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(e) => setFilters((f) => ({ ...f, minPrice: e.target.value }))}
                  className="w-24 rounded-lg bg-quaternary px-3 py-2 text-sm text-primary placeholder-tertiary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  aria-label="Min price"
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value }))}
                  className="w-24 rounded-lg bg-quaternary px-3 py-2 text-sm text-primary placeholder-tertiary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  aria-label="Max price"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={applyFilters}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-quaternary transition-opacity hover:opacity-90"
                  >
                    Apply
                  </button>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="flex items-center gap-1 rounded-lg bg-quaternary px-3 py-2 text-sm text-primary hover:bg-tertiary/20"
                      aria-label="Clear filters"
                    >
                      <X className="h-4 w-4" aria-hidden />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-6 rounded-lg border border-tertiary bg-quaternary p-4 text-sm text-primary">
              {error}
            </div>
          )}

          {loading ? (
            <div className="mt-12 flex items-center justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
              <span className="sr-only">Loading products…</span>
            </div>
          ) : products.length === 0 ? (
            <div className="mt-12 rounded-xl border border-tertiary bg-quaternary py-16 text-center">
              <Package className="mx-auto h-12 w-12 text-tertiary" aria-hidden />
              <p className="mt-4 font-medium text-primary">No products found</p>
              <p className="mt-1 text-sm text-secondary">
                Try adjusting your filters or browse all categories.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 text-sm font-medium text-primary underline hover:no-underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <ul className="mt-6 grid grid-cols-2 gap-2 sm:mt-8 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                {products.map((p) => (
                  <li key={p.id}>
                    <Link
                      to={`/products/${encodeURIComponent(p.slug ?? p.id)}`}
                      className="group flex flex-col overflow-hidden rounded-lg bg-quaternary transition-all duration-200 ease-out hover:-translate-y-1 hover:bg-tertiary/10 hover:shadow-md"
                    >
                      <div className="relative p-2 pb-0 sm:p-3 sm:pb-0">
                        {(p.newArrival === true || p.new_arrival === true) && (
                          <span className="absolute left-2 top-2 z-10 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-quaternary shadow-sm sm:left-4 sm:top-4 sm:px-2.5 sm:py-1 sm:text-xs">
                            New arrival
                          </span>
                        )}
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
                        <p className="mt-1 text-sm font-semibold text-primary sm:mt-1.5 sm:text-base">
                          Nu{' '}
                          {typeof p.basePrice === 'number'
                            ? Number.isInteger(p.basePrice)
                              ? p.basePrice.toLocaleString()
                              : p.basePrice.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })
                            : p.basePrice}{' '}
                          /-
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>

              {totalPages > 1 && (
                <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-tertiary pt-8">
                  <p className="text-sm text-secondary">
                    Showing {from}–{to} of {totalElements}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                      disabled={page === 0}
                      className="inline-flex items-center gap-1 rounded-lg border border-tertiary bg-quaternary px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-tertiary/20 disabled:opacity-50 disabled:hover:bg-transparent"
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
                      className="inline-flex items-center gap-1 rounded-lg border border-tertiary bg-quaternary px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-tertiary/20 disabled:opacity-50 disabled:hover:bg-transparent"
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

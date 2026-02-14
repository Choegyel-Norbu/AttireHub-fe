import { useState, useEffect, useCallback, Fragment } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Package,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ImageOff,
  ChevronDown,
  ChevronUp,
  Layers,
  Pencil,
} from 'lucide-react';
import { getProducts } from '@/services/productService';
import { getCategories, flattenCategoriesWithSlug } from '@/services/categoryService';
import { updateVariant } from '@/services/adminProductService';

const PAGE_SIZE_OPTIONS = [10, 20, 50];
const SORT_OPTIONS = [
  { value: '', label: 'Default' },
  { value: 'basePrice,asc', label: 'Price (low to high)' },
  { value: 'basePrice,desc', label: 'Price (high to low)' },
  { value: 'name,asc', label: 'Name (A–Z)' },
  { value: 'name,desc', label: 'Name (Z–A)' },
];

export default function ProductManagementPage() {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [last, setLast] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [editVariant, setEditVariant] = useState(null);
  const [variantForm, setVariantForm] = useState(null);
  const [variantSubmitError, setVariantSubmitError] = useState(null);
  const [variantSaving, setVariantSaving] = useState(false);

  const openEditVariant = (productId, productName, variant) => {
    setEditVariant({ productId, productName, variant });
    setVariantForm({
      sku: variant.sku ?? '',
      size: variant.size ?? '',
      color: variant.color ?? '',
      price: typeof variant.price === 'number' ? variant.price : '',
      stockQuantity: variant.stockQuantity ?? 0,
      imageUrl: variant.imageUrl ?? '',
      isActive: variant.isActive !== false && variant.active !== false,
    });
    setVariantSubmitError(null);
  };

  const closeEditVariant = () => {
    setEditVariant(null);
    setVariantForm(null);
    setVariantSubmitError(null);
  };

  const handleVariantSubmit = async (e) => {
    e.preventDefault();
    if (!editVariant || !variantForm) return;
    setVariantSubmitError(null);
    setVariantSaving(true);
    try {
      await updateVariant(editVariant.productId, editVariant.variant.id, {
        sku: variantForm.sku?.trim() || undefined,
        size: variantForm.size?.trim() || undefined,
        color: variantForm.color?.trim() || undefined,
        price: variantForm.price !== '' ? Number(variantForm.price) : undefined,
        stockQuantity: variantForm.stockQuantity != null ? Number(variantForm.stockQuantity) : undefined,
        imageUrl: variantForm.imageUrl?.trim() || null,
        isActive: variantForm.isActive,
      });
      closeEditVariant();
      fetchProducts();
    } catch (err) {
      setVariantSubmitError(err?.message ?? 'Failed to update variant.');
    } finally {
      setVariantSaving(false);
    }
  };

  const [filters, setFilters] = useState({
    search: '',
    category: '',
    sort: '',
    minPrice: '',
    maxPrice: '',
    featured: '',
  });
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    category: '',
    sort: '',
    minPrice: '',
    maxPrice: '',
    featured: '',
  });

  const fetchCategories = useCallback(async () => {
    try {
      const tree = await getCategories();
      setCategories(flattenCategoriesWithSlug(tree));
    } catch {
      setCategories([]);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        size,
        sort: appliedFilters.sort || undefined,
        category: appliedFilters.category || undefined,
        search: appliedFilters.search.trim() || undefined,
        minPrice: appliedFilters.minPrice === '' ? undefined : Number(appliedFilters.minPrice),
        maxPrice: appliedFilters.maxPrice === '' ? undefined : Number(appliedFilters.maxPrice),
        featured:
          appliedFilters.featured === ''
            ? undefined
            : appliedFilters.featured === 'true',
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
  }, [page, size, appliedFilters]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (!editVariant) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeEditVariant();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [editVariant]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setAppliedFilters(filters);
    setPage(0);
  };

  const from = totalElements === 0 ? 0 : page * size + 1;
  const to = Math.min((page + 1) * size, totalElements);

  return (
    <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-lg font-bold text-primary">
                <Package className="h-6 w-6" aria-hidden />
                Product management
              </h1>
              <p className="mt-1 text-sm text-secondary">
                View and manage your product catalog.
              </p>
            </div>
            <Link
              to="/admin/products/new"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-quaternary transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Add product
            </Link>
          </div>

          {/* Filters */}
          <section className="mt-8 rounded-xl border border-tertiary bg-quaternary p-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tertiary" aria-hidden />
                <input
                  type="search"
                  placeholder="Search products..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                  className="w-full rounded-lg border border-tertiary bg-quaternary py-2 pl-9 pr-3 text-sm text-primary placeholder-tertiary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  aria-label="Search products"
                />
              </div>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="rounded-lg border border-tertiary bg-quaternary px-3 py-2 text-sm text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                aria-label="Filter by category"
              >
                <option value="">All categories</option>
                {categories
                  .filter((c) => c.slug)
                  .map((c) => (
                    <option key={c.id} value={c.slug}>
                      {'—'.repeat(c.depth)}{' '}{c.name}
                    </option>
                  ))}
              </select>
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="rounded-lg border border-tertiary bg-quaternary px-3 py-2 text-sm text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                aria-label="Sort by"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value || 'default'} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <select
                value={filters.featured}
                onChange={(e) => handleFilterChange('featured', e.target.value)}
                className="rounded-lg border border-tertiary bg-quaternary px-3 py-2 text-sm text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                aria-label="Featured"
              >
                <option value="">All</option>
                <option value="true">Featured only</option>
                <option value="false">Not featured</option>
              </select>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Min price"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                className="w-28 rounded-lg border border-tertiary bg-quaternary px-3 py-2 text-sm text-primary placeholder-tertiary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                aria-label="Minimum price"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Max price"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                className="w-28 rounded-lg border border-tertiary bg-quaternary px-3 py-2 text-sm text-primary placeholder-tertiary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                aria-label="Maximum price"
              />
              <button
                type="button"
                onClick={applyFilters}
                className="rounded-lg border border-tertiary bg-tertiary/20 px-4 py-2 text-sm font-medium text-primary hover:bg-tertiary/30"
              >
                Apply filters
              </button>
            </div>
          </section>

          {error && (
            <div className="mt-6 rounded-lg border border-tertiary bg-quaternary p-4 text-sm text-primary">
              {error}
            </div>
          )}

          {loading ? (
            <div className="mt-8 flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
              <span className="sr-only">Loading products…</span>
            </div>
          ) : (
            <>
              <div className="mt-6 overflow-x-auto rounded-xl border border-tertiary bg-quaternary">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-tertiary bg-tertiary/10">
                      <th className="w-10 py-3 pl-4 pr-1 font-medium text-secondary" aria-label="Expand" />
                      <th className="py-3 pr-2 font-medium text-secondary">Product</th>
                      <th className="py-3 px-2 font-medium text-secondary">Slug</th>
                      <th className="py-3 px-2 font-medium text-secondary">Price</th>
                      <th className="py-3 px-2 font-medium text-secondary">Category</th>
                      <th className="py-3 px-2 font-medium text-secondary">Brand</th>
                      <th className="py-3 px-2 font-medium text-secondary">Variants</th>
                      <th className="py-3 px-2 font-medium text-secondary">Featured</th>
                      <th className="py-3 pl-2 pr-4 font-medium text-secondary">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-secondary">
                          No products found.
                        </td>
                      </tr>
                    ) : (
                      products.map((p) => {
                        const variants = Array.isArray(p.variants) ? p.variants : [];
                        const isExpanded = expandedId === p.id;
                        return (
                          <Fragment key={p.id}>
                            <tr className="border-b border-tertiary/50 transition-colors hover:bg-tertiary/10">
                              <td className="w-10 py-3 pl-4 pr-1">
                                {variants.length > 0 ? (
                                  <button
                                    type="button"
                                    onClick={() => setExpandedId(isExpanded ? null : p.id)}
                                    className="rounded p-1.5 text-primary hover:bg-tertiary/20"
                                    aria-expanded={isExpanded}
                                    aria-label={isExpanded ? 'Collapse variants' : 'Expand variants'}
                                  >
                                    {isExpanded ? (
                                      <ChevronUp className="h-4 w-4" aria-hidden />
                                    ) : (
                                      <ChevronDown className="h-4 w-4" aria-hidden />
                                    )}
                                  </button>
                                ) : (
                                  <span className="inline-block w-7" aria-hidden />
                                )}
                              </td>
                              <td className="py-3 pr-2">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-tertiary bg-quaternary">
                                    {p.imageUrl ? (
                                      <img
                                        src={p.imageUrl}
                                        alt=""
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <ImageOff className="h-5 w-5 text-tertiary" aria-hidden />
                                    )}
                                  </div>
                                  <span className="font-medium text-primary">{p.name}</span>
                                </div>
                              </td>
                              <td className="py-3 px-2 font-mono text-secondary">{p.slug ?? '—'}</td>
                              <td className="py-3 px-2 text-primary">
                                {typeof p.basePrice === 'number'
                                  ? p.basePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })
                                  : p.basePrice ?? '—'}
                              </td>
                              <td className="py-3 px-2 text-primary">{p.categoryName ?? p.categorySlug ?? '—'}</td>
                              <td className="py-3 px-2 text-primary">{p.brand ?? '—'}</td>
                              <td className="py-3 px-2">
                                {variants.length > 0 ? (
                                  <span className="inline-flex items-center gap-1.5 text-primary">
                                    <Layers className="h-4 w-4 text-tertiary" aria-hidden />
                                    {variants.length} variant{variants.length !== 1 ? 's' : ''}
                                  </span>
                                ) : (
                                  <span className="text-tertiary">—</span>
                                )}
                              </td>
                              <td className="py-3 px-2">
                                {p.isFeatured === true ? (
                                  <span className="rounded bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                                    Yes
                                  </span>
                                ) : (
                                  <span className="text-tertiary">No</span>
                                )}
                              </td>
                              <td className="py-3 pl-2 pr-4">
                                <Link
                                  to={`/admin/products/edit/${encodeURIComponent(p.slug ?? '')}`}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-tertiary bg-quaternary px-2.5 py-1.5 text-sm font-medium text-primary hover:bg-tertiary/20"
                                  aria-label={`Edit ${p.name}`}
                                >
                                  <Pencil className="h-4 w-4" aria-hidden />
                                  Edit
                                </Link>
                              </td>
                            </tr>
                            {isExpanded && variants.length > 0 && (
                              <tr className="border-b border-tertiary/50 bg-tertiary/5">
                                <td colSpan={9} className="p-0">
                                  <div className="px-4 pb-4 pt-1">
                                    <div className="overflow-x-auto rounded-lg border border-tertiary/50 bg-quaternary">
                                      <table className="w-full text-left text-sm">
                                        <thead>
                                          <tr className="border-b border-tertiary/50 bg-tertiary/10">
                                            <th className="py-2 pl-3 pr-2 font-medium text-secondary">SKU</th>
                                            <th className="py-2 px-2 font-medium text-secondary">Size</th>
                                            <th className="py-2 px-2 font-medium text-secondary">Color</th>
                                            <th className="py-2 px-2 font-medium text-secondary">Price</th>
                                            <th className="py-2 px-2 font-medium text-secondary">Stock</th>
                                            <th className="py-2 px-2 font-medium text-secondary">Active</th>
                                            <th className="py-2 pl-2 pr-3 font-medium text-secondary">Actions</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {variants.map((v) => (
                                            <tr key={v.id} className="border-b border-tertiary/30 last:border-0">
                                              <td className="py-2 pl-3 pr-2 font-mono text-primary">{v.sku ?? '—'}</td>
                                              <td className="py-2 px-2 text-primary">{v.size ?? '—'}</td>
                                              <td className="py-2 px-2 text-primary">{v.color ?? '—'}</td>
                                              <td className="py-2 px-2 text-primary">
                                                {typeof v.price === 'number'
                                                  ? v.price.toLocaleString(undefined, { minimumFractionDigits: 2 })
                                                  : v.price ?? '—'}
                                              </td>
                                              <td className="py-2 px-2 text-primary">{v.stockQuantity ?? 0}</td>
                                              <td className="py-2 px-2">
                                                {v.isActive === true || v.active === true ? (
                                                  <span className="text-primary">Yes</span>
                                                ) : (
                                                  <span className="text-tertiary">No</span>
                                                )}
                                              </td>
                                              <td className="py-2 pl-2 pr-3">
                                                <button
                                                  type="button"
                                                  onClick={() => openEditVariant(p.id, p.name, v)}
                                                  className="inline-flex items-center gap-1 rounded border border-tertiary bg-quaternary px-2 py-1 text-sm font-medium text-primary hover:bg-tertiary/20"
                                                  aria-label={`Edit variant ${v.sku ?? v.size}`}
                                                >
                                                  <Pencil className="h-3.5 w-3.5" aria-hidden />
                                                  Edit
                                                </button>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {(totalPages > 1 || totalElements > size) && (
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                  <p className="text-sm text-secondary">
                    Showing {from}–{to} of {totalElements}
                  </p>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-primary">
                      <span>Per page</span>
                      <select
                        value={size}
                        onChange={(e) => {
                          setSize(Number(e.target.value));
                          setPage(0);
                        }}
                        className="rounded border border-tertiary bg-quaternary px-2 py-1 text-sm focus:border-primary focus:outline-none"
                        aria-label="Items per page"
                      >
                        {PAGE_SIZE_OPTIONS.map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                        disabled={page === 0}
                        className="rounded p-2 text-primary hover:bg-tertiary/20 disabled:opacity-50 disabled:hover:bg-transparent"
                        aria-label="Previous page"
                      >
                        <ChevronLeft className="h-5 w-5" aria-hidden />
                      </button>
                      <span className="px-2 text-sm text-secondary">
                        Page {page + 1} of {totalPages || 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPage((prev) => prev + 1)}
                        disabled={last}
                        className="rounded p-2 text-primary hover:bg-tertiary/20 disabled:opacity-50 disabled:hover:bg-transparent"
                        aria-label="Next page"
                      >
                        <ChevronRight className="h-5 w-5" aria-hidden />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Edit Variant modal */}
          {editVariant && variantForm && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="edit-variant-title"
            >
              <button
                type="button"
                className="absolute inset-0 bg-quaternary/60"
                onClick={closeEditVariant}
                aria-label="Close modal"
              />
              <div className="relative w-full max-w-md rounded-xl border border-tertiary bg-quaternary p-6 shadow-lg">
                <h2 id="edit-variant-title" className="text-lg font-semibold text-primary">
                  Edit variant — {editVariant.productName}
                </h2>
                {variantSubmitError && (
                  <p className="mt-3 text-sm text-primary">{variantSubmitError}</p>
                )}
                <form onSubmit={handleVariantSubmit} className="mt-4 space-y-4">
                  <div>
                    <label htmlFor="variant-sku" className="block text-xs font-medium text-secondary">
                      SKU
                    </label>
                    <input
                      id="variant-sku"
                      type="text"
                      value={variantForm.sku}
                      onChange={(e) => setVariantForm((f) => ({ ...f, sku: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-tertiary bg-quaternary px-3 py-2 text-sm text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="variant-size" className="block text-xs font-medium text-secondary">
                        Size
                      </label>
                      <input
                        id="variant-size"
                        type="text"
                        value={variantForm.size}
                        onChange={(e) => setVariantForm((f) => ({ ...f, size: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-tertiary bg-quaternary px-3 py-2 text-sm text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label htmlFor="variant-color" className="block text-xs font-medium text-secondary">
                        Color
                      </label>
                      <input
                        id="variant-color"
                        type="text"
                        value={variantForm.color}
                        onChange={(e) => setVariantForm((f) => ({ ...f, color: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-tertiary bg-quaternary px-3 py-2 text-sm text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="variant-price" className="block text-xs font-medium text-secondary">
                        Price
                      </label>
                      <input
                        id="variant-price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={variantForm.price}
                        onChange={(e) => setVariantForm((f) => ({ ...f, price: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-tertiary bg-quaternary px-3 py-2 text-sm text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label htmlFor="variant-stock" className="block text-xs font-medium text-secondary">
                        Stock
                      </label>
                      <input
                        id="variant-stock"
                        type="number"
                        min="0"
                        value={variantForm.stockQuantity}
                        onChange={(e) => setVariantForm((f) => ({ ...f, stockQuantity: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-tertiary bg-quaternary px-3 py-2 text-sm text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="variant-imageUrl" className="block text-xs font-medium text-secondary">
                      Image URL
                    </label>
                    <input
                      id="variant-imageUrl"
                      type="url"
                      value={variantForm.imageUrl}
                      onChange={(e) => setVariantForm((f) => ({ ...f, imageUrl: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-tertiary bg-quaternary px-3 py-2 text-sm text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="https://..."
                    />
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={variantForm.isActive}
                      onChange={(e) => setVariantForm((f) => ({ ...f, isActive: e.target.checked }))}
                      className="rounded border-tertiary text-primary"
                    />
                    <span className="text-sm font-medium text-primary">Active</span>
                  </label>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={variantSaving}
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-quaternary transition-opacity hover:opacity-90 disabled:opacity-70"
                    >
                      {variantSaving ? 'Saving…' : 'Save changes'}
                    </button>
                    <button
                      type="button"
                      onClick={closeEditVariant}
                      className="rounded-lg border border-tertiary bg-quaternary px-4 py-2 text-sm font-medium text-primary hover:bg-tertiary/20"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
    </>
  );
}

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
  Filter
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
      applyDiscount: (variant.discount ?? 0) > 0,
      discount: variant.discount ?? '',
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
        discount: variantForm.applyDiscount ? (Number(variantForm.discount) || 0) : 0,
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-3xl text-primary">Products</h1>
          <p className="mt-1 text-secondary">Manage your product catalog.</p>
        </div>
        <Link
          to="/admin/products/new"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-white shadow-md transition-all hover:bg-secondary"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tertiary" />
            <input
              type="search"
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              className="w-full rounded-md border border-border bg-white py-2 pl-9 pr-3 text-sm text-primary placeholder:text-tertiary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="rounded-md border border-border bg-white px-3 py-2 text-sm text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All Categories</option>
            {categories
              .filter((c) => c.slug)
              .map((c) => (
                <option key={c.id} value={c.slug}>
                  {'—'.repeat(c.depth)} {c.name}
                </option>
              ))}
          </select>
          <select
            value={filters.sort}
            onChange={(e) => handleFilterChange('sort', e.target.value)}
            className="rounded-md border border-border bg-white px-3 py-2 text-sm text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value || 'default'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            onClick={applyFilters}
            className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-secondary"
          >
            <Filter className="h-4 w-4" />
            Apply Filters
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-100">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50/50">
                  <th className="w-10 py-4 pl-6 pr-2"></th>
                  <th className="py-4 px-4 font-bold text-primary">Product</th>
                  <th className="py-4 px-4 font-bold text-primary">Price</th>
                  <th className="py-4 px-4 font-bold text-primary">Category</th>
                  <th className="py-4 px-4 font-bold text-primary">Variants</th>
                  <th className="py-4 px-4 font-bold text-primary">Status</th>
                  <th className="py-4 px-4 text-right font-bold text-primary pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-secondary">
                      No products found.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => {
                    const variants = Array.isArray(p.variants) ? p.variants : [];
                    const isExpanded = expandedId === p.id;
                    return (
                      <Fragment key={p.id}>
                        <tr className="group hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 pl-6 pr-2">
                            {variants.length > 0 && (
                              <button
                                onClick={() => setExpandedId(isExpanded ? null : p.id)}
                                className="rounded p-1 text-secondary hover:bg-gray-200 hover:text-primary"
                              >
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </button>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border bg-gray-100">
                                {p.imageUrl ? (
                                  <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-tertiary">
                                    <ImageOff className="h-4 w-4" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-primary">{p.name}</p>
                                <p className="text-xs text-secondary font-mono">{p.slug}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 font-medium text-primary">
                            {typeof p.basePrice === 'number'
                              ? p.basePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })
                              : p.basePrice ?? '—'}
                          </td>
                          <td className="py-4 px-4 text-secondary">{p.categoryName ?? '—'}</td>
                          <td className="py-4 px-4 text-secondary">
                            {variants.length > 0 ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-primary">
                                {variants.length}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="py-4 px-4">
                            {p.isFeatured && (
                              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                                Featured
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-right pr-6">
                            <Link
                              to={`/admin/products/edit/${encodeURIComponent(p.slug ?? '')}`}
                              className="text-sm font-medium text-primary hover:text-secondary hover:underline"
                            >
                              Edit
                            </Link>
                          </td>
                        </tr>
                        {isExpanded && variants.length > 0 && (
                          <tr className="bg-gray-50/30">
                            <td colSpan={7} className="px-6 py-4">
                              <div className="rounded-lg border border-border bg-white overflow-hidden">
                                <table className="w-full text-sm">
                                  <thead className="bg-gray-50 border-b border-border">
                                    <tr>
                                      <th className="py-2 px-4 text-left font-medium text-secondary">SKU</th>
                                      <th className="py-2 px-4 text-left font-medium text-secondary">Size</th>
                                      <th className="py-2 px-4 text-left font-medium text-secondary">Color</th>
                                      <th className="py-2 px-4 text-left font-medium text-secondary">Price</th>
                                      <th className="py-2 px-4 text-left font-medium text-secondary">Stock</th>
                                      <th className="py-2 px-4 text-right font-medium text-secondary">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border">
                                    {variants.map((v) => (
                                      <tr key={v.id}>
                                        <td className="py-2 px-4 font-mono text-xs text-primary">{v.sku ?? '—'}</td>
                                        <td className="py-2 px-4 text-primary">{v.size ?? '—'}</td>
                                        <td className="py-2 px-4 text-primary">{v.color ?? '—'}</td>
                                        <td className="py-2 px-4 text-primary">
                                          {typeof v.price === 'number'
                                            ? v.price.toLocaleString(undefined, { minimumFractionDigits: 2 })
                                            : v.price ?? '—'}
                                        </td>
                                        <td className="py-2 px-4 text-primary">{v.stockQuantity ?? 0}</td>
                                        <td className="py-2 px-4 text-right">
                                          <button
                                            onClick={() => openEditVariant(p.id, p.name, v)}
                                            className="text-xs font-medium text-primary hover:text-secondary hover:underline"
                                          >
                                            Edit Variant
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
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
          <div className="flex items-center justify-between border-t border-border px-6 py-4">
            <p className="text-sm text-secondary">
              Showing {from}–{to} of {totalElements} results
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                disabled={page === 0}
                className="rounded p-1 text-primary hover:bg-gray-100 disabled:opacity-30"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setPage((prev) => prev + 1)}
                disabled={last}
                className="rounded p-1 text-primary hover:bg-gray-100 disabled:opacity-30"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Variant Modal */}
      {editVariant && variantForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeEditVariant} />
          <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-primary">Edit Variant</h2>
            <p className="text-sm text-secondary mb-4">{editVariant.productName}</p>
            
            {variantSubmitError && (
              <p className="mb-4 text-sm text-red-600">{variantSubmitError}</p>
            )}

            <form onSubmit={handleVariantSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-secondary">SKU</label>
                <input
                  type="text"
                  value={variantForm.sku}
                  onChange={(e) => setVariantForm((f) => ({ ...f, sku: e.target.value }))}
                  className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-secondary">Size</label>
                  <input
                    type="text"
                    value={variantForm.size}
                    onChange={(e) => setVariantForm((f) => ({ ...f, size: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-secondary">Color</label>
                  <input
                    type="text"
                    value={variantForm.color}
                    onChange={(e) => setVariantForm((f) => ({ ...f, color: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-secondary">Price</label>
                  <input
                    type="number"
                    value={variantForm.price}
                    onChange={(e) => setVariantForm((f) => ({ ...f, price: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-secondary">Stock</label>
                  <input
                    type="number"
                    value={variantForm.stockQuantity}
                    onChange={(e) => setVariantForm((f) => ({ ...f, stockQuantity: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeEditVariant}
                  className="rounded-md px-4 py-2 text-sm font-medium text-secondary hover:text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={variantSaving}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-secondary disabled:opacity-50"
                >
                  {variantSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

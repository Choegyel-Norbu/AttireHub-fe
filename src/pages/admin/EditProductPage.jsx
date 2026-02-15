import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Package, CheckCircle, Loader2, Plus, Layers } from 'lucide-react';
import * as adminProductService from '@/services/adminProductService';
import { getProductBySlug } from '@/services/productService';
import { getCategories, flattenCategoriesWithSlug } from '@/services/categoryService';

const editProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  slug: z.string().optional(),
  description: z.string().optional().nullable(),
  basePrice: z.coerce.number().min(0, 'Base price must be 0 or more'),
  categoryId: z.coerce.number().int().min(1, 'Category is required'),
  brand: z.string().optional().nullable(),
  material: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isTrending: z.boolean().optional(),
  imageUrl: z.string().optional().nullable(),
});

function inputClass(error) {
  const base =
    'w-full rounded-lg border bg-quaternary px-4 py-2.5 text-primary placeholder-tertiary outline-none transition-colors focus:ring-2';
  const normal = 'border-border focus:border-secondary focus:ring-secondary/20';
  const invalid = 'border-primary focus:border-primary focus:ring-primary/20';
  return `${base} ${error ? invalid : normal}`;
}

export default function EditProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatedProduct, setUpdatedProduct] = useState(null);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [variantAddError, setVariantAddError] = useState(null);
  const [variantAdding, setVariantAdding] = useState(false);
  const [newVariant, setNewVariant] = useState({
    size: '',
    color: '',
    price: '',
    stockQuantity: 0,
    imageUrl: '',
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(editProductSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      basePrice: 0,
      categoryId: 1,
      brand: '',
      material: '',
      isActive: true,
      isFeatured: false,
      isTrending: false,
      imageUrl: '',
    },
  });

  useEffect(() => {
    if (!slug) {
      setLoadError('Product slug is missing.');
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    Promise.all([getProductBySlug(slug), getCategories()])
      .then(([productData, categoryTree]) => {
        if (cancelled) return;
        const flat = flattenCategoriesWithSlug(Array.isArray(categoryTree) ? categoryTree : []);
        setCategoryOptions(flat);
        setProduct(productData);
        const p = productData;
        const categoryId = p?.categoryId ?? (flat.find((c) => c.slug === (p?.categorySlug ?? ''))?.id ?? flat[0]?.id ?? 1);
        setValue('name', p?.name ?? '');
        setValue('slug', p?.slug ?? '');
        setValue('description', p?.description ?? '');
        setValue('basePrice', p?.basePrice ?? 0);
        setValue('categoryId', categoryId);
        setValue('brand', p?.brand ?? '');
        setValue('material', p?.material ?? '');
        setValue('isActive', p?.isActive !== false);
        setValue('isFeatured', Boolean(p?.featured ?? p?.isFeatured));
        setValue('isTrending', Boolean(p?.trending ?? p?.isTrending));
        setValue('imageUrl', p?.imageUrl ?? '');
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err?.message ?? 'Failed to load product.');
          setProduct(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setCategoriesLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [slug, setValue]);

  const onSubmit = async (data) => {
    if (!product?.id) return;
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const result = await adminProductService.updateProduct(product.id, {
        name: data.name,
        slug: data.slug?.trim() || undefined,
        description: data.description?.trim() || null,
        basePrice: Number(data.basePrice),
        categoryId: Number(data.categoryId),
        brand: data.brand?.trim() || null,
        material: data.material?.trim() || null,
        isActive: data.isActive !== false,
        isFeatured: Boolean(data.isFeatured),
        isTrending: Boolean(data.isTrending),
        imageUrl: data.imageUrl?.trim() || null,
      });
      const resolved = result?.data ?? result;
      setUpdatedProduct(resolved);
    } catch (err) {
      setSubmitError(err?.message ?? 'Failed to update product.');
} finally {
    setIsSubmitting(false);
    }
  };

  const handleAddVariant = async () => {
    if (!product?.id) return;
    setVariantAddError(null);
    const size = String(newVariant.size).trim();
    const color = String(newVariant.color).trim();
    if (!size || !color) {
      setVariantAddError('Size and color are required.');
      return;
    }
    const price = Number(newVariant.price);
    if (Number.isNaN(price) || price < 0) {
      setVariantAddError('Price must be 0 or more.');
      return;
    }
    const stockQuantity = Number(newVariant.stockQuantity) || 0;
    if (stockQuantity < 0) {
      setVariantAddError('Stock must be 0 or more.');
      return;
    }
    setVariantAdding(true);
    try {
      await adminProductService.addVariant(product.id, {
        size,
        color,
        price,
        stockQuantity,
        imageUrl: newVariant.imageUrl?.trim() || null,
      });
      const updated = await getProductBySlug(slug);
      setProduct(updated);
      setNewVariant({ size: '', color: '', price: '', stockQuantity: 0, imageUrl: '' });
    } catch (err) {
      setVariantAddError(err?.message ?? 'Failed to add variant.');
    } finally {
      setVariantAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
        <span className="sr-only">Loading product…</span>
      </div>
    );
  }

  if (loadError || !product) {
    return (
      <>
        <p className="text-primary">{loadError ?? 'Product not found.'}</p>
        <Link
          to="/admin/products"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-secondary hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to product management
        </Link>
      </>
    );
  }

  if (updatedProduct) {
    const p = updatedProduct;
    return (
      <>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-quaternary p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle className="h-6 w-6 text-primary" aria-hidden />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-primary">Product updated successfully</h2>
                <p className="text-sm text-secondary">{p.name}</p>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => navigate('/admin/products')}
                className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-quaternary transition-opacity hover:opacity-90"
              >
                Back to product management
              </button>
              <button
                type="button"
                onClick={() => setUpdatedProduct(null)}
                className="rounded-lg border border-border bg-quaternary px-4 py-2.5 text-sm font-medium text-primary hover:bg-tertiary/20"
              >
                Continue editing
              </button>
            </div>
      </>
    );
  }

  return (
    <>
          <h1 className="flex items-center gap-2 text-2xl font-semibold text-primary">
            <Package className="h-6 w-6" aria-hidden />
            Edit product
          </h1>
          <p className="mt-1 text-sm text-secondary">
            Update product details. Add or view variants below.
          </p>

          {submitError && (
            <div className="mt-6 rounded-lg border border-border bg-quaternary p-4 text-sm text-primary">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-8">
            <section className="rounded-xl border border-border bg-quaternary p-6">
              <h2 className="text-lg font-medium text-primary">Details</h2>
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-primary">
                    Product name <span className="text-primary">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    className={inputClass(errors.name)}
                    placeholder="e.g. Classic T-Shirt"
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-primary">{errors.name.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="slug" className="block text-sm font-medium text-primary">
                    Slug
                  </label>
                  <input
                    id="slug"
                    type="text"
                    className={inputClass(errors.slug)}
                    placeholder="e.g. classic-tshirt"
                    {...register('slug')}
                  />
                  {errors.slug && (
                    <p className="mt-1 text-sm text-primary">{errors.slug.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-primary">
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    className={inputClass(errors.description)}
                    placeholder="Product description..."
                    {...register('description')}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="basePrice" className="block text-sm font-medium text-primary">
                      Base price <span className="text-primary">*</span>
                    </label>
                    <input
                      id="basePrice"
                      type="number"
                      step="0.01"
                      min="0"
                      className={inputClass(errors.basePrice)}
                      {...register('basePrice')}
                    />
                    {errors.basePrice && (
                      <p className="mt-1 text-sm text-primary">{errors.basePrice.message}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="categoryId" className="block text-sm font-medium text-primary">
                      Category <span className="text-primary">*</span>
                    </label>
                    <select
                      id="categoryId"
                      className={inputClass(errors.categoryId)}
                      {...register('categoryId')}
                      disabled={categoriesLoading}
                    >
                      {categoriesLoading ? (
                        <option value="">Loading categories…</option>
                      ) : categoryOptions.length === 0 ? (
                        <option value="">No categories found</option>
                      ) : (
                        categoryOptions.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.depth > 0 ? '\u00A0'.repeat(cat.depth * 2) + '↳ ' : ''}{cat.name}
                          </option>
                        ))
                      )}
                    </select>
                    {errors.categoryId && (
                      <p className="mt-1 text-sm text-primary">{errors.categoryId.message}</p>
                    )}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="brand" className="block text-sm font-medium text-primary">
                      Brand
                    </label>
                    <input
                      id="brand"
                      type="text"
                      className={inputClass(errors.brand)}
                      placeholder="e.g. AttireHub"
                      {...register('brand')}
                    />
                  </div>
                  <div>
                    <label htmlFor="material" className="block text-sm font-medium text-primary">
                      Material
                    </label>
                    <input
                      id="material"
                      type="text"
                      className={inputClass(errors.material)}
                      placeholder="e.g. Cotton"
                      {...register('material')}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="imageUrl" className="block text-sm font-medium text-primary">
                    Product image URL
                  </label>
                  <input
                    id="imageUrl"
                    type="url"
                    className={inputClass(errors.imageUrl)}
                    placeholder="https://..."
                    {...register('imageUrl')}
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-border text-primary" {...register('isActive')} />
                    <span className="text-sm font-medium text-primary">Active</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-border text-primary" {...register('isFeatured')} />
                    <span className="text-sm font-medium text-primary">Featured</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-border text-primary" {...register('isTrending')} />
                    <span className="text-sm font-medium text-primary">Trending</span>
                  </label>
                </div>
              </div>
            </section>

            {/* Variants */}
            <section className="rounded-xl border border-border bg-quaternary p-6">
              <h2 className="flex items-center gap-2 text-lg font-medium text-primary">
                <Layers className="h-5 w-5" aria-hidden />
                Variants
              </h2>
              {Array.isArray(product.variants) && product.variants.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {product.variants.map((v) => (
                    <li
                      key={v.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-quaternary px-3 py-2 text-sm"
                    >
                      <span className="font-medium text-primary">
                        {[v.size, v.color].filter(Boolean).join(' · ')}
                        {v.sku && ` (${v.sku})`}
                      </span>
                      <span className="text-secondary">
                        Nu {typeof v.price === 'number' ? v.price.toLocaleString() : v.price} /- · Stock: {v.stockQuantity ?? 0}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {(!product.variants || product.variants.length === 0) && (
                <p className="mt-4 text-sm text-secondary">No variants yet. Add one below.</p>
              )}

              <div className="mt-6 border-t border-border pt-6">
                <h3 className="text-sm font-medium text-primary">Add variant</h3>
                {variantAddError && (
                  <p className="mt-2 text-sm text-primary" role="alert">
                    {variantAddError}
                  </p>
                )}
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <label htmlFor="var-size" className="block text-sm font-medium text-primary">
                      Size <span className="text-primary">*</span>
                    </label>
                    <input
                      id="var-size"
                      type="text"
                      value={newVariant.size}
                      onChange={(e) => setNewVariant((prev) => ({ ...prev, size: e.target.value }))}
                      className={inputClass(false)}
                      placeholder="e.g. M"
                    />
                  </div>
                  <div>
                    <label htmlFor="var-color" className="block text-sm font-medium text-primary">
                      Color <span className="text-primary">*</span>
                    </label>
                    <input
                      id="var-color"
                      type="text"
                      value={newVariant.color}
                      onChange={(e) => setNewVariant((prev) => ({ ...prev, color: e.target.value }))}
                      className={inputClass(false)}
                      placeholder="e.g. Red"
                    />
                  </div>
                  <div>
                    <label htmlFor="var-price" className="block text-sm font-medium text-primary">
                      Price <span className="text-primary">*</span>
                    </label>
                    <input
                      id="var-price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={newVariant.price}
                      onChange={(e) => setNewVariant((prev) => ({ ...prev, price: e.target.value }))}
                      className={inputClass(false)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label htmlFor="var-stock" className="block text-sm font-medium text-primary">
                      Stock
                    </label>
                    <input
                      id="var-stock"
                      type="number"
                      min="0"
                      value={newVariant.stockQuantity}
                      onChange={(e) => setNewVariant((prev) => ({ ...prev, stockQuantity: Number(e.target.value) || 0 }))}
                      className={inputClass(false)}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label htmlFor="var-imageUrl" className="block text-sm font-medium text-primary">
                    Variant image URL
                  </label>
                  <input
                    id="var-imageUrl"
                    type="url"
                    value={newVariant.imageUrl}
                    onChange={(e) => setNewVariant((prev) => ({ ...prev, imageUrl: e.target.value }))}
                    className={inputClass(false)}
                    placeholder="https://..."
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  disabled={variantAdding}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border bg-quaternary px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-tertiary/20 disabled:opacity-70"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  {variantAdding ? 'Adding…' : 'Add variant'}
                </button>
              </div>
            </section>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-quaternary transition-opacity hover:opacity-90 disabled:opacity-70"
              >
                {isSubmitting ? 'Saving…' : 'Save changes'}
              </button>
              <Link
                to="/admin/products"
                className="rounded-lg border border-border bg-quaternary px-6 py-2.5 text-sm font-medium text-primary hover:bg-tertiary/20"
              >
                Cancel
              </Link>
            </div>
          </form>
    </>
  );
}

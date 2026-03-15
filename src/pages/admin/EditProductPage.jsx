import { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Package,
  CheckCircle,
  Loader2,
  Plus,
  List,
  Trash2,
} from 'lucide-react';
import * as adminProductService from '@/services/adminProductService';
import { getProductBySlug } from '@/services/productService';
import { getCategories, flattenCategoriesWithSlug } from '@/services/categoryService';

const editProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  slug: z.string().optional(),
  description: z.string().optional().nullable(),
  categoryId: z.coerce.number().int().min(1, 'Category is required'),
  brand: z.string().optional().nullable(),
  material: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  isTrending: z.boolean().optional(),
});

function getInputClassName(error) {
  const base =
    'w-full rounded-none border-b border-border bg-transparent px-3 py-3 text-sm text-primary placeholder-tertiary outline-none transition-colors focus:border-black focus:ring-0';
  const normal = 'border-border focus:border-primary';
  const invalid = 'border-red-500 focus:border-red-500 text-red-600';
  return `${base} ${error ? invalid : normal}`;
}

/** Renders a file preview and revokes object URLs on change or unmount */
function FilePreview({ file, className = 'h-10 w-10 rounded object-cover' }) {
  const urlRef = useRef(null);
  const fileRef = useRef(null);
  if (fileRef.current !== file) {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    fileRef.current = file;
    urlRef.current = file ? URL.createObjectURL(file) : null;
  }
  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);
  if (!urlRef.current) return null;
  return <img src={urlRef.current} alt="" className={className} />;
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
  /** One image file per variant by index; null = no change for that variant */
  const [variantImageFiles, setVariantImageFiles] = useState([]);
  /** Set of variant IDs currently having their image removed (for loading state) */
  const [removingVariantImageIds, setRemovingVariantImageIds] = useState(() => new Set());
  const [variantAddError, setVariantAddError] = useState(null);
  const [variantAdding, setVariantAdding] = useState(false);
  const [newVariant, setNewVariant] = useState({
    size: '',
    color: '',
    price: '',
    stockQuantity: '',
    applyDiscount: false,
    discount: '',
  });
  /** File to upload for the new variant when adding (sent via product update after add) */
  const [newVariantImageFile, setNewVariantImageFile] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
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
      isNewArrival: false,
      isTrending: false,
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
        setValue('isNewArrival', Boolean(p?.newArrival ?? p?.isNewArrival));
        setValue('isTrending', Boolean(p?.trending ?? p?.isTrending));
        const variantCount = (p?.variants || []).length;
        setVariantImageFiles(Array(variantCount).fill(null));
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
      const variantCount = (product.variants || []).length;
      const imagesForRequest = Array.from({ length: variantCount }, (_, i) => variantImageFiles[i] ?? null);
      const result = await adminProductService.updateProduct(
        product.id,
        {
          name: data.name,
          slug: data.slug?.trim() || undefined,
          description: data.description?.trim() || null,
          basePrice: Number(data.basePrice),
          categoryId: Number(data.categoryId),
          brand: data.brand?.trim() || null,
          material: data.material?.trim() || null,
          isActive: data.isActive !== false,
          isFeatured: Boolean(data.isFeatured),
          isNewArrival: Boolean(data.isNewArrival),
          isTrending: Boolean(data.isTrending),
        },
        imagesForRequest
      );
      const resolved = result?.data ?? result;
      setUpdatedProduct(resolved);
      setVariantImageFiles(Array((resolved?.variants || []).length).fill(null));
    } catch (err) {
      setSubmitError(err?.message ?? 'Failed to update product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const setVariantImage = (index, file) => {
    setVariantImageFiles((prev) => {
      const next = [...prev];
      next[index] = file;
      return next;
    });
  };

  const handleRemoveVariantImage = async (variantId, index) => {
    if (variantImageFiles[index]) {
      setVariantImage(index, null);
      return;
    }
    const v = product?.variants?.[index];
    if (!v?.imageUrl || !product?.id) return;
    setRemovingVariantImageIds((prev) => new Set(prev).add(variantId));
    setSubmitError(null);
    try {
      await adminProductService.deleteVariantImage(product.id, variantId);
      const updated = await getProductBySlug(slug);
      setProduct(updated);
      setVariantImageFiles(Array((updated?.variants || []).length).fill(null));
    } catch (err) {
      setSubmitError(err?.message ?? 'Failed to remove variant image.');
    } finally {
      setRemovingVariantImageIds((prev) => {
        const next = new Set(prev);
        next.delete(variantId);
        return next;
      });
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
        discount: newVariant.applyDiscount ? (Number(newVariant.discount) || 0) : 0,
      });
      let updated = await getProductBySlug(slug);
      setProduct(updated);
      setVariantImageFiles(Array((updated?.variants || []).length).fill(null));

      if (newVariantImageFile && newVariantImageFile.size > 0) {
        const formData = getValues();
        const body = {
          name: formData.name,
          slug: formData.slug?.trim() || undefined,
          description: formData.description?.trim() || null,
          basePrice: Number(formData.basePrice),
          categoryId: Number(formData.categoryId),
          brand: formData.brand?.trim() || null,
          material: formData.material?.trim() || null,
          isActive: formData.isActive !== false,
          isFeatured: Boolean(formData.isFeatured),
          isNewArrival: Boolean(formData.isNewArrival),
          isTrending: Boolean(formData.isTrending),
        };
        const variantCount = (updated?.variants || []).length;
        const imagesForNewVariant = variantCount <= 1
          ? [newVariantImageFile]
          : [...Array(variantCount - 1).fill(null), newVariantImageFile];
        await adminProductService.updateProduct(updated.id, body, imagesForNewVariant);
        updated = await getProductBySlug(slug);
        setProduct(updated);
        setVariantImageFiles(Array((updated?.variants || []).length).fill(null));
      }

      setNewVariant({ size: '', color: '', price: '', stockQuantity: '', applyDiscount: false, discount: '' });
      setNewVariantImageFile(null);
    } catch (err) {
      setVariantAddError(err?.message ?? 'Failed to add variant.');
    } finally {
      setVariantAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary/30" aria-hidden />
        <p className="text-sm text-secondary">Loading product…</p>
      </div>
    );
  }

  if (loadError || !product) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <p className="text-primary">{loadError ?? 'Product not found.'}</p>
        <Link
          to="/admin/products"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-secondary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to products
        </Link>
      </div>
    );
  }

  if (updatedProduct) {
    const p = updatedProduct;
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-white shadow-xl shadow-black/5"
          >
            <div className="bg-green-50/50 p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 ring-8 ring-green-50">
                <CheckCircle className="h-8 w-8 text-green-600" strokeWidth={2} />
              </div>
              <h2 className="font-serif text-2xl text-primary">Update Successful</h2>
              <p className="mt-2 text-sm text-secondary">
                <span className="font-medium text-primary">{p.name}</span> has been updated.
              </p>
              {p.slug && (
                <p className="mt-1 font-mono text-xs text-tertiary">{p.slug}</p>
              )}
            </div>

            <div className="flex flex-col gap-3 bg-white p-6 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => navigate('/admin/products')}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-secondary hover:shadow-lg hover:shadow-primary/20 sm:w-auto"
              >
                <List className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                Product Management
              </button>
              <button
                type="button"
                onClick={() => {
                  setUpdatedProduct(null);
                  setVariantImageFiles(Array((product?.variants || []).length).fill(null));
                }}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full border border-border px-6 py-3 text-xs font-bold uppercase tracking-wider text-primary transition-all hover:border-primary hover:bg-primary/5 sm:w-auto"
              >
                <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
                Continue Editing
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  const variants = Array.isArray(product.variants) ? product.variants : [];

  return (
    <div className="mx-auto max-w-5xl space-y-12">
      <div>
        <Link
          to="/admin/products"
          className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-secondary hover:text-primary mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Products
        </Link>
        <h1 className="font-serif text-xl text-primary">Edit product</h1>
        <p className="mt-0.5 text-xs text-secondary/70">
          Update product details and manage variants.
        </p>
      </div>

      <div className="grid gap-12 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-12">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
            <AnimatePresence>
              {submitError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div
                    role="alert"
                    className="rounded-md border border-red-100 bg-red-50 p-3 text-xs text-red-600"
                  >
                    {submitError}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Product details */}
            <section>
              <div className="mb-6 border-b border-border pb-4">
                <h2 className="text-lg font-medium text-primary">Product details</h2>
              </div>
              <div className="space-y-6">
                <div className="space-y-1">
                  <label htmlFor="edit-product-name" className="block text-xs font-medium uppercase tracking-wider text-secondary">
                    Name <span className="text-primary">*</span>
                  </label>
                  <input
                    id="edit-product-name"
                    type="text"
                    className={getInputClassName(errors.name)}
                    placeholder="e.g. Classic Oxford Shirt"
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label htmlFor="edit-product-slug" className="block text-xs font-medium uppercase tracking-wider text-secondary">
                    Slug <span className="normal-case tracking-normal text-tertiary">(optional)</span>
                  </label>
                  <input
                    id="edit-product-slug"
                    type="text"
                    className={getInputClassName(errors.slug)}
                    placeholder="classic-oxford-shirt"
                    {...register('slug')}
                  />
                  {errors.slug && (
                    <p className="mt-1 text-xs text-red-500">{errors.slug.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label htmlFor="edit-product-description" className="block text-xs font-medium uppercase tracking-wider text-secondary">
                    Description
                  </label>
                  <textarea
                    id="edit-product-description"
                    rows={3}
                    className={getInputClassName(errors.description)}
                    placeholder="Product description..."
                    {...register('description')}
                  />
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label htmlFor="edit-product-categoryId" className="block text-xs font-medium uppercase tracking-wider text-secondary">
                      Category <span className="text-primary">*</span>
                    </label>
                    <select
                      id="edit-product-categoryId"
                      className={getInputClassName(errors.categoryId)}
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
                      <p className="mt-1 text-xs text-red-500">{errors.categoryId.message}</p>
                    )}
                  </div>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label htmlFor="edit-product-brand" className="block text-xs font-medium uppercase tracking-wider text-secondary">
                      Brand
                    </label>
                    <input
                      id="edit-product-brand"
                      type="text"
                      className={getInputClassName(errors.brand)}
                      placeholder="e.g. AttireHub"
                      {...register('brand')}
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="edit-product-material" className="block text-xs font-medium uppercase tracking-wider text-secondary">
                      Material
                    </label>
                    <input
                      id="edit-product-material"
                      type="text"
                      className={getInputClassName(errors.material)}
                      placeholder="e.g. Cotton"
                      {...register('material')}
                    />
                  </div>
                </div>
                <div className="border-t border-border pt-6">
                  <p className="mb-3 text-xs font-medium uppercase tracking-wider text-secondary">Status &amp; homepage</p>
                  <div className="flex flex-wrap gap-6">
                    <label className="flex cursor-pointer select-none items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-border text-primary focus:ring-black"
                        {...register('isActive')}
                      />
                      <span className="text-sm text-primary">Active</span>
                    </label>
                    <label className="flex cursor-pointer select-none items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-border text-primary focus:ring-black"
                        {...register('isFeatured')}
                      />
                      <span className="text-sm text-primary">Featured</span>
                    </label>
                    <label className="flex cursor-pointer select-none items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-border text-primary focus:ring-black"
                        {...register('isNewArrival')}
                      />
                      <span className="text-sm text-primary">New Arrival</span>
                    </label>
                    <label className="flex cursor-pointer select-none items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-border text-primary focus:ring-black"
                        {...register('isTrending')}
                      />
                      <span className="text-sm text-primary">Trending</span>
                    </label>
                  </div>
                </div>
              </div>
            </section>

            {/* Variants */}
            <section>
              <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
                <h2 className="text-lg font-medium text-primary">Variants</h2>
              </div>

              {variants.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-border bg-white">
                  <table className="w-full min-w-[640px] text-left text-sm table-fixed">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="w-20 shrink-0 px-3 py-3 text-xs font-medium uppercase tracking-wider text-secondary whitespace-nowrap">Image</th>
                        <th className="w-24 shrink-0 px-3 py-3 text-xs font-medium uppercase tracking-wider text-secondary whitespace-nowrap">SKU</th>
                        <th className="w-16 shrink-0 px-3 py-3 text-xs font-medium uppercase tracking-wider text-secondary whitespace-nowrap">Size</th>
                        <th className="w-20 shrink-0 px-3 py-3 text-xs font-medium uppercase tracking-wider text-secondary whitespace-nowrap">Color</th>
                        <th className="w-20 shrink-0 px-3 py-3 text-xs font-medium uppercase tracking-wider text-secondary whitespace-nowrap">Price</th>
                        <th className="w-16 shrink-0 px-3 py-3 text-xs font-medium uppercase tracking-wider text-secondary whitespace-nowrap">Stock</th>
                        <th className="min-w-[140px] px-3 py-3 text-xs font-medium uppercase tracking-wider text-secondary whitespace-nowrap">Upload</th>
                      </tr>
                    </thead>
                    <tbody>
                      {variants.map((v, index) => (
                        <tr key={v.id} className="border-b border-border/50 last:border-0">
                          <td className="w-20 shrink-0 px-3 py-3 align-middle">
                            {variantImageFiles[index] ? (
                              <FilePreview file={variantImageFiles[index]} className="h-12 w-12 rounded-lg border border-border object-cover shadow-sm" />
                            ) : v.imageUrl ? (
                              <img src={v.imageUrl} alt="" className="h-12 w-12 rounded-lg border border-border object-cover shadow-sm" />
                            ) : (
                              <span className="text-[10px] text-tertiary">—</span>
                            )}
                          </td>
                          <td className="w-24 shrink-0 px-3 py-3 font-mono text-primary text-xs truncate" title={v.sku ?? ''}>{v.sku ?? '—'}</td>
                          <td className="w-16 shrink-0 px-3 py-3 text-primary">{v.size ?? '—'}</td>
                          <td className="w-20 shrink-0 px-3 py-3 text-primary">{v.color ?? '—'}</td>
                          <td className="w-20 shrink-0 px-3 py-3 text-primary">
                            {typeof v.price === 'number' ? v.price.toLocaleString() : v.price ?? '—'}
                          </td>
                          <td className="w-16 shrink-0 px-3 py-3 text-primary">{v.stockQuantity ?? 0}</td>
                          <td className="min-w-[140px] px-3 py-3 align-top">
                            <label className="block">
                              <span className="sr-only">Upload image for {v.size} / {v.color}</span>
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                className="w-full cursor-pointer text-xs text-secondary file:mr-2 file:cursor-pointer file:rounded-full file:border-0 file:bg-primary file:px-3 file:py-2 file:text-xs file:font-medium file:uppercase file:tracking-wider file:text-white hover:file:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
                                onChange={(e) => {
                                  const file = e.target.files?.[0] ?? null;
                                  setVariantImage(index, file);
                                }}
                                disabled={isSubmitting}
                              />
                            </label>
                            {variantImageFiles[index] ? (
                              <p className="mt-1 truncate text-[10px] text-tertiary" title={variantImageFiles[index].name}>
                                {variantImageFiles[index].name}
                              </p>
                            ) : (
                              <p className="mt-1 text-[10px] text-tertiary">JPEG, PNG, GIF, WebP</p>
                            )}
                            {(v.imageUrl || variantImageFiles[index]) && (
                              <button
                                type="button"
                                onClick={() => handleRemoveVariantImage(v.id, index)}
                                disabled={isSubmitting || removingVariantImageIds.has(v.id)}
                                className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-red-600 hover:text-red-700 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label={`Remove image for ${v.size} / ${v.color}`}
                              >
                                {removingVariantImageIds.has(v.id) ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                                Remove image
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-secondary">No variants yet. Add one below.</p>
              )}

              <div className="mt-6 rounded-xl border border-border bg-gray-50/50 p-5">
                <h3 className="text-sm font-medium text-primary mb-4">Add variant</h3>
                {variantAddError && (
                  <div className="mb-4 rounded-md border border-red-100 bg-red-50 p-3 text-xs text-red-600" role="alert">
                    {variantAddError}
                  </div>
                )}
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-1">
                    <label htmlFor="var-size" className="block text-xs font-medium uppercase tracking-wider text-secondary">
                      Size <span className="text-primary">*</span>
                    </label>
                    <input
                      id="var-size"
                      type="text"
                      value={newVariant.size}
                      onChange={(e) => setNewVariant((prev) => ({ ...prev, size: e.target.value }))}
                      className={getInputClassName(false)}
                      placeholder="e.g. M"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="var-color" className="block text-xs font-medium uppercase tracking-wider text-secondary">
                      Color <span className="text-primary">*</span>
                    </label>
                    <input
                      id="var-color"
                      type="text"
                      value={newVariant.color}
                      onChange={(e) => setNewVariant((prev) => ({ ...prev, color: e.target.value }))}
                      className={getInputClassName(false)}
                      placeholder="e.g. Red"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="var-price" className="block text-xs font-medium uppercase tracking-wider text-secondary">
                      Price <span className="text-primary">*</span>
                    </label>
                    <input
                      id="var-price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={newVariant.price}
                      onChange={(e) => setNewVariant((prev) => ({ ...prev, price: e.target.value }))}
                      className={getInputClassName(false)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="var-stock" className="block text-xs font-medium uppercase tracking-wider text-secondary">
                      Stock
                    </label>
                    <input
                      id="var-stock"
                      type="number"
                      min="0"
                      value={newVariant.stockQuantity}
                      onChange={(e) => setNewVariant((prev) => ({ ...prev, stockQuantity: e.target.value }))}
                      className={getInputClassName(false)}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-6 border-t border-border pt-4">
                  <label className="flex cursor-pointer select-none items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newVariant.applyDiscount}
                      onChange={(e) => setNewVariant((prev) => ({ ...prev, applyDiscount: e.target.checked }))}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-black"
                    />
                    <span className="text-sm text-primary">Apply discount</span>
                  </label>
                  {newVariant.applyDiscount && (
                    <div className="flex items-center gap-2">
                      <label htmlFor="var-discount" className="text-xs font-medium uppercase tracking-wider text-secondary whitespace-nowrap">
                        Discount amount
                      </label>
                      <input
                        id="var-discount"
                        type="number"
                        step="0.01"
                        min="0"
                        value={newVariant.discount}
                        onChange={(e) => setNewVariant((prev) => ({ ...prev, discount: e.target.value }))}
                        className={getInputClassName(false)}
                        placeholder="0"
                      />
                    </div>
                  )}
                </div>
                <div className="mt-4 space-y-1">
                  <label htmlFor="var-image-upload" className="block text-xs font-medium uppercase tracking-wider text-secondary">
                    Variant image
                  </label>
                  {newVariantImageFile && (
                    <div className="mb-2">
                      <FilePreview file={newVariantImageFile} className="h-24 w-24 rounded-lg border border-border object-cover shadow-sm" />
                    </div>
                  )}
                  <input
                    key={newVariantImageFile ? newVariantImageFile.name : 'no-file'}
                    id="var-image-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="w-full cursor-pointer text-xs text-secondary file:mr-2 file:cursor-pointer file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-xs file:font-medium file:uppercase file:tracking-wider file:text-white hover:file:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
                    onChange={(e) => setNewVariantImageFile(e.target.files?.[0] ?? null)}
                    disabled={variantAdding}
                  />
                  {newVariantImageFile ? (
                    <p className="mt-1 truncate text-[10px] text-tertiary" title={newVariantImageFile.name}>
                      {newVariantImageFile.name}
                    </p>
                  ) : (
                    <p className="mt-1 text-[10px] text-tertiary">JPEG, PNG, GIF, WebP. Optional.</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  disabled={variantAdding}
                  className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary hover:text-secondary disabled:opacity-70"
                >
                  {variantAdding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  {variantAdding ? 'Adding…' : 'Add variant'}
                </button>
              </div>
            </section>

            <div className="flex flex-wrap gap-3 border-t border-border pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {isSubmitting ? 'Saving…' : 'Save changes'}
              </button>
              <Link
                to="/admin/products"
                className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-primary transition-all hover:bg-gray-50"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block">
          <div className="sticky top-24 rounded-xl border border-border bg-gray-50/50 p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-4">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-serif text-lg text-primary">Edit product</h3>
            <p className="mt-2 text-sm leading-relaxed text-secondary/80">
              Change name, slug, price, category, and flags. Each variant has one image; use “Replace” to upload a new image (order matches variant order). Add new variants below.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, CheckCircle, Package, List, Loader2, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as adminProductService from '@/services/adminProductService';
import { getCategories, flattenCategories } from '@/services/categoryService';

/** Renders a preview of the selected file and revokes object URL on change/unmount */
function FilePreview({ file, className = 'h-20 w-20 rounded-lg border border-border object-cover' }) {
  const urlRef = useRef(null);
  const fileRef = useRef(null);
  if (fileRef.current !== file) {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    fileRef.current = file;
    urlRef.current = file ? URL.createObjectURL(file) : null;
  }
  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);
  if (!urlRef.current) return null;
  return <img src={urlRef.current} alt="Preview" className={className} />;
}

const variantSchema = z.object({
  size: z.string().min(1, 'Size is required'),
  color: z.string().min(1, 'Color is required'),
  price: z.coerce.number().min(0, 'Price must be 0 or more'),
  stockQuantity: z.coerce.number().int().min(0, 'Stock must be 0 or more'),
  isActive: z.boolean().optional(),
});

const addProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  slug: z.string().optional(),
  description: z.string().optional().nullable(),
  basePrice: z.coerce.number().min(0, 'Base price must be 0 or more'),
  categoryId: z.coerce.number().int().min(1, 'Category is required'),
  brand: z.string().optional().nullable(),
  material: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  isTrending: z.boolean().optional(),
  variants: z.array(variantSchema).min(1, 'Add at least one variant'),
});

function getInputClassName(error) {
  const base =
    'w-full rounded-none border-b border-border bg-transparent px-3 py-3 text-sm text-primary placeholder-tertiary outline-none transition-colors focus:border-black focus:ring-0';
  const normal = 'border-border focus:border-primary';
  const invalid = 'border-red-500 focus:border-red-500 text-red-600';
  return `${base} ${error ? invalid : normal}`;
}

export default function AddProductPage() {
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdProduct, setCreatedProduct] = useState(null);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  /** One image file per variant by index; null = no image for that variant */
  const [variantImageFiles, setVariantImageFiles] = useState([]);
  const navigate = useNavigate();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(addProductSchema),
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
      variants: [
        { size: '', color: '', price: 0, stockQuantity: 0, isActive: true },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'variants' });

  const setVariantImage = (index, file) => {
    setVariantImageFiles((prev) => {
      const next = [...prev];
      next[index] = file;
      return next;
    });
  };

  useEffect(() => {
    getCategories()
      .then((tree) => {
        const flat = flattenCategories(tree);
        setCategoryOptions(flat);
        if (flat.length > 0) {
          setValue('categoryId', flat[0].id);
        }
      })
      .catch(() => setCategoryOptions([]))
      .finally(() => setCategoriesLoading(false));
  }, [setValue]);

  useEffect(() => {
    const n = fields.length;
    setVariantImageFiles((prev) => {
      if (prev.length === n) return prev;
      if (prev.length < n) return [...prev, ...Array(n - prev.length).fill(null)];
      return prev.slice(0, n);
    });
  }, [fields.length]);

  const onSubmit = async (data) => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const variantCount = data.variants?.length ?? 0;
      const imagesForRequest = Array.from({ length: variantCount }, (_, i) => variantImageFiles[i] ?? null);
      const product = await adminProductService.createProduct(
        {
          ...data,
          description: data.description?.trim() || null,
          slug: data.slug?.trim() || undefined,
          brand: data.brand?.trim() || null,
          material: data.material?.trim() || null,
          variants: data.variants.map((v) => ({
            size: v.size,
            color: v.color,
            price: v.price,
            stockQuantity: v.stockQuantity,
            isActive: v.isActive !== false,
          })),
        },
        imagesForRequest
      );
      const resolved = product?.data ?? product;
      setCreatedProduct(resolved);
      setVariantImageFiles([]);
    } catch (err) {
      setSubmitError(err?.message ?? 'Failed to create product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-12">
      <div>
        <h1 className="font-serif text-xl text-primary">Add Product</h1>
        <p className="mt-0.5 text-xs text-secondary/70">
          Create a new product with variants (size, color, price, stock).
        </p>
      </div>

      <div className="grid gap-12 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-12">
          {createdProduct ? (
            <div className="space-y-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-4 rounded-xl border border-border bg-white p-5"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <CheckCircle className="h-6 w-6 text-primary" aria-hidden />
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-primary">Product created successfully</h2>
                    <p className="text-sm text-secondary">
                      <span className="font-medium text-primary">{createdProduct.name}</span>
                      {createdProduct.slug && (
                        <span className="text-tertiary"> · {createdProduct.slug}</span>
                      )}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>

              <section>
                <div className="mb-6 border-b border-border pb-4">
                  <h2 className="text-lg font-medium text-primary">Product Details</h2>
                </div>
                <div className="rounded-xl border border-border bg-white p-5">
                  <dl className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-0.5">
                      <dt className="text-xs font-medium uppercase tracking-wider text-secondary">Name</dt>
                      <dd className="font-medium text-primary">{createdProduct.name}</dd>
                    </div>
                    {createdProduct.slug && (
                      <div className="space-y-0.5">
                        <dt className="text-xs font-medium uppercase tracking-wider text-secondary">Slug</dt>
                        <dd className="font-mono text-sm text-primary">{createdProduct.slug}</dd>
                      </div>
                    )}
                    <div className="space-y-0.5">
                      <dt className="text-xs font-medium uppercase tracking-wider text-secondary">Base Price</dt>
                      <dd className="font-medium text-primary">
                        {typeof createdProduct.basePrice === 'number'
                          ? createdProduct.basePrice.toLocaleString()
                          : createdProduct.basePrice}
                      </dd>
                    </div>
                    {(createdProduct.categoryName || createdProduct.categorySlug) && (
                      <div className="space-y-0.5">
                        <dt className="text-xs font-medium uppercase tracking-wider text-secondary">Category</dt>
                        <dd className="text-primary">
                          {createdProduct.categoryName ?? createdProduct.categorySlug}
                          {createdProduct.categorySlug && createdProduct.categoryName && (
                            <span className="text-tertiary"> ({createdProduct.categorySlug})</span>
                          )}
                        </dd>
                      </div>
                    )}
                    {createdProduct.brand && (
                      <div className="space-y-0.5">
                        <dt className="text-xs font-medium uppercase tracking-wider text-secondary">Brand</dt>
                        <dd className="text-primary">{createdProduct.brand}</dd>
                      </div>
                    )}
                    {createdProduct.material && (
                      <div className="space-y-0.5">
                        <dt className="text-xs font-medium uppercase tracking-wider text-secondary">Material</dt>
                        <dd className="text-primary">{createdProduct.material}</dd>
                      </div>
                    )}
                    <div className="space-y-0.5">
                      <dt className="text-xs font-medium uppercase tracking-wider text-secondary">Featured</dt>
                      <dd className="text-primary">
                        {createdProduct.featured === true ? 'Yes' : 'No'}
                      </dd>
                    </div>
                    <div className="space-y-0.5">
                      <dt className="text-xs font-medium uppercase tracking-wider text-secondary">New Arrival</dt>
                      <dd className="text-primary">
                        {createdProduct.newArrival === true ? 'Yes' : 'No'}
                      </dd>
                    </div>
                    <div className="space-y-0.5">
                      <dt className="text-xs font-medium uppercase tracking-wider text-secondary">Trending</dt>
                      <dd className="text-primary">
                        {createdProduct.trending === true ? 'Yes' : 'No'}
                      </dd>
                    </div>
                  </dl>
                  {createdProduct.description && (
                    <div className="mt-4 border-t border-border pt-4">
                      <dt className="text-xs font-medium uppercase tracking-wider text-secondary">Description</dt>
                      <dd className="mt-1 text-sm text-primary">{createdProduct.description}</dd>
                    </div>
                  )}
                </div>
              </section>

              {Array.isArray(createdProduct.variants) && createdProduct.variants.length > 0 && (
                <section>
                  <div className="mb-6 border-b border-border pb-4">
                    <h2 className="text-lg font-medium text-primary">
                      Variants ({createdProduct.variants.length})
                    </h2>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-border bg-white">
                    <table className="w-full min-w-[520px] text-left text-sm table-fixed">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="w-20 shrink-0 px-3 py-3 text-xs font-medium uppercase tracking-wider text-secondary whitespace-nowrap">Image</th>
                          <th className="w-24 shrink-0 px-3 py-3 text-xs font-medium uppercase tracking-wider text-secondary whitespace-nowrap">SKU</th>
                          <th className="w-16 shrink-0 px-3 py-3 text-xs font-medium uppercase tracking-wider text-secondary whitespace-nowrap">Size</th>
                          <th className="w-20 shrink-0 px-3 py-3 text-xs font-medium uppercase tracking-wider text-secondary whitespace-nowrap">Color</th>
                          <th className="w-20 shrink-0 px-3 py-3 text-xs font-medium uppercase tracking-wider text-secondary whitespace-nowrap">Price</th>
                          <th className="w-16 shrink-0 px-3 py-3 text-xs font-medium uppercase tracking-wider text-secondary whitespace-nowrap">Stock</th>
                          <th className="w-16 shrink-0 px-3 py-3 text-xs font-medium uppercase tracking-wider text-secondary whitespace-nowrap">Active</th>
                        </tr>
                      </thead>
                      <tbody>
                        {createdProduct.variants.map((v) => (
                          <tr key={v.id ?? v.sku ?? `${v.size}-${v.color}`} className="border-b border-border/50 last:border-0">
                            <td className="w-20 shrink-0 px-3 py-3 align-middle">
                              {v.imageUrl ? (
                                <img src={v.imageUrl} alt="" className="h-10 w-10 rounded-lg border border-border object-cover" />
                              ) : (
                                <span className="text-[10px] text-tertiary">—</span>
                              )}
                            </td>
                            <td className="w-24 shrink-0 px-3 py-3 font-mono text-primary text-xs truncate" title={v.sku ?? ''}>{v.sku ?? '—'}</td>
                            <td className="w-16 shrink-0 px-3 py-3 text-primary">{v.size}</td>
                            <td className="w-20 shrink-0 px-3 py-3 text-primary">{v.color}</td>
                            <td className="w-20 shrink-0 px-3 py-3 text-primary">
                              {typeof v.price === 'number' ? v.price.toLocaleString() : v.price}
                            </td>
                            <td className="w-16 shrink-0 px-3 py-3 text-primary">{v.stockQuantity ?? 0}</td>
                            <td className="w-16 shrink-0 px-3 py-3 text-primary">
                              {v.active === true || v.isActive === true ? 'Yes' : 'No'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/admin/products')}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-secondary"
                >
                  <List className="h-3.5 w-3.5" aria-hidden />
                  Product Management
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreatedProduct(null);
                    setVariantImageFiles([]);
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-primary transition-all hover:bg-gray-50"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                  Add Another Product
                </button>
              </div>
            </div>
          ) : (
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

              {/* Product Details Section */}
              <section>
                <div className="mb-6 border-b border-border pb-4">
                  <h2 className="text-lg font-medium text-primary">Product Details</h2>
                </div>
                <div className="space-y-6">
                  <div className="space-y-1">
                    <label htmlFor="add-product-name" className="block text-xs font-medium uppercase tracking-wider text-secondary">
                      Name <span className="text-primary">*</span>
                    </label>
                    <input
                      id="add-product-name"
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
                    <label htmlFor="add-product-slug" className="block text-xs font-medium uppercase tracking-wider text-secondary">
                      Slug <span className="normal-case tracking-normal text-tertiary">(optional; generated from name if blank)</span>
                    </label>
                    <input
                      id="add-product-slug"
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
                    <label htmlFor="add-product-description" className="block text-xs font-medium uppercase tracking-wider text-secondary">
                      Description
                    </label>
                    <textarea
                      id="add-product-description"
                      rows={3}
                      className={getInputClassName(errors.description)}
                      placeholder="Product description..."
                      {...register('description')}
                    />
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label htmlFor="add-product-basePrice" className="block text-xs font-medium uppercase tracking-wider text-secondary">
                        Base Price <span className="text-primary">*</span>
                      </label>
                      <input
                        id="add-product-basePrice"
                        type="number"
                        step="0.01"
                        min="0"
                        className={getInputClassName(errors.basePrice)}
                        {...register('basePrice')}
                      />
                      {errors.basePrice && (
                        <p className="mt-1 text-xs text-red-500">{errors.basePrice.message}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="add-product-categoryId" className="block text-xs font-medium uppercase tracking-wider text-secondary">
                        Category <span className="text-primary">*</span>
                      </label>
                      <select
                        id="add-product-categoryId"
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
                      <label htmlFor="add-product-brand" className="block text-xs font-medium uppercase tracking-wider text-secondary">
                        Brand
                      </label>
                      <input
                        id="add-product-brand"
                        type="text"
                        className={getInputClassName(errors.brand)}
                        placeholder="e.g. AttireHub"
                        {...register('brand')}
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="add-product-material" className="block text-xs font-medium uppercase tracking-wider text-secondary">
                        Material
                      </label>
                      <input
                        id="add-product-material"
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

              {/* Variants Section */}
              <section>
                <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
                  <h2 className="text-lg font-medium text-primary">Variants</h2>
                  <button
                    type="button"
                    onClick={() => {
                      append({ size: '', color: '', price: 0, stockQuantity: 0, isActive: true });
                      setVariantImageFiles((prev) => [...prev, null]);
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary hover:text-secondary"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Variant
                  </button>
                </div>
                {errors.variants?.message && (
                  <p className="mb-4 text-xs text-red-500">{errors.variants.message}</p>
                )}
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {fields.map((field, index) => (
                      <motion.div
                        key={field.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="rounded-xl border border-border bg-gray-50/50 p-5"
                      >
                        <div className="mb-4 flex items-center justify-between">
                          <span className="text-sm font-medium text-secondary">Variant {index + 1}</span>
                          {fields.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                remove(index);
                                setVariantImageFiles((prev) => prev.filter((_, i) => i !== index));
                              }}
                              className="rounded-full p-2 text-secondary transition-colors hover:bg-red-50 hover:text-red-600"
                              aria-label={`Remove variant ${index + 1}`}
                            >
                              <Trash2 className="h-4 w-4" aria-hidden />
                            </button>
                          )}
                        </div>
                        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                          <div className="space-y-1">
                            <label className="block text-xs font-medium uppercase tracking-wider text-secondary">Size *</label>
                            <input
                              className={getInputClassName(errors.variants?.[index]?.size)}
                              placeholder="e.g. M"
                              {...register(`variants.${index}.size`)}
                            />
                            {errors.variants?.[index]?.size && (
                              <p className="mt-1 text-xs text-red-500">{errors.variants[index].size.message}</p>
                            )}
                          </div>
                          <div className="space-y-1">
                            <label className="block text-xs font-medium uppercase tracking-wider text-secondary">Color *</label>
                            <input
                              className={getInputClassName(errors.variants?.[index]?.color)}
                              placeholder="e.g. Navy"
                              {...register(`variants.${index}.color`)}
                            />
                            {errors.variants?.[index]?.color && (
                              <p className="mt-1 text-xs text-red-500">{errors.variants[index].color.message}</p>
                            )}
                          </div>
                          <div className="space-y-1">
                            <label className="block text-xs font-medium uppercase tracking-wider text-secondary">Price *</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              className={getInputClassName(errors.variants?.[index]?.price)}
                              {...register(`variants.${index}.price`)}
                            />
                            {errors.variants?.[index]?.price && (
                              <p className="mt-1 text-xs text-red-500">{errors.variants[index].price.message}</p>
                            )}
                          </div>
                          <div className="space-y-1">
                            <label className="block text-xs font-medium uppercase tracking-wider text-secondary">Stock *</label>
                            <input
                              type="number"
                              min="0"
                              className={getInputClassName(errors.variants?.[index]?.stockQuantity)}
                              {...register(`variants.${index}.stockQuantity`)}
                            />
                            {errors.variants?.[index]?.stockQuantity && (
                              <p className="mt-1 text-xs text-red-500">{errors.variants[index].stockQuantity.message}</p>
                            )}
                          </div>
                          <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                            <label className="block text-xs font-medium uppercase tracking-wider text-secondary">Variant image</label>
                            {variantImageFiles[index] && (
                              <div className="mb-2">
                                <FilePreview file={variantImageFiles[index]} className="h-24 w-24 rounded-lg border border-border object-cover shadow-sm" />
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/gif,image/webp"
                              className="w-full text-xs text-secondary file:mr-2 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-xs file:font-medium file:text-white file:uppercase file:tracking-wider hover:file:bg-secondary"
                              onChange={(e) => setVariantImage(index, e.target.files?.[0] ?? null)}
                            />
                            {variantImageFiles[index] && (
                              <p className="mt-1 truncate text-[10px] text-tertiary" title={variantImageFiles[index].name}>{variantImageFiles[index].name}</p>
                            )}
                          </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2 pt-2">
                          <input
                            type="checkbox"
                            id={`variant-active-${index}`}
                            className="h-4 w-4 rounded border-border text-primary focus:ring-black"
                            {...register(`variants.${index}.isActive`)}
                          />
                          <label htmlFor={`variant-active-${index}`} className="cursor-pointer select-none text-sm text-primary">
                            Variant active
                          </label>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </section>

              <div className="flex flex-wrap gap-3 border-t border-border pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  {isSubmitting ? 'Creating…' : 'Create Product'}
                </button>
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-primary transition-all hover:bg-gray-50"
                >
                  Cancel
                </Link>
              </div>
            </form>
          )}
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block">
          <div className="sticky top-24 rounded-xl border border-border bg-gray-50/50 p-6">
            <h3 className="font-serif text-lg text-primary">Tips</h3>
            <p className="mt-2 text-sm leading-relaxed text-secondary/80">
              Add at least one variant with size, color, price, and stock. Each variant can have one image (JPEG, PNG, GIF, WebP); order of images matches variant order. Leave slug blank to auto-generate from the product name.
            </p>
            <div className="mt-6 flex items-start gap-3 text-sm text-primary">
              <Lightbulb className="h-5 w-5 shrink-0 text-primary/60" />
              <span className="text-secondary/80">
                Featured, New Arrival, and Trending products may appear on the homepage and collection highlights.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

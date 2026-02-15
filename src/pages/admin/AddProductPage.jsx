import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, CheckCircle, Package, List } from 'lucide-react';
import * as adminProductService from '@/services/adminProductService';
import { getCategories, flattenCategories } from '@/services/categoryService';

const variantSchema = z.object({
  size: z.string().min(1, 'Size is required'),
  color: z.string().min(1, 'Color is required'),
  price: z.coerce.number().min(0, 'Price must be 0 or more'),
  stockQuantity: z.coerce.number().int().min(0, 'Stock must be 0 or more'),
  imageUrl: z.string().optional().nullable(),
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
  imageUrl: z.string().optional().nullable(),
  variants: z.array(variantSchema).min(1, 'Add at least one variant'),
});

function inputClass(error) {
  const base =
    'w-full rounded-lg border bg-quaternary px-4 py-2.5 text-primary placeholder-tertiary outline-none transition-colors focus:ring-2';
  const normal = 'border-border focus:border-secondary focus:ring-secondary/20';
  const invalid = 'border-primary focus:border-primary focus:ring-primary/20';
  return `${base} ${error ? invalid : normal}`;
}

export default function AddProductPage() {
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdProduct, setCreatedProduct] = useState(null);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
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
      imageUrl: '',
      variants: [
        { size: '', color: '', price: 0, stockQuantity: 0, imageUrl: '', isActive: true },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'variants' });

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

  const onSubmit = async (data) => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const product = await adminProductService.createProduct({
        ...data,
        description: data.description?.trim() || null,
        slug: data.slug?.trim() || undefined,
        brand: data.brand?.trim() || null,
        material: data.material?.trim() || null,
        imageUrl: data.imageUrl?.trim() || null,
        variants: data.variants.map((v) => ({
          ...v,
          imageUrl: v.imageUrl?.trim() || null,
        })),
      });
      const resolved = product?.data ?? product;
      setCreatedProduct(resolved);
    } catch (err) {
      setSubmitError(err?.message ?? 'Failed to create product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
          <h1 className="text-2xl font-semibold text-primary">Add product</h1>
          <p className="mt-1 text-sm text-secondary">
            Create a new product with variants (size, color, price, stock).
          </p>

          {createdProduct ? (
            <div className="mt-8 space-y-6">
              <div className="flex items-center gap-3 rounded-xl border border-border bg-quaternary p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle className="h-6 w-6 text-primary" aria-hidden />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-primary">Product created successfully</h2>
                  <p className="text-sm text-secondary">
                    <span className="font-medium text-primary">{createdProduct.name}</span>
                    {createdProduct.slug && (
                      <span className="text-tertiary"> · {createdProduct.slug}</span>
                    )}
                  </p>
                </div>
              </div>

              <section className="rounded-xl border border-border bg-quaternary p-6">
                <h3 className="flex items-center gap-2 text-base font-medium text-primary">
                  <Package className="h-4 w-4" aria-hidden />
                  Product details
                </h3>
                <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wider text-tertiary">Name</dt>
                    <dd className="mt-0.5 font-medium text-primary">{createdProduct.name}</dd>
                  </div>
                  {createdProduct.slug && (
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wider text-tertiary">Slug</dt>
                      <dd className="mt-0.5 font-mono text-sm text-primary">{createdProduct.slug}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wider text-tertiary">Base price</dt>
                    <dd className="mt-0.5 font-medium text-primary">
                      {typeof createdProduct.basePrice === 'number'
                        ? createdProduct.basePrice.toLocaleString()
                        : createdProduct.basePrice}
                    </dd>
                  </div>
                  {(createdProduct.categoryName || createdProduct.categorySlug) && (
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wider text-tertiary">Category</dt>
                      <dd className="mt-0.5 text-primary">
                        {createdProduct.categoryName ?? createdProduct.categorySlug}
                        {createdProduct.categorySlug && createdProduct.categoryName && (
                          <span className="text-tertiary"> ({createdProduct.categorySlug})</span>
                        )}
                      </dd>
                    </div>
                  )}
                  {createdProduct.brand && (
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wider text-tertiary">Brand</dt>
                      <dd className="mt-0.5 text-primary">{createdProduct.brand}</dd>
                    </div>
                  )}
                  {createdProduct.material && (
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wider text-tertiary">Material</dt>
                      <dd className="mt-0.5 text-primary">{createdProduct.material}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wider text-tertiary">Featured</dt>
                    <dd className="mt-0.5 text-primary">
                      {createdProduct.featured === true ? 'Yes' : 'No'}
                    </dd>
                  </div>
                </dl>
                {createdProduct.description && (
                  <div className="mt-4 border-t border-border pt-4">
                    <dt className="text-xs font-medium uppercase tracking-wider text-tertiary">Description</dt>
                    <dd className="mt-1 text-sm text-primary">{createdProduct.description}</dd>
                  </div>
                )}
              </section>

              {Array.isArray(createdProduct.variants) && createdProduct.variants.length > 0 && (
                <section className="rounded-xl border border-border bg-quaternary p-6">
                  <h3 className="flex items-center gap-2 text-base font-medium text-primary">
                    <List className="h-4 w-4" aria-hidden />
                    Variants ({createdProduct.variants.length})
                  </h3>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[400px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="pb-2 pr-4 font-medium text-secondary">SKU</th>
                          <th className="pb-2 pr-4 font-medium text-secondary">Size</th>
                          <th className="pb-2 pr-4 font-medium text-secondary">Color</th>
                          <th className="pb-2 pr-4 font-medium text-secondary">Price</th>
                          <th className="pb-2 pr-4 font-medium text-secondary">Stock</th>
                          <th className="pb-2 font-medium text-secondary">Active</th>
                        </tr>
                      </thead>
                      <tbody>
                        {createdProduct.variants.map((v) => (
                          <tr key={v.id ?? v.sku ?? `${v.size}-${v.color}`} className="border-b border-border/50">
                            <td className="py-2.5 pr-4 font-mono text-primary">{v.sku ?? '—'}</td>
                            <td className="py-2.5 pr-4 text-primary">{v.size}</td>
                            <td className="py-2.5 pr-4 text-primary">{v.color}</td>
                            <td className="py-2.5 pr-4 text-primary">
                              {typeof v.price === 'number' ? v.price.toLocaleString() : v.price}
                            </td>
                            <td className="py-2.5 pr-4 text-primary">{v.stockQuantity ?? 0}</td>
                            <td className="py-2.5 text-primary">
                              {v.active === true || v.isActive === true ? 'Yes' : 'No'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/admin/products')}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-quaternary transition-opacity hover:opacity-90"
                >
                  <List className="h-4 w-4" aria-hidden />
                  Go to product management
                </button>
                <button
                  type="button"
                  onClick={() => setCreatedProduct(null)}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-quaternary px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-tertiary/20"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  Add another product
                </button>
              </div>
            </div>
          ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-8">
            {submitError && (
              <div
                role="alert"
                className="rounded-lg border border-primary bg-primary/10 px-4 py-3 text-sm text-primary"
              >
                {submitError}
              </div>
            )}

            {/* Product details */}
            <section className="rounded-xl border border-border bg-quaternary p-6">
              <h2 className="text-lg font-medium text-primary">Product details</h2>
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-primary">
                    Name <span className="text-primary">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    className={inputClass(errors.name)}
                    placeholder="e.g. Classic Oxford Shirt"
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-primary">{errors.name.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="slug" className="block text-sm font-medium text-primary">
                    Slug <span className="text-tertiary">(optional; generated from name if blank)</span>
                  </label>
                  <input
                    id="slug"
                    type="text"
                    className={inputClass(errors.slug)}
                    placeholder="classic-oxford-shirt"
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
                <div className="flex gap-6">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-border text-primary" {...register('isActive')} />
                    <span className="text-sm font-medium text-primary">Active</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-border text-primary" {...register('isFeatured')} />
                    <span className="text-sm font-medium text-primary">Featured</span>
                  </label>
                </div>
              </div>
            </section>

            {/* Variants */}
            <section className="rounded-xl border border-border bg-quaternary p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-primary">Variants</h2>
                <button
                  type="button"
                  onClick={() =>
                    append({
                      size: '',
                      color: '',
                      price: 0,
                      stockQuantity: 0,
                      imageUrl: '',
                      isActive: true,
                    })
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-quaternary px-3 py-2 text-sm font-medium text-primary hover:bg-tertiary/20"
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  Add variant
                </button>
              </div>
              {errors.variants?.message && (
                <p className="mt-2 text-sm text-primary">{errors.variants.message}</p>
              )}
              <div className="mt-4 space-y-6">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="rounded-lg border border-border p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-medium text-secondary">Variant {index + 1}</span>
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="rounded p-1.5 text-primary hover:bg-tertiary/20"
                          aria-label={`Remove variant ${index + 1}`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      )}
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <label className="block text-xs font-medium text-primary">Size *</label>
                        <input
                          className={inputClass(errors.variants?.[index]?.size)}
                          placeholder="e.g. M"
                          {...register(`variants.${index}.size`)}
                        />
                        {errors.variants?.[index]?.size && (
                          <p className="mt-1 text-xs text-primary">{errors.variants[index].size.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-primary">Color *</label>
                        <input
                          className={inputClass(errors.variants?.[index]?.color)}
                          placeholder="e.g. Navy"
                          {...register(`variants.${index}.color`)}
                        />
                        {errors.variants?.[index]?.color && (
                          <p className="mt-1 text-xs text-primary">{errors.variants[index].color.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-primary">Price *</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className={inputClass(errors.variants?.[index]?.price)}
                          {...register(`variants.${index}.price`)}
                        />
                        {errors.variants?.[index]?.price && (
                          <p className="mt-1 text-xs text-primary">{errors.variants[index].price.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-primary">Stock *</label>
                        <input
                          type="number"
                          min="0"
                          className={inputClass(errors.variants?.[index]?.stockQuantity)}
                          {...register(`variants.${index}.stockQuantity`)}
                        />
                        {errors.variants?.[index]?.stockQuantity && (
                          <p className="mt-1 text-xs text-primary">{errors.variants[index].stockQuantity.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-primary">Image URL</label>
                        <input
                          type="url"
                          className={inputClass(errors.variants?.[index]?.imageUrl)}
                          placeholder="https://..."
                          {...register(`variants.${index}.imageUrl`)}
                        />
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="rounded border-border text-primary"
                          {...register(`variants.${index}.isActive`)}
                        />
                        <span className="text-xs font-medium text-primary">Variant active</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-quaternary transition-opacity hover:opacity-90 disabled:opacity-70"
              >
                {isSubmitting ? 'Creating…' : 'Create product'}
              </button>
              <Link
                to="/admin"
                className="rounded-lg border border-border bg-quaternary px-6 py-2.5 text-sm font-medium text-primary hover:bg-tertiary/20"
              >
                Cancel
              </Link>
            </div>
          </form>
          )}
    </>
  );
}

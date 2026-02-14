import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Package, CheckCircle, Loader2 } from 'lucide-react';
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
  imageUrl: z.string().optional().nullable(),
});

function inputClass(error) {
  const base =
    'w-full rounded-lg border bg-quaternary px-4 py-2.5 text-primary placeholder-tertiary outline-none transition-colors focus:ring-2';
  const normal = 'border-tertiary focus:border-secondary focus:ring-secondary/20';
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
            <div className="flex items-center gap-3 rounded-xl border border-tertiary bg-quaternary p-4">
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
                className="rounded-lg border border-tertiary bg-quaternary px-4 py-2.5 text-sm font-medium text-primary hover:bg-tertiary/20"
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
            Update product details. Variants are managed separately.
          </p>

          {submitError && (
            <div className="mt-6 rounded-lg border border-tertiary bg-quaternary p-4 text-sm text-primary">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-8">
            <section className="rounded-xl border border-tertiary bg-quaternary p-6">
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
                <div className="flex gap-6">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-tertiary text-primary" {...register('isActive')} />
                    <span className="text-sm font-medium text-primary">Active</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-tertiary text-primary" {...register('isFeatured')} />
                    <span className="text-sm font-medium text-primary">Featured</span>
                  </label>
                </div>
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
                className="rounded-lg border border-tertiary bg-quaternary px-6 py-2.5 text-sm font-medium text-primary hover:bg-tertiary/20"
              >
                Cancel
              </Link>
            </div>
          </form>
    </>
  );
}

import { api } from './api';

const ADMIN_PRODUCTS_PATH = '/admin/products';

/**
 * @param {import('axios').AxiosError} error
 * @returns {string}
 */
function getErrorMessage(error) {
  const data = error.response?.data;
  if (data && typeof data === 'object') {
    if (typeof data.message === 'string') return data.message;
    if (typeof data.error === 'string') return data.error;
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      const first = data.errors[0];
      return typeof first === 'string' ? first : (first?.message || first?.defaultMessage) ?? 'Validation failed';
    }
  }
  if (error.response?.status === 401) return 'Unauthorized. Please sign in as admin.';
  if (error.response?.status === 403) return 'You do not have permission to perform this action.';
  if (error.response?.status === 400) return 'Invalid product data. Please check the form.';
  if (error.response?.status === 404) return 'Product or category not found.';
  if (error.response?.status === 409) return 'This slug is already in use by another product.';
  return error.message || 'Something went wrong. Please try again.';
}

/**
 * Variant-specific error messages for updateVariant.
 * @param {import('axios').AxiosError} error
 * @returns {string}
 */
function getVariantErrorMessage(error) {
  const data = error.response?.data;
  if (data && typeof data === 'object') {
    if (typeof data.message === 'string') return data.message;
    if (typeof data.error === 'string') return data.error;
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      const first = data.errors[0];
      return typeof first === 'string' ? first : (first?.message || first?.defaultMessage) ?? 'Validation failed';
    }
  }
  if (error.response?.status === 401) return 'Unauthorized. Please sign in as admin.';
  if (error.response?.status === 403) return 'You do not have permission to perform this action.';
  if (error.response?.status === 400) return 'Invalid variant data. Please check the form.';
  if (error.response?.status === 404) return 'Variant not found or does not belong to this product.';
  if (error.response?.status === 409) return 'This SKU is already in use by another variant.';
  return error.message || 'Failed to update variant. Please try again.';
}

/**
 * Create a new product (admin).
 * @param {{
 *   name: string;
 *   slug?: string;
 *   description?: string | null;
 *   basePrice: number;
 *   categoryId: number;
 *   brand?: string | null;
 *   material?: string | null;
 *   isActive?: boolean;
 *   isFeatured?: boolean;
 *   imageUrl?: string | null;
 *   variants: Array<{
 *     size: string;
 *     color: string;
 *     price: number;
 *     stockQuantity: number;
 *     imageUrl?: string | null;
 *     isActive?: boolean;
 *   }>;
 * }} body
 * @returns {Promise<Record<string, unknown>>} Created product (same shape as GET /products/{slug})
 */
export async function createProduct(body) {
  try {
    const payload = {
      name: body.name,
      basePrice: Number(body.basePrice),
      categoryId: Number(body.categoryId),
      isActive: body.isActive !== false,
      featured: Boolean(body.featured ?? body.isFeatured),
      description: body.description?.trim() || null,
      slug: body.slug?.trim() || undefined,
      brand: body.brand?.trim() || null,
      material: body.material?.trim() || null,
      imageUrl: body.imageUrl?.trim() || null,
      variants: (body.variants || []).map((v) => ({
        size: String(v.size).trim(),
        color: String(v.color).trim(),
        price: Number(v.price),
        stockQuantity: Number(v.stockQuantity) || 0,
        imageUrl: v.imageUrl?.trim() || null,
        isActive: v.isActive !== false,
      })),
    };
    const response = await api.post(ADMIN_PRODUCTS_PATH, payload);
    const data = response?.data ?? response;
    return data;
  } catch (err) {
    throw new Error(getErrorMessage(err));
  }
}

/**
 * Update an existing product (admin). Only sent fields are updated.
 * @param {number} id - Product ID
 * @param {{
 *   name?: string;
 *   slug?: string;
 *   description?: string | null;
 *   basePrice?: number;
 *   categoryId?: number;
 *   brand?: string | null;
 *   material?: string | null;
 *   isActive?: boolean;
 *   isFeatured?: boolean;
 *   featured?: boolean;
 *   isTrending?: boolean;
 *   trending?: boolean;
 *   imageUrl?: string | null;
 * }} body
 * @returns {Promise<Record<string, unknown>>} Updated product (same shape as GET /products/{slug})
 */
export async function updateProduct(id, body) {
  try {
    const payload = {};
    if (body.name !== undefined) payload.name = String(body.name).trim();
    if (body.slug !== undefined) payload.slug = body.slug?.trim() || null;
    if (body.description !== undefined) payload.description = body.description?.trim() || null;
    if (body.basePrice !== undefined) payload.basePrice = Number(body.basePrice);
    if (body.categoryId !== undefined) payload.categoryId = Number(body.categoryId);
    if (body.brand !== undefined) payload.brand = body.brand?.trim() || null;
    if (body.material !== undefined) payload.material = body.material?.trim() || null;
    if (body.isActive !== undefined) payload.isActive = Boolean(body.isActive);
    if (body.featured !== undefined) payload.featured = Boolean(body.featured);
    else if (body.isFeatured !== undefined) payload.featured = Boolean(body.isFeatured);
    if (body.trending !== undefined) payload.trending = Boolean(body.trending);
    else if (body.isTrending !== undefined) payload.trending = Boolean(body.isTrending);
    if (body.imageUrl !== undefined) payload.imageUrl = body.imageUrl?.trim() || null;

    const response = await api.put(`${ADMIN_PRODUCTS_PATH}/${id}`, payload);
    const data = response?.data ?? response;
    return data;
  } catch (err) {
    throw new Error(getErrorMessage(err));
  }
}

/**
 * Update an existing variant (admin). Only sent fields are updated.
 * @param {number} productId - Product ID
 * @param {number} variantId - Variant ID
 * @param {{
 *   sku?: string;
 *   size?: string;
 *   color?: string;
 *   price?: number;
 *   stockQuantity?: number;
 *   imageUrl?: string | null;
 *   isActive?: boolean;
 * }} body
 * @returns {Promise<Record<string, unknown>>} Updated variant (same shape as items in product detail variants[])
 */
export async function updateVariant(productId, variantId, body) {
  try {
    const payload = {};
    if (body.sku !== undefined) payload.sku = body.sku?.trim() ?? null;
    if (body.size !== undefined) payload.size = String(body.size).trim();
    if (body.color !== undefined) payload.color = String(body.color).trim();
    if (body.price !== undefined) payload.price = Number(body.price);
    if (body.stockQuantity !== undefined) payload.stockQuantity = Number(body.stockQuantity) || 0;
    if (body.imageUrl !== undefined) payload.imageUrl = body.imageUrl?.trim() || null;
    if (body.isActive !== undefined) payload.isActive = Boolean(body.isActive);

    const response = await api.put(
      `${ADMIN_PRODUCTS_PATH}/${productId}/variants/${variantId}`,
      payload
    );
    const data = response?.data ?? response;
    return data;
  } catch (err) {
    throw new Error(getVariantErrorMessage(err));
  }
}

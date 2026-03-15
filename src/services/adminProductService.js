import { api } from './api';

const ADMIN_PRODUCTS_PATH = '/admin/products';

const UPLOAD_TIMEOUT = 60_000;

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
 * Build the product JSON payload. No product.imageUrl; variants have no imageUrl (images by index).
 * @param {Record<string, unknown>} body
 * @returns {Record<string, unknown>}
 */
function buildProductPayload(body) {
  return {
    name: body.name,
    basePrice: Number(body.basePrice),
    categoryId: Number(body.categoryId),
    isActive: body.isActive !== false,
    featured: Boolean(body.featured ?? body.isFeatured),
    newArrival: Boolean(body.newArrival ?? body.isNewArrival),
    trending: Boolean(body.trending ?? body.isTrending),
    description: body.description?.trim() || null,
    slug: body.slug?.trim() || undefined,
    brand: body.brand?.trim() || null,
    material: body.material?.trim() || null,
    ...(Array.isArray(body.variants) && {
      variants: body.variants.map((v) => ({
        size: String(v.size).trim(),
        color: String(v.color).trim(),
        price: Number(v.price),
        stockQuantity: Number(v.stockQuantity) || 0,
        isActive: v.isActive !== false,
        discount: Number(v.discount) || 0,
      })),
    }),
  };
}

/**
 * One file per variant by index. Use empty File for "no image / no change".
 * @param {Record<string, unknown>} payload
 * @param {(File | null)[]} variantImageFiles - length must match payload.variants.length
 * @returns {FormData}
 */
function buildFormData(payload, variantImageFiles) {
  const formData = new FormData();
  const productBlob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
  formData.append('product', productBlob);

  const files = Array.isArray(variantImageFiles) ? variantImageFiles : [];
  files.forEach((file) => {
    formData.append('images', file && file.size > 0 ? file : new File([], ''));
  });
  return formData;
}

/**
 * Create a new product with one image per variant (admin).
 * Sends multipart/form-data: { product: JSON blob (no imageUrl), images: one File per variant in order }
 *
 * @param {Record<string, unknown>} body - product + variants (no product.imageUrl; variant image by index)
 * @param {(File | null)[]} [variantImageFiles] - images[i] = file for variants[i]; use null or empty File for no image
 * @returns {Promise<Record<string, unknown>>}
 */
export async function createProduct(body, variantImageFiles = []) {
  try {
    const payload = buildProductPayload(body);
    const formData = buildFormData(payload, variantImageFiles);
    const response = await api.post(ADMIN_PRODUCTS_PATH, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: UPLOAD_TIMEOUT,
    });
    return response?.data ?? response;
  } catch (err) {
    throw new Error(getErrorMessage(err));
  }
}

/**
 * Update an existing product; one image file per variant by index (admin).
 * Sends multipart/form-data: { product: JSON blob (no imageUrl), images: one File per variant in order }
 *
 * @param {number} id
 * @param {Record<string, unknown>} body - no product.imageUrl
 * @param {(File | null)[]} [variantImageFiles] - images[i] = new file for variants[i]; null or empty File = no change
 * @returns {Promise<Record<string, unknown>>}
 */
export async function updateProduct(id, body, variantImageFiles = []) {
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
    if (body.newArrival !== undefined) payload.newArrival = Boolean(body.newArrival);
    else if (body.isNewArrival !== undefined) payload.newArrival = Boolean(body.isNewArrival);
    if (body.trending !== undefined) payload.trending = Boolean(body.trending);
    else if (body.isTrending !== undefined) payload.trending = Boolean(body.isTrending);

    const formData = buildFormData(payload, variantImageFiles);
    const response = await api.put(`${ADMIN_PRODUCTS_PATH}/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: UPLOAD_TIMEOUT,
    });
    return response?.data ?? response;
  } catch (err) {
    throw new Error(getErrorMessage(err));
  }
}

/**
 * Add a new variant to an existing product (admin).
 * @param {number} productId
 * @param {{
 *   size: string;
 *   color: string;
 *   price: number;
 *   stockQuantity: number;
 *   imageUrl?: string | null;
 *   isActive?: boolean;
 * }} body
 * @returns {Promise<Record<string, unknown>>}
 */
export async function addVariant(productId, body) {
  try {
    const payload = {
      size: String(body.size).trim(),
      color: String(body.color).trim(),
      price: Number(body.price),
      stockQuantity: Number(body.stockQuantity) ?? 0,
      imageUrl: body.imageUrl?.trim() || null,
      isActive: body.isActive !== false,
      discount: Number(body.discount) || 0,
    };

    const response = await api.post(`${ADMIN_PRODUCTS_PATH}/${productId}/variants`, payload);
    return response?.data ?? response;
  } catch (err) {
    throw new Error(getVariantErrorMessage(err));
  }
}

/**
 * Update an existing variant (admin).
 * @param {number} productId
 * @param {number} variantId
 * @param {Record<string, unknown>} body
 * @returns {Promise<Record<string, unknown>>}
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
    if (body.discount !== undefined) payload.discount = Number(body.discount) || 0;

    const response = await api.put(
      `${ADMIN_PRODUCTS_PATH}/${productId}/variants/${variantId}`,
      payload
    );
    return response?.data ?? response;
  } catch (err) {
    throw new Error(getVariantErrorMessage(err));
  }
}

/**
 * Delete a product (admin).
 * DELETE /api/v1/admin/products/{id}
 * @param {number} id - Product ID
 * @returns {Promise<void>}
 */
export async function deleteProduct(id) {
  try {
    await api.delete(`${ADMIN_PRODUCTS_PATH}/${id}`);
  } catch (err) {
    throw new Error(getErrorMessage(err));
  }
}

/**
 * Delete a variant (admin).
 * @param {number} productId
 * @param {number} variantId
 * @returns {Promise<void>}
 */
export async function deleteVariant(productId, variantId) {
  try {
    await api.delete(`${ADMIN_PRODUCTS_PATH}/${productId}/variants/${variantId}`);
  } catch (err) {
    throw new Error(getVariantErrorMessage(err));
  }
}

/**
 * Remove the image from a variant (admin).
 * DELETE .../products/{productId}/variants/{variantId}/image
 * @param {number} productId
 * @param {number} variantId
 * @returns {Promise<void>}
 */
export async function deleteVariantImage(productId, variantId) {
  try {
    await api.delete(`${ADMIN_PRODUCTS_PATH}/${productId}/variants/${variantId}/image`);
  } catch (err) {
    throw new Error(getVariantErrorMessage(err));
  }
}

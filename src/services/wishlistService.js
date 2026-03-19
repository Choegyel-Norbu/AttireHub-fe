import { api } from './api';

const WISHLIST_PATH = '/wishlist';

/**
 * Fetch authenticated user's wishlist with full product details.
 * GET /wishlist
 */
export async function getWishlistItems() {
  try {
    const body = await api.get(WISHLIST_PATH);
    const data = body?.data ?? body;
    return Array.isArray(data) ? data : [];
  } catch (err) {
    const message =
      err?.response?.data?.message ??
      err?.message ??
      'Failed to load wishlist.';
    const error = new Error(message);
    error.status = err?.response?.status;
    throw error;
  }
}

/**
 * Add product to authenticated user's wishlist.
 * Backend contract:
 * POST /wishlist
 * { productId: "<uuid|string>" }
 */
export async function addWishlistItem(productId) {
  try {
    const body = await api.post(WISHLIST_PATH, {
      productId: String(productId),
    });
    return body?.data ?? null;
  } catch (err) {
    const message =
      err?.response?.data?.message ??
      err?.message ??
      'Failed to add product to wishlist.';
    const error = new Error(message);
    error.status = err?.response?.status;
    throw error;
  }
}

/**
 * Remove product from authenticated user's wishlist.
 * DELETE /wishlist/{productId}
 */
export async function deleteWishlistItem(productId) {
  try {
    await api.delete(`${WISHLIST_PATH}/${encodeURIComponent(String(productId))}`);
  } catch (err) {
    const message =
      err?.response?.data?.message ??
      err?.message ??
      'Failed to remove product from wishlist.';
    const error = new Error(message);
    error.status = err?.response?.status;
    throw error;
  }
}

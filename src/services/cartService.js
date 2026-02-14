import { api } from './api';

const CART_PATH = '/cart';
const CART_ITEMS_PATH = '/cart/items';

/**
 * @typedef {{
 *   id: number;
 *   variantId: number;
 *   productName: string;
 *   sku: string;
 *   size: string;
 *   color: string;
 *   unitPrice: number;
 *   quantity: number;
 *   totalPrice: number;
 *   imageUrl: string | null;
 *   availableStock: number;
 * }} CartItem
 */

/**
 * @typedef {{
 *   id: number;
 *   items: CartItem[];
 *   subtotal: number;
 *   totalItems: number;
 * }} CartData
 */

/**
 * Get current cart. Requires auth. Returns empty cart shape if 401.
 * @returns {Promise<CartData | null>}
 */
export async function getCart() {
  try {
    const body = await api.get(CART_PATH);
    const data = body?.data ?? body;
    if (!data) return null;
    return {
      id: data.id,
      items: Array.isArray(data.items) ? data.items : [],
      subtotal: Number(data.subtotal) ?? 0,
      totalItems: Number(data.totalItems) ?? 0,
    };
  } catch (err) {
    if (err?.response?.status === 401) return null;
    throw new Error(err?.response?.data?.message ?? err?.message ?? 'Failed to load cart.');
  }
}

/**
 * Add an item to the cart.
 * @param {number} variantId
 * @param {number} [quantity=1]
 * @returns {Promise<CartData>}
 */
export async function addCartItem(variantId, quantity = 1) {
  const body = await api.post(CART_ITEMS_PATH, {
    variantId: Number(variantId),
    quantity: Math.max(1, Number(quantity) || 1),
  });
  if (!body?.data) {
    throw new Error(body?.message ?? 'Failed to add item to cart.');
  }
  const data = body.data;
  return {
    id: data.id,
    items: Array.isArray(data.items) ? data.items : [],
    subtotal: Number(data.subtotal) ?? 0,
    totalItems: Number(data.totalItems) ?? 0,
  };
}

/**
 * Update cart item quantity.
 * @param {number} itemId - Cart line item ID
 * @param {number} quantity
 * @returns {Promise<CartData>}
 */
export async function updateCartItem(itemId, quantity) {
  const body = await api.put(`${CART_ITEMS_PATH}/${itemId}`, {
    quantity: Math.max(0, Number(quantity) || 0),
  });
  if (!body?.data) {
    throw new Error(body?.message ?? 'Failed to update cart.');
  }
  const data = body.data;
  return {
    id: data.id,
    items: Array.isArray(data.items) ? data.items : [],
    subtotal: Number(data.subtotal) ?? 0,
    totalItems: Number(data.totalItems) ?? 0,
  };
}

/**
 * Remove one item from the cart.
 * @param {number} itemId - Cart line item ID
 * @returns {Promise<CartData>}
 */
export async function removeCartItem(itemId) {
  await api.delete(`${CART_ITEMS_PATH}/${itemId}`);
  const body = await api.get(CART_PATH);
  const data = body?.data ?? body;
  return {
    id: data?.id ?? null,
    items: Array.isArray(data?.items) ? data.items : [],
    subtotal: Number(data?.subtotal) ?? 0,
    totalItems: Number(data?.totalItems) ?? 0,
  };
}

/**
 * Clear entire cart.
 * @returns {Promise<void>}
 */
export async function clearCart() {
  await api.delete(CART_PATH);
}

import { useState, useEffect, useCallback } from 'react';
import { getOrders, cancelOrder } from '@/services/orderService';
import { updateOrderStatus } from '@/services/adminOrderService';
import { Link } from 'react-router-dom';
import { Package, Loader2, ChevronLeft, ChevronRight, Eye, XCircle, PackageCheck } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'RETURNED', label: 'Returned' },
];

function formatPrice(value) {
  if (typeof value !== 'number') return '—';
  return Number.isInteger(value)
    ? value.toLocaleString()
    : value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function StatusBadge({ status }) {
  const statusLower = (status || '').toLowerCase();
  const colors =
    statusLower === 'cancelled' || statusLower === 'returned'
      ? 'bg-red-100 text-red-800'
      : statusLower === 'delivered'
        ? 'bg-green-100 text-green-800'
        : statusLower === 'shipped' || statusLower === 'processing'
          ? 'bg-blue-100 text-blue-800'
          : statusLower === 'confirmed'
            ? 'bg-amber-100 text-amber-800'
            : 'bg-tertiary/30 text-primary';
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${colors}`}
      title={status}
    >
      {status || '—'}
    </span>
  );
}

export default function OrdersPage() {
  const { show: showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [last, setLast] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [cancelConfirmOrderNumber, setCancelConfirmOrderNumber] = useState(null);
  const [cancellingOrderNumber, setCancellingOrderNumber] = useState(null);
  const [deliverConfirmOrderNumber, setDeliverConfirmOrderNumber] = useState(null);
  const [deliveringOrderNumber, setDeliveringOrderNumber] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getOrders({
        page,
        size: PAGE_SIZE,
        status: statusFilter.trim() || undefined,
      });
      setOrders(result.content);
      setTotalElements(result.totalElements);
      setTotalPages(result.totalPages);
      setLast(result.last);
    } catch (err) {
      setError(err?.message ?? 'Failed to load orders.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  const canCancelOrder = useCallback((order) => {
    const status = (order?.status ?? '').toString().trim().toUpperCase();
    return status === 'PENDING' || status === 'CONFIRMED';
  }, []);

  const canMarkDelivered = useCallback((order) => {
    const status = (order?.status ?? '').toString().trim().toUpperCase();
    return status === 'SHIPPED';
  }, []);

  const handleCancelOrder = useCallback(async () => {
    if (!cancelConfirmOrderNumber) return;
    setCancellingOrderNumber(cancelConfirmOrderNumber);
    setError(null);
    try {
      await cancelOrder(cancelConfirmOrderNumber);
      setCancelConfirmOrderNumber(null);
      showToast({ message: 'Your order has been cancelled successfully. No further charges will be made.', variant: 'success' });
      await fetchOrders();
    } catch (err) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Failed to cancel order.';
      showToast({ message: msg || 'We couldn\'t cancel this order. It may have already been processed—please contact support if you need help.', variant: 'error' });
    } finally {
      setCancellingOrderNumber(null);
    }
  }, [cancelConfirmOrderNumber, fetchOrders, showToast]);

  const handleMarkDelivered = useCallback(async (orderNumber) => {
    const toConfirm = orderNumber ?? deliverConfirmOrderNumber;
    if (!toConfirm) return;
    setDeliveringOrderNumber(toConfirm);
    setError(null);
    try {
      await updateOrderStatus(toConfirm, 'DELIVERED');
      setDeliverConfirmOrderNumber(null);
      showToast({ message: 'Delivery confirmed. Thank you for confirming you received your order!', variant: 'success' });
      await fetchOrders();
    } catch (err) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Failed to mark order as delivered.';
      showToast({ message: msg || 'We couldn\'t update the delivery status. Please try again or contact support.', variant: 'error' });
    } finally {
      setDeliveringOrderNumber(null);
    }
  }, [deliverConfirmOrderNumber, fetchOrders, showToast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const from = totalElements === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min((page + 1) * PAGE_SIZE, totalElements);

  return (
    <>
      <h1 className="flex items-center gap-2 text-lg font-bold text-primary">
        <Package className="h-5 w-5" aria-hidden />
        My Orders
      </h1>
      <p className="mt-1 text-sm text-secondary">
        View your order history and tracking status.
      </p>

      <section className="mt-6 flex flex-wrap items-center gap-3">
        <label htmlFor="order-status-filter" className="text-sm font-medium text-primary">
          Status
        </label>
        <select
          id="order-status-filter"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(0);
          }}
          className="rounded-lg border border-border bg-quaternary px-3 py-2 text-sm text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          aria-label="Filter by status"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value || 'all'} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </section>

      {error && (
        <div className="mt-6 rounded-lg border border-border bg-quaternary p-4 text-sm text-primary">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-8 flex items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
          <span className="sr-only">Loading orders…</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-8 rounded-xl border border-border bg-quaternary py-16 text-center">
          <Package className="mx-auto h-12 w-12 text-tertiary" aria-hidden />
          <p className="mt-4 font-medium text-primary">No orders yet</p>
          <p className="mt-1 text-sm text-secondary">
            When you place an order, it will appear here.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 space-y-3">
            {orders.map((order) => (
              <div
                key={order.id ?? order.orderNumber}
                className="rounded-xl border border-border bg-quaternary p-4 transition-colors hover:border-border/80"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono font-semibold text-primary">
                      {order.orderNumber ?? `#${order.id}`}
                    </p>
                    <p className="mt-0.5 text-sm text-secondary">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={order.status} />
                    <p className="text-sm font-semibold text-primary">
                      Nu {formatPrice(order.total)} /-
                    </p>
                  </div>
                </div>
                {order.items && order.items.length > 0 && (
                  <p className="mt-3 text-sm text-secondary">
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''} ·{' '}
                    {order.items.map((i) => i.productName ?? i.product_name).filter(Boolean).join(', ') || 'Items'}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Link
                    to={`/account/orders/${encodeURIComponent(order.orderNumber ?? order.id)}`}
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-quaternary px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-tertiary/20 cursor-pointer"
                  >
                    <Eye className="h-4 w-4" aria-hidden />
                    View details
                  </Link>
                  {canCancelOrder(order) && (
                    <button
                      type="button"
                      onClick={() => setCancelConfirmOrderNumber(order.orderNumber ?? String(order.id))}
                      disabled={cancellingOrderNumber != null}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50 cursor-pointer"
                      aria-label={`Cancel order ${order.orderNumber ?? order.id}`}
                    >
                      {cancellingOrderNumber === (order.orderNumber ?? String(order.id)) ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      ) : (
                        <XCircle className="h-4 w-4" aria-hidden />
                      )}
                      Cancel order
                    </button>
                  )}
                  {canMarkDelivered(order) && (
                    <button
                      type="button"
                      onClick={() => setDeliverConfirmOrderNumber(order.orderNumber ?? String(order.id))}
                      disabled={deliveringOrderNumber != null}
                      className="inline-flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 transition-colors hover:bg-green-100 disabled:opacity-50 cursor-pointer"
                      aria-label={`Mark order ${order.orderNumber ?? order.id} as delivered`}
                    >
                      {deliveringOrderNumber === (order.orderNumber ?? String(order.id)) ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      ) : (
                        <PackageCheck className="h-4 w-4" aria-hidden />
                      )}
                      I received it — mark delivered
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
              <p className="text-sm text-secondary">
                Showing {from}–{to} of {totalElements}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-quaternary px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-tertiary/20 disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden />
                  Previous
                </button>
                <span className="px-3 text-sm text-secondary">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={last}
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-quaternary px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-tertiary/20 disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer"
                  aria-label="Next page"
                >
                  Next
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Confirm delivery dialog */}
      {deliverConfirmOrderNumber && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="deliver-confirm-dialog-title"
          aria-describedby="deliver-confirm-dialog-desc"
        >
          <div className="w-full max-w-md rounded-xl border border-border bg-quaternary p-6 shadow-lg">
            <h2 id="deliver-confirm-dialog-title" className="text-lg font-semibold text-primary">
              Confirm delivery
            </h2>
            <p id="deliver-confirm-dialog-desc" className="mt-2 text-sm text-secondary">
              Have you received order <strong className="text-primary">{deliverConfirmOrderNumber}</strong>? 
              Confirm to mark it as delivered.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleMarkDelivered()}
                disabled={deliveringOrderNumber != null}
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:bg-green-700 disabled:opacity-50 cursor-pointer"
              >
                {deliveringOrderNumber ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : null}
                Yes, I received it
              </button>
              <button
                type="button"
                onClick={() => setDeliverConfirmOrderNumber(null)}
                disabled={deliveringOrderNumber != null}
                className="rounded-lg border border-border bg-quaternary px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-tertiary/20 disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel order confirmation */}
      {cancelConfirmOrderNumber && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-order-dialog-title"
          aria-describedby="cancel-order-dialog-desc"
        >
          <div className="w-full max-w-md rounded-xl border border-border bg-quaternary p-6 shadow-lg">
            <h2 id="cancel-order-dialog-title" className="text-lg font-semibold text-primary">
              Cancel order?
            </h2>
            <p id="cancel-order-dialog-desc" className="mt-2 text-sm text-secondary">
              Are you sure you want to cancel order <strong className="text-primary">{cancelConfirmOrderNumber}</strong>?
              This action cannot be undone.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={cancellingOrderNumber != null}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:bg-red-700 disabled:opacity-50 cursor-pointer"
              >
                {cancellingOrderNumber ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : null}
                Yes, cancel order
              </button>
              <button
                type="button"
                onClick={() => setCancelConfirmOrderNumber(null)}
                disabled={cancellingOrderNumber != null}
                className="rounded-lg border border-border bg-quaternary px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-tertiary/20 disabled:opacity-50 cursor-pointer"
              >
                Keep order
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

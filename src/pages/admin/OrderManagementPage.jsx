import { useState, useEffect, useCallback, Fragment } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
  ChevronDown,
  ChevronUp,
  Package,
} from 'lucide-react';
import {
  getAdminOrders,
  updateOrderStatus,
  cancelAdminOrder,
  getErrorMessage,
} from '@/services/adminOrderService';

const PAGE_SIZE = 20;
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

/** Statuses that can be set in the "Update status" dropdown in view details (includes Shipped and Delivered). */
const UPDATE_STATUS_OPTIONS = [
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

function OrderDetailRow({
  order,
  formatPrice,
  formatDate,
  StatusBadge,
  detailError,
  statusUpdating,
  newStatus,
  setNewStatus,
  cancelConfirm,
  setCancelConfirm,
  canChangeStatus,
  updateStatusOptions,
  onUpdateStatus,
  onCancelOrder,
  onClose,
}) {
  return (
    <div className="px-4 py-4 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-3">
        <h3 className="text-sm font-semibold text-primary">Order details</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-medium text-secondary hover:text-primary"
        >
          Close
        </button>
      </div>
      <div className="mt-4 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-secondary">Order number</p>
            <p className="font-mono font-semibold text-primary">{order.orderNumber}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-secondary">Date</p>
            <p className="text-primary">{formatDate(order.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-secondary">Status</p>
            <StatusBadge status={order.status} />
          </div>
          <div>
            <p className="text-xs font-medium text-secondary">Payment</p>
            <p className="text-primary">
              {order.paymentMethod ?? '—'} · {order.paymentStatus ?? '—'}
            </p>
          </div>
        </div>

        {order.notes && (
          <div>
            <p className="text-xs font-medium text-secondary">Notes</p>
            <p className="text-primary">{order.notes}</p>
          </div>
        )}

        <div>
          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
            <Package className="h-4 w-4" aria-hidden />
            Items
          </h4>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-tertiary/10">
                  <th className="py-2 pl-3 pr-2 text-left font-medium text-secondary">Product</th>
                  <th className="py-2 px-2 font-medium text-secondary">SKU</th>
                  <th className="py-2 px-2 font-medium text-secondary">Size</th>
                  <th className="py-2 px-2 font-medium text-secondary">Color</th>
                  <th className="py-2 px-2 font-medium text-secondary">Qty</th>
                  <th className="py-2 pl-2 pr-3 text-right font-medium text-secondary">Total</th>
                </tr>
              </thead>
              <tbody>
                {(order.items || []).map((item) => (
                  <tr
                    key={item.id ?? `${item.sku}-${item.quantity}`}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="py-2 pl-3 pr-2 text-primary">{item.productName ?? '—'}</td>
                    <td className="py-2 px-2 font-mono text-secondary">{item.sku ?? '—'}</td>
                    <td className="py-2 px-2 text-primary">{item.size ?? '—'}</td>
                    <td className="py-2 px-2 text-primary">{item.color ?? '—'}</td>
                    <td className="py-2 px-2 text-primary">{item.quantity ?? 0}</td>
                    <td className="py-2 pl-2 pr-3 text-right font-medium text-primary">
                      Nu {formatPrice(item.totalPrice)} /-
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border-t border-border/50 pt-3">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-secondary">
              <span>Subtotal</span>
              <span>Nu {formatPrice(order.subtotal)} /-</span>
            </div>
            {(order.discount ?? 0) > 0 && (
              <div className="flex justify-between text-secondary">
                <span>Discount</span>
                <span>- Nu {formatPrice(order.discount)} /-</span>
              </div>
            )}
            {(order.shippingCost ?? 0) > 0 && (
              <div className="flex justify-between text-secondary">
                <span>Shipping</span>
                <span>Nu {formatPrice(order.shippingCost)} /-</span>
              </div>
            )}
            {(order.tax ?? 0) > 0 && (
              <div className="flex justify-between text-secondary">
                <span>Tax</span>
                <span>Nu {formatPrice(order.tax)} /-</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-primary">
              <span>Total</span>
              <span>Nu {formatPrice(order.total)} /-</span>
            </div>
          </div>
        </div>

        {canChangeStatus && (
          <div className="space-y-3 border-t border-border/50 pt-4">
            <h4 className="text-sm font-semibold text-primary">Update status</h4>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="rounded-lg border border-border bg-quaternary px-3 py-2 text-sm text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                aria-label="New status"
              >
                {updateStatusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={onUpdateStatus}
                disabled={statusUpdating || newStatus === order.status || !newStatus}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-quaternary transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {statusUpdating ? 'Updating…' : 'Apply'}
              </button>
              {!['CANCELLED', 'RETURNED'].includes((order.status || '').toUpperCase()) && (
                <button
                  type="button"
                  onClick={() => setCancelConfirm(order.orderNumber)}
                  disabled={statusUpdating}
                  className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-800 transition-colors hover:bg-red-100 disabled:opacity-50"
                >
                  Cancel order
                </button>
              )}
            </div>
            {cancelConfirm === order.orderNumber && (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-tertiary/10 p-3">
                <span className="text-sm text-primary">
                  Cancel this order? This action cannot be undone.
                </span>
                <button
                  type="button"
                  onClick={onCancelOrder}
                  disabled={statusUpdating}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Yes, cancel order
                </button>
                <button
                  type="button"
                  onClick={() => setCancelConfirm(null)}
                  className="rounded-lg border border-border bg-quaternary px-3 py-1.5 text-sm font-medium text-primary hover:bg-tertiary/20"
                >
                  No
                </button>
              </div>
            )}
          </div>
        )}

        {detailError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {detailError}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrderManagementPage() {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [last, setLast] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  const [expandedOrderNumber, setExpandedOrderNumber] = useState(null);
  const [detailError, setDetailError] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [cancelConfirm, setCancelConfirm] = useState(null);

  const detailOrder =
    expandedOrderNumber != null
      ? orders.find((o) => (o.orderNumber ?? String(o.id)) === expandedOrderNumber) ?? null
      : null;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAdminOrders({
        page,
        size: PAGE_SIZE,
        status: statusFilter.trim() || undefined,
      });
      setOrders(result.content);
      setTotalElements(result.totalElements);
      setTotalPages(result.totalPages);
      setLast(result.last);
    } catch (err) {
      setError(getErrorMessage(err));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const toggleExpand = (order) => {
    const key = order.orderNumber ?? String(order.id);
    setDetailError(null);
    setCancelConfirm(null);
    if (expandedOrderNumber === key) {
      setExpandedOrderNumber(null);
    } else {
      setExpandedOrderNumber(key);
      const status = (order.status || '').toUpperCase();
      setNewStatus(UPDATE_STATUS_OPTIONS.some((o) => o.value === status) ? status : (order.status || ''));
    }
  };

  const closeDetail = () => {
    setExpandedOrderNumber(null);
    setDetailError(null);
    setCancelConfirm(null);
  };

  const handleUpdateStatus = async () => {
    if (!detailOrder || !newStatus || newStatus === detailOrder.status) return;
    setStatusUpdating(true);
    setDetailError(null);
    try {
      await updateOrderStatus(detailOrder.orderNumber, newStatus);
      setCancelConfirm(null);
      await fetchOrders();
      setNewStatus(newStatus);
    } catch (err) {
      setDetailError(getErrorMessage(err));
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelConfirm || cancelConfirm !== detailOrder?.orderNumber) return;
    setStatusUpdating(true);
    setDetailError(null);
    try {
      await cancelAdminOrder(detailOrder.orderNumber);
      setCancelConfirm(null);
      await fetchOrders();
    } catch (err) {
      setDetailError(getErrorMessage(err));
    } finally {
      setStatusUpdating(false);
    }
  };

  const from = totalElements === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min((page + 1) * PAGE_SIZE, totalElements);

  return (
    <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-lg font-bold text-primary">
                <ShoppingCart className="h-6 w-6" aria-hidden />
                Order management
              </h1>
              <p className="mt-1 text-sm text-secondary">
                View and update customer orders. Use status filters to find orders quickly.
              </p>
            </div>
          </div>

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
              className="rounded-lg border border-border bg-quaternary px-3 py-2 text-sm text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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
          ) : (
            <>
              <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-quaternary">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-tertiary/10">
                      <th className="py-3 pl-4 pr-2 font-medium text-secondary">Order #</th>
                      <th className="py-3 px-2 font-medium text-secondary">Date</th>
                      <th className="py-3 px-2 font-medium text-secondary">Status</th>
                      <th className="py-3 px-2 font-medium text-secondary">Payment</th>
                      <th className="py-3 px-2 font-medium text-secondary">Total</th>
                      <th className="py-3 px-2 font-medium text-secondary">Customer</th>
                      <th className="py-3 pl-2 pr-4 font-medium text-secondary">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-secondary">
                          No orders found.
                        </td>
                      </tr>
                    ) : (
                      orders.map((order) => {
                        const key = order.orderNumber ?? String(order.id);
                        const isExpanded = expandedOrderNumber === key;
                        return (
                          <Fragment key={order.id ?? order.orderNumber}>
                            <tr className="border-b border-border/50 transition-colors hover:bg-tertiary/10">
                              <td className="py-3 pl-4 pr-2 font-mono font-medium text-primary">
                                {order.orderNumber ?? `#${order.id}`}
                              </td>
                              <td className="py-3 px-2 text-secondary">
                                {formatDate(order.createdAt)}
                              </td>
                              <td className="py-3 px-2">
                                <StatusBadge status={order.status} />
                              </td>
                              <td className="py-3 px-2 text-primary">
                                {order.paymentStatus ?? order.paymentMethod ?? '—'}
                              </td>
                              <td className="py-3 px-2 font-medium text-primary">
                                Nu {formatPrice(order.total)} /-
                              </td>
                              <td className="py-3 px-2 text-secondary">
                                {order.customerEmail ?? (order.userId != null ? `User #${order.userId}` : '—')}
                              </td>
                              <td className="py-3 pl-2 pr-4">
                                <button
                                  type="button"
                                  onClick={() => toggleExpand(order)}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-quaternary px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-tertiary/20"
                                  aria-expanded={isExpanded}
                                  aria-label={isExpanded ? 'Collapse order details' : 'View order details'}
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4" aria-hidden />
                                  ) : (
                                    <Eye className="h-4 w-4" aria-hidden />
                                  )}
                                  {isExpanded ? 'Hide' : 'View'}
                                </button>
                              </td>
                            </tr>
                            {isExpanded && order && (
                              <tr className="border-b border-border/50 bg-tertiary/5">
                                <td colSpan={7} className="p-0 align-top">
                                  <OrderDetailRow
                                    order={order}
                                    formatPrice={formatPrice}
                                    formatDate={formatDate}
                                    StatusBadge={StatusBadge}
                                    detailError={detailError}
                                    statusUpdating={statusUpdating}
                                    newStatus={newStatus}
                                    setNewStatus={setNewStatus}
                                    cancelConfirm={cancelConfirm}
                                    setCancelConfirm={setCancelConfirm}
                                    canChangeStatus={
                                      !['CANCELLED', 'RETURNED'].includes(
                                        (order.status || '').toUpperCase()
                                      )
                                    }
                                    updateStatusOptions={UPDATE_STATUS_OPTIONS}
                                    onUpdateStatus={handleUpdateStatus}
                                    onCancelOrder={handleCancelOrder}
                                    onClose={closeDetail}
                                  />
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
                  <p className="text-sm text-secondary">
                    Showing {from}–{to} of {totalElements}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-quaternary px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-tertiary/20 disabled:opacity-50"
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
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-quaternary px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-tertiary/20 disabled:opacity-50"
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
    </>
  );
}

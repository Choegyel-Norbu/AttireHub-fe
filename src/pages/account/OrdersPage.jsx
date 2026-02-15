import { useState, useEffect, useCallback } from 'react';
import { getOrders } from '@/services/orderService';
import { Link } from 'react-router-dom';
import { Package, Loader2, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

const PAGE_SIZE = 10;

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
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [last, setLast] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getOrders({ page, size: PAGE_SIZE });
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
  }, [page]);

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
                <div className="mt-3">
                  <Link
                    to={`/account/orders/${encodeURIComponent(order.orderNumber ?? order.id)}`}
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-quaternary px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-tertiary/20"
                  >
                    <Eye className="h-4 w-4" aria-hidden />
                    View details
                  </Link>
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
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-quaternary px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-tertiary/20 disabled:opacity-50 disabled:hover:bg-transparent"
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
                  className="inline-flex items-center gap-1 rounded-lg border border-border bg-quaternary px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-tertiary/20 disabled:opacity-50 disabled:hover:bg-transparent"
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

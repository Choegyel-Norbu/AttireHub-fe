import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getOrderByNumber } from '@/services/orderService';
import { Package, Loader2, ArrowLeft } from 'lucide-react';

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
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${colors}`}>
      {status || '—'}
    </span>
  );
}

export default function OrderDetailPage() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderNumber) {
      setError('Order number is missing.');
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    getOrderByNumber(orderNumber)
      .then((data) => {
        if (!cancelled) setOrder(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message ?? 'Failed to load order.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
        <span className="sr-only">Loading order…</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <>
        <p className="text-primary">{error ?? 'Order not found.'}</p>
        <Link
          to="/account/orders"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-secondary hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to orders
        </Link>
      </>
    );
  }

  const items = order.items ?? [];
  const total = order.total ?? 0;

  return (
    <>
      <Link
        to="/account/orders"
        className="inline-flex items-center gap-2 text-sm font-medium text-secondary hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to orders
      </Link>
      <div className="mt-6 rounded-xl border border-border bg-quaternary p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-lg font-bold text-primary">
              <Package className="h-5 w-5" aria-hidden />
              Order {order.orderNumber ?? order.id}
            </h1>
            <p className="mt-1 text-sm text-secondary">{formatDate(order.createdAt ?? order.created_at)}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>

        {items.length > 0 && (
          <div className="mt-6 border-t border-border pt-4">
            <h2 className="text-sm font-semibold text-primary">Items</h2>
            <ul className="mt-3 space-y-3">
              {items.map((item, idx) => (
                <li
                  key={item.id ?? idx}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="font-medium text-primary">
                      {item.productName ?? item.product_name ?? 'Product'}
                    </p>
                    <p className="text-sm text-secondary">
                      {[item.size, item.color].filter(Boolean).join(' · ')}
                      {item.sku && ` · ${item.sku}`}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium text-primary">
                      Qty {item.quantity ?? 0} × Nu {formatPrice(item.unitPrice ?? item.unit_price)} = Nu {formatPrice(item.totalPrice ?? item.total_price)} /-
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 border-t border-border pt-4 text-right">
          <p className="text-base font-semibold text-primary">
            Total: Nu {formatPrice(total)} /-
          </p>
        </div>
      </div>
    </>
  );
}

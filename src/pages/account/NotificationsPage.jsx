import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/services/notificationService';
import { Bell, Loader2, Check, CheckCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const PAGE_SIZE = 50;

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

/**
 * Resolves the URL for a notification based on referenceType and referenceId.
 * @param {string} referenceType
 * @param {string} referenceId
 * @returns {string | null}
 */
function getNotificationLink(referenceType, referenceId) {
  if (!referenceType || !referenceId) return null;
  if (referenceType === 'ORDER') {
    return `/account/orders/${encodeURIComponent(referenceId)}`;
  }
  return null;
}

function isAdmin(user) {
  return user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN';
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [markingId, setMarkingId] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        size: PAGE_SIZE,
      };
      const result = await getNotifications(params);
      setNotifications(result.content);
    } catch (err) {
      setError(err?.message ?? 'Failed to load notifications.');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkRead = async (notification) => {
    if (notification.read) return;
    setMarkingId(notification.id);
    try {
      await markNotificationRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
      );
      window.dispatchEvent(new CustomEvent('notifications-updated'));
    } catch (err) {
      setError(err?.message ?? 'Failed to mark as read.');
    } finally {
      setMarkingId(null);
    }
  };

  const handleMarkAllRead = async () => {
    const unreadCount = notifications.filter((n) => !n.read).length;
    if (unreadCount === 0) return;
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      window.dispatchEvent(new CustomEvent('notifications-updated'));
    } catch (err) {
      setError(err?.message ?? 'Failed to mark all as read.');
    } finally {
      setMarkingAll(false);
    }
  };

  const hasUnread = notifications.some((n) => !n.read);
  const isAdminUser = isAdmin(user);

  return (
    <>
      <h1 className="flex items-center gap-2 text-lg font-bold text-primary">
        <Bell className="h-5 w-5" aria-hidden />
        Notifications
      </h1>
      <p className="mt-1 text-sm text-secondary">
        Order updates and promotions. Tap a notification to open the related order.
      </p>

      {hasUnread && (
        <section className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="ml-auto inline-flex items-center gap-2 rounded-lg border border-border bg-quaternary px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-tertiary/20 disabled:opacity-50"
            aria-label="Mark all as read"
          >
            {markingAll ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <CheckCheck className="h-4 w-4" aria-hidden />
            )}
            Mark all as read
          </button>
        </section>
      )}

      {error && (
        <div className="mt-6 rounded-lg border border-border bg-quaternary p-4 text-sm text-primary">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-8 flex items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
          <span className="sr-only">Loading notifications…</span>
        </div>
      ) : notifications.length === 0 ? (
        <div className="mt-8 rounded-xl border border-border bg-quaternary py-16 text-center">
          <Bell className="mx-auto h-12 w-12 text-tertiary" aria-hidden />
          <p className="mt-4 font-medium text-primary">No notifications</p>
          <p className="mt-1 text-sm text-secondary">
            When you get order updates or promos, they will appear here.
          </p>
        </div>
      ) : (
        <>
          <ul className="mt-6 space-y-3" aria-label="Notification list">
            {notifications.map((notification) => {
              const link = isAdminUser
                ? '/admin/orders'
                : getNotificationLink(
                    notification.referenceType,
                    notification.referenceId
                  );
              const content = (
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p
                      className={`font-medium text-primary ${notification.read ? '' : 'font-semibold'}`}
                    >
                      {notification.title}
                    </p>
                    <p className="mt-0.5 text-sm text-secondary">
                      {notification.message}
                    </p>
                    <p className="mt-1 text-xs text-tertiary">
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.read && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleMarkRead(notification);
                      }}
                      disabled={markingId === notification.id}
                      className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-quaternary px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-tertiary/20 disabled:opacity-50"
                      aria-label={`Mark "${notification.title}" as read`}
                    >
                      {markingId === notification.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                      ) : (
                        <Check className="h-3.5 w-3.5" aria-hidden />
                      )}
                      Mark read
                    </button>
                  )}
                </div>
              );

              return (
                <li key={notification.id}>
                  {link ? (
                    <Link
                      to={link}
                      className={`block rounded-xl border border-border bg-quaternary p-4 transition-colors hover:border-border/80 ${
                        notification.read ? 'opacity-90' : ''
                      }`}
                      onClick={() => handleMarkRead(notification)}
                    >
                      {content}
                    </Link>
                  ) : (
                    <div
                      className={`rounded-xl border border-border bg-quaternary p-4 ${
                        notification.read ? 'opacity-90' : ''
                      }`}
                    >
                      {content}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </>
  );
}

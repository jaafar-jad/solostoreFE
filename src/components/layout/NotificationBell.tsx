'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { connectSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/authStore';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  icon: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();
  const { pushState, subscribe, unsubscribe } = usePushNotifications();

  // ── Unread count (polled every 60 s as fallback) ───────────────────────────
  const { data: countData } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: async () => {
      const { data } = await api.get('/notifications/unread-count');
      return (data.data?.count as number) ?? 0;
    },
    enabled: isLoggedIn,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  // ── Recent 10 for dropdown ─────────────────────────────────────────────────
  const { data: notifsData, refetch: refetchNotifs } = useQuery({
    queryKey: ['notifications-recent'],
    queryFn: async () => {
      const { data } = await api.get('/notifications?page=1');
      return (data.data?.notifications as Notification[]) ?? [];
    },
    enabled: isLoggedIn && open,
    staleTime: 30_000,
  });

  const unreadCount = countData ?? 0;
  const notifications = notifsData ?? [];

  // ── Socket listener — real-time in-tab delivery ────────────────────────────
  useEffect(() => {
    if (!isLoggedIn) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const socket = connectSocket(token);

    const handleNew = (notif: Notification) => {
      // Update in-app badge + dropdown list immediately
      queryClient.setQueryData<number>(['notifications-unread-count'], (prev) => (prev ?? 0) + 1);
      queryClient.setQueryData<Notification[]>(['notifications-recent'], (prev) =>
        prev ? [notif, ...prev] : [notif]
      );

      // Show a native browser notification when the tab is in the background
      // (Notification.permission === 'granted' means the user already enabled push or
      //  browser notifications via the Enable push button)
      if (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        (window.Notification as typeof Notification).permission === 'granted' &&
        document.visibilityState !== 'visible'
      ) {
        try {
          const n = new window.Notification(notif.title, {
            body: notif.message,
            icon: '/pwa-icon.svg',
            tag: notif._id,
          });
          n.onclick = () => { window.focus(); n.close(); };
        } catch {
          // Some browsers (e.g. Safari) may throw — silently ignore
        }
      }
    };

    socket.on('notification:new', handleNew);
    return () => { socket.off('notification:new', handleNew); };
  }, [isLoggedIn, queryClient]);

  // ── Close on outside click ─────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleOpen = () => {
    setOpen((v) => !v);
    if (!open) refetchNotifs();
  };

  const markRead = useCallback(async (id: string) => {
    await api.patch(`/notifications/${id}/read`);
    queryClient.setQueryData<Notification[]>(['notifications-recent'], (prev) =>
      prev ? prev.map((n) => (n._id === id ? { ...n, read: true } : n)) : prev
    );
    queryClient.setQueryData<number>(['notifications-unread-count'], (prev) =>
      Math.max(0, (prev ?? 0) - 1)
    );
  }, [queryClient]);

  const markAllRead = useCallback(async () => {
    await api.patch('/notifications/read-all');
    queryClient.setQueryData<Notification[]>(['notifications-recent'], (prev) =>
      prev ? prev.map((n) => ({ ...n, read: true })) : prev
    );
    queryClient.setQueryData<number>(['notifications-unread-count'], 0);
  }, [queryClient]);

  const handleClick = async (notif: Notification) => {
    if (!notif.read) await markRead(notif._id);
    setOpen(false);
    if (notif.link) router.push(notif.link);
  };

  if (!isLoggedIn) return null;

  // ── Push button label / state ───────────────────────────────────────────────
  const pushLabel =
    pushState === 'subscribed'  ? '🔔 Push on'   :
    pushState === 'denied'      ? '🚫 Blocked'    :
    pushState === 'unsupported' ? null              :
    '🔕 Enable push';

  const pushTitle =
    pushState === 'subscribed'  ? 'Click to disable background push notifications' :
    pushState === 'denied'      ? 'Push blocked in browser settings'               :
    'Enable background push notifications (works even when browser is closed)';

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* ── Bell button ─────────────────────────────────────────────────────── */}
      <button
        onClick={handleOpen}
        aria-label="Notifications"
        style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--color-text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '36px',
          height: '36px',
          borderRadius: 'var(--radius-md)',
          transition: 'background var(--transition-fast)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              minWidth: '16px',
              height: '16px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-error)',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 3px',
              lineHeight: 1,
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown ────────────────────────────────────────────────────────── */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '360px',
            maxWidth: 'calc(100vw - 24px)',
            background: 'var(--color-white)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-xl)',
            zIndex: 'var(--z-modal)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--space-4) var(--space-5)',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <span
              style={{
                fontSize: 'var(--text-body-sm)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text-primary)',
              }}
            >
              Notifications
              {unreadCount > 0 && (
                <span
                  style={{
                    marginLeft: 'var(--space-2)',
                    background: 'var(--color-primary-100)',
                    color: 'var(--color-primary)',
                    borderRadius: 'var(--radius-full)',
                    padding: '1px 7px',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 700,
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </span>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-primary)',
                    fontWeight: 'var(--font-weight-medium)',
                    padding: 'var(--space-1) var(--space-2)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => { setOpen(false); router.push('/dashboard/notifications'); }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-text-muted)',
                  fontWeight: 'var(--font-weight-medium)',
                  padding: 'var(--space-1) var(--space-2)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                View all
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: 'var(--space-10)',
                  textAlign: 'center',
                  color: 'var(--color-text-muted)',
                  fontSize: 'var(--text-body-sm)',
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: 'var(--space-2)' }}>🔔</div>
                No notifications yet
              </div>
            ) : (
              notifications.slice(0, 10).map((notif) => (
                <button
                  key={notif._id}
                  onClick={() => handleClick(notif)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 'var(--space-3)',
                    padding: 'var(--space-3) var(--space-5)',
                    background: notif.read ? 'transparent' : 'var(--color-primary-50)',
                    border: 'none',
                    borderBottom: '1px solid var(--color-border)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface)')}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = notif.read ? 'transparent' : 'var(--color-primary-50)')
                  }
                >
                  <span style={{ fontSize: '20px', flexShrink: 0, marginTop: '2px' }}>{notif.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 'var(--text-body-sm)',
                        fontWeight: notif.read ? 'var(--font-weight-medium)' : 'var(--font-weight-semibold)',
                        color: 'var(--color-text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {notif.title}
                    </p>
                    <p
                      style={{
                        margin: '2px 0 0',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--color-text-secondary)',
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {notif.message}
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                      {timeAgo(notif.createdAt)}
                    </p>
                  </div>
                  {!notif.read && (
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--color-primary)',
                        flexShrink: 0,
                        marginTop: '6px',
                      }}
                    />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer — push toggle + see all link */}
          <div
            style={{
              padding: 'var(--space-3) var(--space-5)',
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {/* Push notification toggle */}
            {pushLabel && (
              <button
                onClick={pushState === 'subscribed' ? unsubscribe : subscribe}
                disabled={pushState === 'denied' || pushState === 'unsupported'}
                title={pushTitle}
                style={{
                  background: 'none',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: pushState === 'denied' ? 'not-allowed' : 'pointer',
                  fontSize: 'var(--text-xs)',
                  color:
                    pushState === 'subscribed'
                      ? 'var(--color-success)'
                      : pushState === 'denied'
                      ? 'var(--color-text-muted)'
                      : 'var(--color-primary)',
                  fontWeight: 'var(--font-weight-medium)',
                  padding: 'var(--space-1) var(--space-2)',
                  opacity: pushState === 'unsupported' ? 0.5 : 1,
                }}
              >
                {pushLabel}
              </button>
            )}

            <button
              onClick={() => { setOpen(false); router.push('/dashboard/notifications'); }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-primary)',
                fontWeight: 'var(--font-weight-semibold)',
                marginLeft: 'auto',
              }}
            >
              See all →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

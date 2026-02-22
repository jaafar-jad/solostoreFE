'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

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

// Label map for admin notification types
const TYPE_LABELS: Record<string, string> = {
  new_user: 'New User',
  app_submitted_review: 'App Submitted',
  app_auto_published: 'Auto-Published',
  build_complete_admin: 'Build Complete',
  build_failed_admin: 'Build Failed',
  payment_received: 'Payment',
  new_review_admin: 'New Review',
};

function typeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type.replace(/_/g, ' ');
}

function typeColor(type: string): string {
  if (type.includes('failed')) return 'var(--color-error)';
  if (type === 'new_user') return 'var(--color-primary)';
  if (type.includes('complete') || type.includes('published')) return 'var(--color-success)';
  return 'var(--color-text-muted)';
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function AdminNotificationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [page, setPage] = useState(1);

  const queryKey = ['admin-notifications-page', filter, page];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page) });
      if (filter === 'unread') params.set('unread', 'true');
      const { data } = await api.get(`/notifications?${params}`);
      return data.data as {
        notifications: Notification[];
        unreadCount: number;
        page: number;
        totalPages: number;
        total: number;
      };
    },
    staleTime: 30_000,
  });

  const notifications = data?.notifications ?? [];
  const totalPages = data?.totalPages ?? 1;
  const unreadCount = data?.unreadCount ?? 0;

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications-page'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-recent'] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications-page'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-recent'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications-page'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-recent'] });
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: () => api.delete('/notifications/clear-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications-page'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-recent'] });
    },
  });

  const handleClick = async (notif: Notification) => {
    if (!notif.read) await markReadMutation.mutateAsync(notif._id);
    if (notif.link) router.push(notif.link);
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      {/* Page header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 'var(--text-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-text-primary)',
              margin: 0,
            }}
          >
            Platform Notifications
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 'var(--text-body-sm)', color: 'var(--color-text-muted)' }}>
            All platform events — new users, builds, reviews, payments
            {unreadCount > 0 && ` · ${unreadCount} unread`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
              className="btn btn-secondary btn-sm"
            >
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Clear all admin notifications? This cannot be undone.')) {
                  clearAllMutation.mutate();
                }
              }}
              disabled={clearAllMutation.isPending}
              className="btn btn-ghost btn-sm"
              style={{ color: 'var(--color-error)' }}
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Summary chips */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-2)',
          flexWrap: 'wrap',
          marginBottom: 'var(--space-5)',
        }}
      >
        {(['all', 'unread'] as const).map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1); }}
            style={{
              background: filter === f ? 'var(--color-primary)' : 'var(--color-surface)',
              color: filter === f ? '#fff' : 'var(--color-text-secondary)',
              border: '1px solid',
              borderColor: filter === f ? 'var(--color-primary)' : 'var(--color-border)',
              borderRadius: 'var(--radius-full)',
              padding: 'var(--space-1) var(--space-4)',
              fontSize: 'var(--text-body-sm)',
              fontWeight: 'var(--font-weight-medium)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            {f === 'all' ? 'All notifications' : 'Unread'}
            {f === 'unread' && unreadCount > 0 && (
              <span
                style={{
                  background: filter === 'unread' ? 'rgba(255,255,255,0.25)' : 'var(--color-primary)',
                  color: '#fff',
                  borderRadius: 'var(--radius-full)',
                  padding: '0 6px',
                  fontSize: '10px',
                  fontWeight: 700,
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div
        style={{
          background: 'var(--color-white)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      >
        {isLoading ? (
          <div style={{ padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: '80px', borderRadius: 'var(--radius-md)' }} />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: 'var(--space-16)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <div style={{ fontSize: '48px', marginBottom: 'var(--space-4)' }}>📋</div>
            <p
              style={{
                fontSize: 'var(--text-lg)',
                fontWeight: 'var(--font-weight-semibold)',
                margin: '0 0 var(--space-2)',
                color: 'var(--color-text-primary)',
              }}
            >
              {filter === 'unread' ? 'No unread notifications' : 'No platform notifications yet'}
            </p>
            <p style={{ margin: 0, fontSize: 'var(--text-body-sm)' }}>
              {filter === 'unread'
                ? 'All caught up!'
                : 'Platform events like new registrations, builds, and app reviews will appear here.'}
            </p>
          </div>
        ) : (
          notifications.map((notif, idx) => (
            <div
              key={notif._id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--space-4)',
                padding: 'var(--space-4) var(--space-5)',
                borderBottom: idx < notifications.length - 1 ? '1px solid var(--color-border)' : 'none',
                background: notif.read ? 'transparent' : 'var(--color-primary-50)',
              }}
            >
              {/* Icon */}
              <span style={{ fontSize: '22px', flexShrink: 0, marginTop: '2px' }}>{notif.icon}</span>

              {/* Content */}
              <div
                style={{ flex: 1, minWidth: 0, cursor: notif.link ? 'pointer' : 'default' }}
                onClick={() => notif.link && handleClick(notif)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '2px', flexWrap: 'wrap' }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 'var(--text-body-sm)',
                      fontWeight: notif.read ? 'var(--font-weight-medium)' : 'var(--font-weight-semibold)',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    {notif.title}
                  </p>
                  {/* Type chip */}
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '1px 7px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--color-surface)',
                      color: typeColor(notif.type),
                      border: '1px solid var(--color-border)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      flexShrink: 0,
                    }}
                  >
                    {typeLabel(notif.type)}
                  </span>
                  {!notif.read && (
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--color-primary)',
                        flexShrink: 0,
                      }}
                    />
                  )}
                </div>
                <p
                  style={{
                    margin: '0 0 var(--space-1)',
                    fontSize: 'var(--text-body-sm)',
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.5,
                  }}
                >
                  {notif.message}
                </p>
                <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                  {timeAgo(notif.createdAt)}
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 'var(--space-1)', flexShrink: 0 }}>
                {!notif.read && (
                  <button
                    onClick={() => markReadMutation.mutate(notif._id)}
                    title="Mark as read"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--color-primary)',
                      padding: 'var(--space-1)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={() => deleteMutation.mutate(notif._id)}
                  title="Delete"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-text-muted)',
                    padding: 'var(--space-1)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4h6v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-2)',
            marginTop: 'var(--space-6)',
          }}
        >
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn btn-secondary btn-sm"
          >
            Previous
          </button>
          <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-muted)' }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="btn btn-secondary btn-sm"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

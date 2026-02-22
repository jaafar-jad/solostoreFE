'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import api from '@/lib/api';
import type { App } from '@/types/app.types';

interface PopulatedApp extends Omit<App, 'developer'> {
  developer: { _id: string; username: string; email: string };
}

function statusBadge(status: App['status']) {
  const map: Record<App['status'], { label: string; cls: string }> = {
    draft: { label: 'Draft', cls: 'badge-gray' },
    building: { label: 'Building', cls: 'badge-blue' },
    pending_review: { label: 'In Review', cls: 'badge-yellow' },
    published: { label: 'Published', cls: 'badge-green' },
    rejected: { label: 'Rejected', cls: 'badge-red' },
    unpublished: { label: 'Unpublished', cls: 'badge-gray' },
  };
  const { label, cls } = map[status] ?? { label: status, cls: 'badge-gray' };
  return <span className={`badge ${cls}`}>{label}</span>;
}

const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: '', label: 'All Apps' },
  { value: 'pending_review', label: 'In Review' },
  { value: 'published', label: 'Published' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'building', label: 'Building' },
  { value: 'draft', label: 'Draft' },
];

function AdminAppsContent() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') ?? '');
  const [rejectModal, setRejectModal] = useState<{ appId: string; appName: string } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);

  const { data: apps = [], isLoading } = useQuery<PopulatedApp[]>({
    queryKey: ['admin-apps', statusFilter],
    queryFn: async () => {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const { data } = await api.get(`/admin/apps${params}`);
      return data.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/apps/${id}/approve`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-apps'] }),
    onSettled: () => setActionId(null),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.patch(`/admin/apps/${id}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-apps'] });
      setRejectModal(null);
      setRejectReason('');
    },
    onSettled: () => setActionId(null),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/apps/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-apps'] }),
    onSettled: () => setActionId(null),
  });

  return (
    <div>
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ marginBottom: 'var(--space-1)' }}>App Management</h1>
        <p>Review submitted apps and manage published content.</p>
      </div>

      {/* Status filter tabs */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-2)',
          flexWrap: 'wrap',
          marginBottom: 'var(--space-6)',
        }}
      >
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            style={{
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-full)',
              fontSize: 'var(--text-body-sm)',
              fontWeight: statusFilter === f.value ? 600 : 400,
              border: '1.5px solid',
              borderColor: statusFilter === f.value ? 'var(--color-primary)' : 'var(--color-border)',
              background: statusFilter === f.value ? 'var(--color-primary-50)' : 'var(--color-white)',
              color: statusFilter === f.value ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Reject modal */}
      {rejectModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 'var(--z-modal)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-4)',
          }}
        >
          <div className="glass-card-solid" style={{ padding: 'var(--space-6)', maxWidth: '480px', width: '100%' }}>
            <h3 style={{ marginBottom: 'var(--space-2)' }}>Reject App</h3>
            <p style={{ marginBottom: 'var(--space-4)', color: 'var(--color-text-secondary)' }}>
              Provide a reason for rejecting &quot;{rejectModal.appName}&quot;. This will be shown to the developer.
            </p>
            <textarea
              className="input-field"
              rows={4}
              placeholder="Reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              style={{ marginBottom: 'var(--space-4)', resize: 'vertical' }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button
                className="btn-danger"
                onClick={() => {
                  if (!rejectReason.trim()) return;
                  setActionId(rejectModal.appId);
                  rejectMutation.mutate({ id: rejectModal.appId, reason: rejectReason.trim() });
                }}
                disabled={!rejectReason.trim() || rejectMutation.isPending}
                style={{ flex: 1 }}
              >
                {rejectMutation.isPending ? 'Rejecting...' : 'Reject App'}
              </button>
              <button className="btn-ghost" onClick={() => { setRejectModal(null); setRejectReason(''); }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="glass-card-solid" style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Loading apps...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['App', 'Developer', 'Category', 'Status', 'Downloads', 'Submitted', 'Actions'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: 'var(--space-4) var(--space-5)',
                        textAlign: 'left',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 600,
                        color: 'var(--color-text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {apps.map((app) => (
                  <tr key={app._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: 'var(--radius-md)',
                            background: app.splashColor || 'var(--color-primary-100)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            color: 'white',
                            fontSize: '14px',
                            flexShrink: 0,
                          }}
                        >
                          {app.name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-text-primary)', fontSize: 'var(--text-body-sm)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {app.name}
                          </p>
                          <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                            v{app.version}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                      <div>
                        <p style={{ margin: 0, fontSize: 'var(--text-body-sm)', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                          {typeof app.developer === 'object' ? app.developer.username : '—'}
                        </p>
                        <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                          {typeof app.developer === 'object' ? app.developer.email : ''}
                        </p>
                      </div>
                    </td>
                    <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                      <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)' }}>{app.category}</span>
                    </td>
                    <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                      {statusBadge(app.status)}
                    </td>
                    <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                      <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)' }}>
                        {app.downloadCount}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-4) var(--space-5)', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-muted)' }}>
                        {new Date(app.updatedAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                        {app.status === 'pending_review' && (
                          <>
                            <button
                              onClick={() => { setActionId(app._id); approveMutation.mutate(app._id); }}
                              disabled={actionId === app._id}
                              className="btn-primary"
                              style={{ padding: 'var(--space-1) var(--space-3)', fontSize: 'var(--text-xs)' }}
                            >
                              {actionId === app._id ? '...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => setRejectModal({ appId: app._id, appName: app.name })}
                              className="btn-danger"
                              style={{ padding: 'var(--space-1) var(--space-3)', fontSize: 'var(--text-xs)' }}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            if (!window.confirm(`Delete "${app.name}" permanently?`)) return;
                            setActionId(app._id);
                            deleteMutation.mutate(app._id);
                          }}
                          disabled={actionId === app._id}
                          className="btn-ghost"
                          style={{ padding: 'var(--space-1) var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {apps.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-body-sm)' }}>
                      No apps found for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
        {apps.length} apps
      </p>
    </div>
  );
}

export default function AdminAppsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>Loading...</div>}>
      <AdminAppsContent />
    </Suspense>
  );
}

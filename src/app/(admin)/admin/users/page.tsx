'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { User } from '@/types/user.types';

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [actionId, setActionId] = useState<string | null>(null);

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data } = await api.get('/admin/users');
      return data.data;
    },
  });

  const banMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'ban' | 'unban' }) =>
      api.patch(`/admin/users/${id}/${action}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
    onSettled: () => setActionId(null),
  });

  const filtered = users.filter(
    (u) =>
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-8)',
        }}
      >
        <div>
          <h1 style={{ marginBottom: 'var(--space-1)' }}>User Management</h1>
          <p>View and manage all registered users.</p>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            background: 'var(--color-white)',
            border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '0 var(--space-3)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 'var(--text-body-sm)', color: 'var(--color-text-primary)', padding: 'var(--space-3) 0', width: '200px' }}
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="glass-card-solid" style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Loading users...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['User', 'Role', 'Status', 'Verified', 'Joined', 'Actions'].map((h) => (
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
                {filtered.map((user) => (
                  <tr
                    key={user._id}
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      opacity: user.isBanned ? 0.65 : 1,
                    }}
                  >
                    <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'var(--color-primary-100)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '13px',
                            color: 'var(--color-primary-dark)',
                            flexShrink: 0,
                          }}
                        >
                          {user.username[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-text-primary)', fontSize: 'var(--text-body-sm)' }}>
                            {user.username}
                          </p>
                          <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                      <span
                        className={`badge ${user.role === 'admin' ? 'badge-red' : user.role === 'developer' ? 'badge-blue' : 'badge-gray'}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                      <span className={`badge ${user.isBanned ? 'badge-red' : user.isActive ? 'badge-green' : 'badge-gray'}`}>
                        {user.isBanned ? 'Banned' : user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                      <span style={{ fontSize: 'var(--text-body-sm)', color: user.isEmailVerified ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                        {user.isEmailVerified ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-4) var(--space-5)', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-muted)' }}>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => {
                            const action = user.isBanned ? 'unban' : 'ban';
                            if (!window.confirm(`${action === 'ban' ? 'Ban' : 'Unban'} user "${user.username}"?`)) return;
                            setActionId(user._id);
                            banMutation.mutate({ id: user._id, action });
                          }}
                          disabled={actionId === user._id}
                          className={user.isBanned ? 'btn-primary' : 'btn-danger'}
                          style={{ padding: 'var(--space-1) var(--space-3)', fontSize: 'var(--text-xs)' }}
                        >
                          {actionId === user._id ? '...' : user.isBanned ? 'Unban' : 'Ban'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-body-sm)' }}>
                      {search ? 'No users match your search.' : 'No users found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p style={{ marginTop: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
        {filtered.length} of {users.length} users
      </p>
    </div>
  );
}

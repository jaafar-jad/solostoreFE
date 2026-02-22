'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { DomainVerification } from '@/types/app.types';

type TestingMode = { bypassPayment: boolean; bypassDns: boolean };

function StatusBadge({ status }: { status: DomainVerification['status'] }) {
  const map = {
    pending: { label: 'Pending', cls: 'badge-yellow' },
    verified: { label: 'Verified', cls: 'badge-green' },
    failed: { label: 'Failed', cls: 'badge-red' },
  };
  const { label, cls } = map[status];
  return <span className={`badge ${cls}`}>{label}</span>;
}

export default function VerifyPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [domain, setDomain] = useState('');
  const [method, setMethod] = useState<'dns_txt' | 'file'>('dns_txt');
  const [pendingVerify, setPendingVerify] = useState<string | null>(null);
  const [pendingInstructions, setPendingInstructions] = useState<Record<string, string> | null>(null);
  const [formError, setFormError] = useState('');

  const { data: verifications = [], isLoading } = useQuery({
    queryKey: ['verifications'],
    queryFn: async () => {
      const { data } = await api.get('/verify/list');
      return data.data as DomainVerification[];
    },
  });

  const initiateMutation = useMutation({
    mutationFn: async (payload: { domain: string; method: string }) => {
      const { data } = await api.post('/verify/initiate', payload);
      return data.data;
    },
    onSuccess: (res) => {
      setPendingVerify(res.verification._id);
      setPendingInstructions(res.instructions);
      setShowForm(false);
      setDomain('');
      queryClient.invalidateQueries({ queryKey: ['verifications'] });
    },
    onError: (err: { response?: { data?: { message?: string } } }) => {
      setFormError(err?.response?.data?.message ?? 'Failed to initiate verification.');
    },
  });

  const checkMutation = useMutation({
    mutationFn: async (domainId: string) => {
      const { data } = await api.post('/verify/check', { domainId });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verifications'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/verify/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['verifications'] }),
  });

  const forceVerifyMutation = useMutation({
    mutationFn: async (domainId: string) => {
      const { data } = await api.post(`/verify/force/${domainId}`);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['verifications'] }),
  });

  const { data: testingMode } = useQuery<TestingMode>({
    queryKey: ['testing-mode'],
    queryFn: async () => {
      const { data } = await api.get('/plans/testing-mode');
      return data.data;
    },
  });

  const handleInitiate = () => {
    if (!domain.trim()) { setFormError('Domain is required.'); return; }
    setFormError('');
    initiateMutation.mutate({ domain: domain.trim(), method });
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-8)',
        }}
      >
        <div>
          <h1 style={{ marginBottom: 'var(--space-1)' }}>Domain Verification</h1>
          <p>Verify ownership of your domains before converting them to apps.</p>
        </div>
        <button className="btn-primary" onClick={() => { setShowForm(true); setFormError(''); }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Domain
        </button>
      </div>

      {/* Testing-mode banner */}
      {testingMode?.bypassDns && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-warning-light)', border: '1.5px solid var(--color-warning)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-6)', fontSize: 'var(--text-body-sm)' }}>
          <span style={{ fontSize: '18px' }}>⚠️</span>
          <span style={{ color: 'var(--color-warning)', fontWeight: 600 }}>DNS bypass is active.</span>
          <span style={{ color: 'var(--color-text-secondary)' }}>Use &quot;Force Verify&quot; to skip DNS checks during testing.</span>
        </div>
      )}

      {/* Add domain form */}
      {showForm && (
        <div className="glass-card-solid" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-h4)' }}>Add New Domain</h3>
          {formError && (
            <div style={{ padding: 'var(--space-3)', background: 'var(--color-danger-light)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger)', fontSize: 'var(--text-body-sm)', marginBottom: 'var(--space-4)' }}>
              {formError}
            </div>
          )}
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label style={{ display: 'block', fontSize: 'var(--text-body-sm)', fontWeight: 600, marginBottom: 'var(--space-2)', color: 'var(--color-text-primary)' }}>
              Domain
            </label>
            <input
              className="input-field"
              placeholder="example.com"
              value={domain}
              onChange={(e) => { setDomain(e.target.value); setFormError(''); }}
              autoFocus
            />
          </div>
          <div style={{ marginBottom: 'var(--space-5)' }}>
            <label style={{ display: 'block', fontSize: 'var(--text-body-sm)', fontWeight: 600, marginBottom: 'var(--space-2)', color: 'var(--color-text-primary)' }}>
              Verification Method
            </label>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              {[
                { value: 'dns_txt', label: 'DNS TXT Record', desc: 'Add a TXT record to your DNS.' },
                { value: 'file', label: 'File Upload', desc: 'Upload a file to your server.' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  style={{
                    flex: 1,
                    display: 'flex',
                    gap: 'var(--space-3)',
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-md)',
                    border: `1.5px solid ${method === opt.value ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    background: method === opt.value ? 'var(--color-primary-50)' : 'var(--color-white)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <input
                    type="radio"
                    name="method"
                    value={opt.value}
                    checked={method === opt.value}
                    onChange={() => setMethod(opt.value as 'dns_txt' | 'file')}
                    style={{ marginTop: '2px', accentColor: 'var(--color-primary)' }}
                  />
                  <div>
                    <span style={{ display: 'block', fontSize: 'var(--text-body-sm)', fontWeight: 600, color: 'var(--color-text-primary)' }}>{opt.label}</span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{opt.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button className="btn-primary" onClick={handleInitiate} disabled={initiateMutation.isPending}>
              {initiateMutation.isPending ? 'Generating...' : 'Generate Token'}
            </button>
            <button className="btn-ghost" onClick={() => { setShowForm(false); setFormError(''); }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Pending instructions */}
      {pendingVerify && pendingInstructions && (
        <div
          className="glass-card-solid"
          style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)', border: '1.5px solid var(--color-primary-200)' }}
        >
          <h3 style={{ marginBottom: 'var(--space-3)', fontSize: 'var(--text-h4)', color: 'var(--color-primary)' }}>
            Verification Instructions
          </h3>
          <p style={{ marginBottom: 'var(--space-4)', color: 'var(--color-text-secondary)' }}>
            Complete the steps below, then click &quot;Check Verification&quot;.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
            {Object.entries(pendingInstructions).map(([key, value]) => (
              <div key={key} style={{ display: 'flex', gap: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-muted)', textTransform: 'capitalize', minWidth: '80px' }}>{key}</span>
                <code style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>{value}</code>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button
              className="btn-primary"
              onClick={() => checkMutation.mutate(pendingVerify)}
              disabled={checkMutation.isPending}
            >
              {checkMutation.isPending ? 'Checking...' : 'Check Verification'}
            </button>
            <button className="btn-ghost" onClick={() => { setPendingVerify(null); setPendingInstructions(null); }}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-muted)' }}>
          Loading verifications...
        </div>
      )}

      {/* Empty state */}
      {!isLoading && verifications.length === 0 && (
        <div className="glass-card-solid" style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-primary-50)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto var(--space-4)',
              color: 'var(--color-primary)',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h3 style={{ marginBottom: 'var(--space-2)' }}>No domains verified yet</h3>
          <p style={{ marginBottom: 'var(--space-4)', color: 'var(--color-text-muted)' }}>
            Add a domain to verify ownership before converting it to an app.
          </p>
        </div>
      )}

      {/* Verifications table */}
      {!isLoading && verifications.length > 0 && (
        <div className="glass-card-solid" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Domain', 'Method', 'Status', 'Verified', 'Actions'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: 'var(--space-4) var(--space-5)',
                        textAlign: 'left',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 'var(--font-weight-semibold)',
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
                {verifications.map((v) => (
                  <tr key={v._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                      <code style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>{v.domain}</code>
                    </td>
                    <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                      <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-secondary)' }}>
                        {v.method === 'dns_txt' ? 'DNS TXT' : 'File'}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                      <StatusBadge status={v.status} />
                    </td>
                    <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                      <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-muted)' }}>
                        {v.verifiedAt ? new Date(v.verifiedAt).toLocaleDateString() : '—'}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                        {v.status !== 'verified' && (
                          <button
                            onClick={() => { setPendingVerify(v._id); setShowForm(false); }}
                            className="btn-ghost"
                            style={{ padding: 'var(--space-1) var(--space-3)', fontSize: 'var(--text-xs)' }}
                          >
                            Check
                          </button>
                        )}
                        {v.status !== 'verified' && testingMode?.bypassDns && (
                          <button
                            onClick={() => forceVerifyMutation.mutate(v._id)}
                            disabled={forceVerifyMutation.isPending}
                            className="btn-ghost"
                            style={{ padding: 'var(--space-1) var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--color-warning)', borderColor: 'var(--color-warning)' }}
                          >
                            {forceVerifyMutation.isPending ? '…' : '[TEST] Force Verify'}
                          </button>
                        )}
                        <button
                          onClick={() => { if (window.confirm(`Remove domain ${v.domain}?`)) deleteMutation.mutate(v._id); }}
                          className="btn-danger"
                          style={{ padding: 'var(--space-1) var(--space-3)', fontSize: 'var(--text-xs)' }}
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

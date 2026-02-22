'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { BuildJob } from '@/types/app.types';

interface PopulatedBuildJob extends Omit<BuildJob, 'app' | 'developer'> {
  app: { _id: string; name: string };
  developer: { _id: string; username: string; email: string };
}

function statusBadge(status: BuildJob['status']) {
  const map: Record<BuildJob['status'], { label: string; cls: string }> = {
    queued: { label: 'Queued', cls: 'badge-gray' },
    building: { label: 'Building', cls: 'badge-blue' },
    signing: { label: 'Signing', cls: 'badge-blue' },
    uploading: { label: 'Uploading', cls: 'badge-yellow' },
    completed: { label: 'Completed', cls: 'badge-green' },
    failed: { label: 'Failed', cls: 'badge-red' },
  };
  const { label, cls } = map[status] ?? { label: status, cls: 'badge-gray' };
  return <span className={`badge ${cls}`}>{label}</span>;
}

function ProgressBar({ progress, status }: { progress: number; status: BuildJob['status'] }) {
  const color =
    status === 'failed' ? 'var(--color-danger)' :
    status === 'completed' ? 'var(--color-primary)' :
    'var(--color-info)';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', minWidth: '120px' }}>
      <div
        style={{
          flex: 1,
          height: '6px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--color-border)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            background: color,
            borderRadius: 'var(--radius-full)',
            transition: 'width var(--transition-normal)',
          }}
        />
      </div>
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', minWidth: '32px' }}>
        {progress}%
      </span>
    </div>
  );
}

export default function AdminBuildsPage() {
  const { data: builds = [], isLoading } = useQuery<PopulatedBuildJob[]>({
    queryKey: ['admin-builds'],
    queryFn: async () => {
      const { data } = await api.get('/admin/builds');
      return data.data;
    },
    refetchInterval: 10000, // refresh every 10s
  });

  const activeBuilds = builds.filter((b) => ['queued', 'building', 'signing', 'uploading'].includes(b.status));
  const completedBuilds = builds.filter((b) => !['queued', 'building', 'signing', 'uploading'].includes(b.status));

  const BuildTable = ({ items }: { items: PopulatedBuildJob[] }) => (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            {['App', 'Developer', 'Status', 'Progress', 'Duration', 'Date'].map((h) => (
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
          {items.map((build) => {
            const durationMs =
              build.completedAt && build.startedAt
                ? new Date(build.completedAt).getTime() - new Date(build.startedAt).getTime()
                : null;
            const duration = durationMs !== null ? `${Math.round(durationMs / 1000)}s` : '—';

            return (
              <tr key={build._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                  <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-text-primary)', fontSize: 'var(--text-body-sm)' }}>
                    {typeof build.app === 'object' ? build.app.name : '—'}
                  </p>
                  {build.apkSize && (
                    <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                      {(build.apkSize / 1024 / 1024).toFixed(1)} MB
                    </p>
                  )}
                </td>
                <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                  <p style={{ margin: 0, fontSize: 'var(--text-body-sm)', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                    {typeof build.developer === 'object' ? build.developer.username : '—'}
                  </p>
                </td>
                <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                  {statusBadge(build.status)}
                  {build.errorMessage && (
                    <p style={{ margin: '4px 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-danger)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {build.errorMessage}
                    </p>
                  )}
                </td>
                <td style={{ padding: 'var(--space-4) var(--space-5)' }}>
                  <ProgressBar progress={build.progress} status={build.status} />
                </td>
                <td style={{ padding: 'var(--space-4) var(--space-5)', whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-muted)' }}>
                    {duration}
                  </span>
                </td>
                <td style={{ padding: 'var(--space-4) var(--space-5)', whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-text-muted)' }}>
                    {new Date(build.createdAt).toLocaleString()}
                  </span>
                </td>
              </tr>
            );
          })}
          {items.length === 0 && (
            <tr>
              <td colSpan={6} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 'var(--text-body-sm)' }}>
                No builds found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
        <div>
          <h1 style={{ marginBottom: 'var(--space-1)' }}>Build Monitor</h1>
          <p>Track all active and past build jobs. Auto-refreshes every 10 seconds.</p>
        </div>
        {activeBuilds.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-2) var(--space-4)',
              background: 'var(--color-info-light)',
              border: '1px solid var(--color-info)',
              borderRadius: 'var(--radius-full)',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--color-info)',
                animation: 'pulse 1.5s infinite',
              }}
            />
            <span style={{ fontSize: 'var(--text-body-sm)', color: 'var(--color-info)', fontWeight: 600 }}>
              {activeBuilds.length} active build{activeBuilds.length > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>

      {isLoading ? (
        <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          Loading builds...
        </div>
      ) : (
        <>
          {activeBuilds.length > 0 && (
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <h3 style={{ marginBottom: 'var(--space-3)', fontSize: 'var(--text-h4)', color: 'var(--color-info)' }}>
                Active Builds ({activeBuilds.length})
              </h3>
              <div className="glass-card-solid" style={{ overflow: 'hidden', border: '1.5px solid var(--color-info)' }}>
                <BuildTable items={activeBuilds} />
              </div>
            </div>
          )}

          <div>
            <h3 style={{ marginBottom: 'var(--space-3)', fontSize: 'var(--text-h4)' }}>
              Build History ({completedBuilds.length})
            </h3>
            <div className="glass-card-solid" style={{ overflow: 'hidden' }}>
              <BuildTable items={completedBuilds} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

import DashboardShell from '@/components/layout/DashboardShell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell variant="admin" title="Solo Store — Admin Panel">
      {children}
    </DashboardShell>
  );
}

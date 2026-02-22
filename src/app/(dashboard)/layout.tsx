import DashboardShell from '@/components/layout/DashboardShell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell variant="dashboard" title="Developer Console">
      {children}
    </DashboardShell>
  );
}

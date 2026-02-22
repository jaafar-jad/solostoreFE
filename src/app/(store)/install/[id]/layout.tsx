import type { Metadata } from 'next';
import type { ReactNode } from 'react';

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  return { manifest: `/api/install/${id}/manifest` };
}

export default function InstallLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

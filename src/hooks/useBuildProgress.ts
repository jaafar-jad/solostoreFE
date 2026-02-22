'use client';

import { useEffect } from 'react';
import { connectSocket, disconnectSocket } from '@/lib/socket';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import type { BuildStatus } from '@/types/app.types';

interface BuildProgressEvent {
  jobId: string;
  step: string;
  progress: number;
  status: BuildStatus;
  log?: string;
}

interface BuildDoneEvent {
  jobId: string;
  apkUrl: string;
  appId: string;
}

interface BuildErrorEvent {
  jobId: string;
  message: string;
}

export function useBuildProgress(jobId: string | null) {
  const { accessToken } = useAuthStore();
  const { updateBuildProgress, build } = useAppStore();

  useEffect(() => {
    if (!jobId || !accessToken) return;

    const socket = connectSocket(accessToken);

    socket.emit('build:subscribe', { jobId });

    socket.on('build:progress', (event: BuildProgressEvent) => {
      if (event.jobId !== jobId) return;
      updateBuildProgress({
        progress: event.progress,
        status: event.status,
        step: event.step,
        logs: event.log
          ? [...(build.logs || []), event.log]
          : build.logs,
      });
    });

    socket.on('build:done', (event: BuildDoneEvent) => {
      if (event.jobId !== jobId) return;
      updateBuildProgress({
        progress: 100,
        status: 'completed',
        step: 'done',
        apkUrl: event.apkUrl,
      });
    });

    socket.on('build:error', (event: BuildErrorEvent) => {
      if (event.jobId !== jobId) return;
      updateBuildProgress({
        status: 'failed',
        error: event.message,
      });
    });

    return () => {
      socket.emit('build:unsubscribe', { jobId });
      socket.off('build:progress');
      socket.off('build:done');
      socket.off('build:error');
    };
  }, [jobId, accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  return build;
}

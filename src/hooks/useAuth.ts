'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { LoginInput, RegisterInput, User } from '@/types/user.types';

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isLoggedIn, setAuth, clearAuth, setUser } = useAuthStore();

  // Fetch current user profile
  const { isLoading: isLoadingUser } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get('/auth/me');
      setUser(data.data);
      return data.data as User;
    },
    enabled: isLoggedIn,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Login
  const loginMutation = useMutation({
    mutationFn: async (input: LoginInput) => {
      const { data } = await api.post('/auth/login', input);
      return data.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      queryClient.invalidateQueries({ queryKey: ['me'] });
      router.push('/dashboard');
    },
  });

  // Register
  const registerMutation = useMutation({
    mutationFn: async (input: RegisterInput) => {
      const { data } = await api.post('/auth/register', input);
      return data.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      router.push('/dashboard');
    },
  });

  // Logout
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout');
    },
    onSettled: () => {
      clearAuth();
      queryClient.clear();
      router.push('/login');
    },
  });

  return {
    user,
    isLoggedIn,
    isLoadingUser,
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    register: registerMutation.mutate,
    registerAsync: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}

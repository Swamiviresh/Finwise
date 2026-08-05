'use client'

import * as React from 'react'
import { useRouterStore } from '@/store/router-store'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  User,
  ApiResponse,
  LoginInput,
  RegisterInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from '@/types'
import { toast } from 'sonner'

const TOKEN_KEY = 'token'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

async function apiRequest<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string>),
  }

  const res = await fetch(url, { ...options, headers })
  const json = await res.json()

  if (!res.ok) {
    throw new Error(json.message || json.error || 'Request failed')
  }

  return json
}

export function useAuth() {
  const { setAuth, clearAuth, isAuthenticated, user } = useRouterStore()
  const queryClient = useQueryClient()

  const { data: meData, isLoading, isError } = useQuery<ApiResponse<User>>({
    queryKey: ['auth', 'me'],
    queryFn: () => apiRequest('/api/auth/me'),
    retry: false,
    staleTime: 5 * 60 * 1000,
    enabled: !!getToken(),
  })

  React.useEffect(() => {
    if (meData?.data) {
      const token = getToken()
      if (token) {
        setAuth(meData.data, token)
      }
    }
  }, [meData, setAuth])

  React.useEffect(() => {
    if (isError) {
      localStorage.removeItem(TOKEN_KEY)
      clearAuth()
    }
  }, [isError, clearAuth])

  const loginMutation = useMutation({
    mutationFn: async (data: LoginInput) => {
      const res = await apiRequest<ApiResponse<{ user: User; token: string }>>(
        '/api/auth/login',
        {
          method: 'POST',
          body: JSON.stringify(data),
        },
      )
      return res.data
    },
    onSuccess: ({ user: authUser, token }) => {
      localStorage.setItem(TOKEN_KEY, token)
      setAuth(authUser, token)
      queryClient.invalidateQueries()
      toast.success('Welcome back!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterInput) => {
      const res = await apiRequest<ApiResponse<{ user: User; token: string }>>(
        '/api/auth/register',
        {
          method: 'POST',
          body: JSON.stringify(data),
        },
      )
      return res.data
    },
    onSuccess: ({ user: authUser, token }) => {
      localStorage.setItem(TOKEN_KEY, token)
      setAuth(authUser, token)
      toast.success('Account created successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordInput) => {
      const res = await apiRequest<ApiResponse<null>>(
        '/api/auth/forgot-password',
        {
          method: 'POST',
          body: JSON.stringify(data),
        },
      )
      return res
    },
    onSuccess: () => {
      toast.success('Password reset email sent!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordInput & { token: string }) => {
      const { token: resetToken, ...body } = data
      const res = await apiRequest<ApiResponse<null>>(
        `/api/auth/reset-password?token=${resetToken}`,
        {
          method: 'POST',
          body: JSON.stringify(body),
        },
      )
      return res
    },
    onSuccess: () => {
      toast.success('Password reset successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const logout = React.useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    queryClient.clear()
    clearAuth()
    toast.success('Logged out successfully')
  }, [clearAuth, queryClient])

  return {
    user,
    isAuthenticated,
    isLoading,
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutate,
    registerAsync: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    forgotPassword: forgotPasswordMutation.mutate,
    isSendingReset: forgotPasswordMutation.isPending,
    resetPassword: resetPasswordMutation.mutate,
    isResettingPassword: resetPasswordMutation.isPending,
    logout,
  }
}

export { apiRequest, getToken }

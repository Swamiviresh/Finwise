'use client'

import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import type {
  Settings,
  SettingsUpdate,
  SettingsInput,
  ProfileInput,
  UserProfile,
  ApiResponse,
} from '@/types'
import { apiRequest } from '@/hooks/use-auth'
import { toast } from 'sonner'

export function useSettings() {
  return useQuery<ApiResponse<Settings>>({
    queryKey: ['settings'],
    queryFn: () => apiRequest('/api/settings'),
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: SettingsInput) => {
      const res = await apiRequest<ApiResponse<Settings>>(
        '/api/settings',
        {
          method: 'PUT',
          body: JSON.stringify(data),
        },
      )
      return res.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      toast.success('Settings updated')
      return data
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useProfile() {
  return useQuery<ApiResponse<UserProfile>>({
    queryKey: ['profile'],
    queryFn: () => apiRequest('/api/profile'),
    staleTime: 2 * 60 * 1000,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ProfileInput) => {
      const res = await apiRequest<ApiResponse<UserProfile>>(
        '/api/profile',
        {
          method: 'PUT',
          body: JSON.stringify(data),
        },
      )
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
      toast.success('Profile updated')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useExportData() {
  return useMutation({
    mutationFn: async (format: 'csv' | 'json') => {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('token')
          : null
      const res = await fetch(
        `/api/settings/export?format=${format}`,
        {
          headers: token
            ? { Authorization: `Bearer ${token}` }
            : {},
        },
      )
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.message || 'Export failed')
      }
      return res.blob()
    },
    onSuccess: (blob, format) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `finwise-export.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Data exported successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

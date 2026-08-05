'use client'

import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import type {
  Notification,
  PaginatedResponse,
  ApiResponse,
  PaginationParams,
} from '@/types'
import { apiRequest } from '@/hooks/use-auth'
import { toast } from 'sonner'

export function useNotifications(params?: PaginationParams) {
  const searchParams = new URLSearchParams()
  if (params?.page) searchParams.set('page', String(params.page))
  if (params?.limit) searchParams.set('limit', String(params.limit))
  if (params?.sortBy) searchParams.set('sortBy', params.sortBy)
  if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder)
  const qs = searchParams.toString()

  return useQuery<PaginatedResponse<Notification>>({
    queryKey: ['notifications', params],
    queryFn: () =>
      apiRequest(`/api/notifications${qs ? `?${qs}` : ''}`),
    staleTime: 15 * 1000,
    refetchInterval: 60 * 1000,
  })
}

export function useUnreadNotificationCount() {
  return useQuery<ApiResponse<{ count: number }>>({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => apiRequest('/api/notifications/unread-count'),
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/notifications/${id}/read`, {
        method: 'PUT',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({
        queryKey: ['notifications', 'unread-count'],
      })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await apiRequest('/api/notifications/read-all', {
        method: 'PUT',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({
        queryKey: ['notifications', 'unread-count'],
      })
      toast.success('All notifications marked as read')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/notifications/${id}`, { method: 'DELETE' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({
        queryKey: ['notifications', 'unread-count'],
      })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}
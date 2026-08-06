'use client'

import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import type {
  Subscription,
  SubscriptionCreate,
  PaginatedResponse,
  ApiResponse,
  PaginationParams,
} from '@/types'
import { apiRequest } from '@/hooks/use-auth'
import { toast } from 'sonner'

export function useSubscriptions(params?: PaginationParams) {
  const searchParams = new URLSearchParams()
  if (params?.page) searchParams.set('page', String(params.page))
  if (params?.limit) searchParams.set('limit', String(params.limit))
  if (params?.sortBy) searchParams.set('sortBy', params.sortBy)
  if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder)
  const qs = searchParams.toString()

  return useQuery<PaginatedResponse<Subscription>>({
    queryKey: ['subscriptions', params],
    queryFn: () => apiRequest(`/api/subscriptions${qs ? `?${qs}` : ''}`),
    staleTime: 30 * 1000,
  })
}

export function useSubscription(id: string | undefined) {
  return useQuery<ApiResponse<Subscription>>({
    queryKey: ['subscription', id],
    queryFn: () => apiRequest(`/api/subscriptions/${id}`),
    enabled: !!id,
    staleTime: 30 * 1000,
  })
}

export function useCreateSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: SubscriptionCreate) => {
      const res = await apiRequest<ApiResponse<Subscription>>(
        '/api/subscriptions',
        {
          method: 'POST',
          body: JSON.stringify(data),
        },
      )
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Subscription added')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: Partial<SubscriptionCreate>
    }) => {
      const res = await apiRequest<ApiResponse<Subscription>>(
        `/api/subscriptions/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify(data),
        },
      )
      return res.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      queryClient.invalidateQueries({
        queryKey: ['subscription', variables.id],
      })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Subscription updated')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/subscriptions/${id}`, { method: 'DELETE' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Subscription removed')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

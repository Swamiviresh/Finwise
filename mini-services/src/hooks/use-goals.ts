'use client'

import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import type {
  Goal,
  GoalCreate,
  GoalUpdate,
  PaginatedResponse,
  ApiResponse,
  PaginationParams,
} from '@/types'
import { apiRequest } from '@/hooks/use-auth'
import { toast } from 'sonner'

export function useGoals(params?: PaginationParams) {
  const searchParams = new URLSearchParams()
  if (params?.page) searchParams.set('page', String(params.page))
  if (params?.limit) searchParams.set('limit', String(params.limit))
  if (params?.sortBy) searchParams.set('sortBy', params.sortBy)
  if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder)
  const qs = searchParams.toString()

  return useQuery<PaginatedResponse<Goal>>({
    queryKey: ['goals', params],
    queryFn: () => apiRequest(`/api/goals${qs ? `?${qs}` : ''}`),
    staleTime: 30 * 1000,
  })
}

export function useGoal(id: string | undefined) {
  return useQuery<ApiResponse<Goal>>({
    queryKey: ['goal', id],
    queryFn: () => apiRequest(`/api/goals/${id}`),
    enabled: !!id,
    staleTime: 30 * 1000,
  })
}

export function useCreateGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: GoalCreate) => {
      const res = await apiRequest<ApiResponse<Goal>>('/api/goals', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Goal created')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: GoalUpdate }) => {
      const res = await apiRequest<ApiResponse<Goal>>(`/api/goals/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
      return res.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      queryClient.invalidateQueries({ queryKey: ['goal', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Goal updated')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/goals/${id}`, { method: 'DELETE' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Goal deleted')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

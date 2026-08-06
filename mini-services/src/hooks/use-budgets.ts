'use client'

import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import type {
  Budget,
  BudgetWithCategories,
  BudgetCreate,
  PaginatedResponse,
  ApiResponse,
  PaginationParams,
} from '@/types'
import { apiRequest } from '@/hooks/use-auth'
import { toast } from 'sonner'

export function useBudgets(params?: PaginationParams) {
  const searchParams = new URLSearchParams()
  if (params?.page) searchParams.set('page', String(params.page))
  if (params?.limit) searchParams.set('limit', String(params.limit))
  if (params?.sortBy) searchParams.set('sortBy', params.sortBy)
  if (params?.sortOrder) searchParams.set('sortOrder', params.sortOrder)
  const qs = searchParams.toString()

  return useQuery<PaginatedResponse<Budget>>({
    queryKey: ['budgets', params],
    queryFn: () => apiRequest(`/api/budgets${qs ? `?${qs}` : ''}`),
    staleTime: 30 * 1000,
  })
}

export function useBudget(id: string | undefined) {
  return useQuery<ApiResponse<BudgetWithCategories>>({
    queryKey: ['budget', id],
    queryFn: () => apiRequest(`/api/budgets/${id}`),
    enabled: !!id,
    staleTime: 30 * 1000,
  })
}

export function useCreateBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: BudgetCreate) => {
      const res = await apiRequest<ApiResponse<Budget>>('/api/budgets', {
        method: 'POST',
        body: JSON.stringify(data),
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Budget created')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: Partial<BudgetCreate>
    }) => {
      const res = await apiRequest<ApiResponse<Budget>>(`/api/budgets/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
      return res.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['budget', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Budget updated')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/budgets/${id}`, { method: 'DELETE' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Budget deleted')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

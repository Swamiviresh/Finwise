'use client'

import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import type {
  Transaction,
  TransactionWithCategory,
  TransactionCreate,
  TransactionUpdate,
  TransactionFilters,
  PaginatedResponse,
  ApiResponse,
} from '@/types'
import { apiRequest } from '@/hooks/use-auth'
import { toast } from 'sonner'

export function useTransactions(filters?: TransactionFilters) {
  const params = new URLSearchParams()
  if (filters?.page) params.set('page', String(filters.page))
  if (filters?.limit) params.set('limit', String(filters.limit))
  if (filters?.sortBy) params.set('sortBy', filters.sortBy)
  if (filters?.sortOrder) params.set('sortOrder', filters.sortOrder)
  if (filters?.search) params.set('search', filters.search)
  if (filters?.type) params.set('type', filters.type)
  if (filters?.categoryId) params.set('categoryId', filters.categoryId)
  if (filters?.startDate) params.set('startDate', filters.startDate)
  if (filters?.endDate) params.set('endDate', filters.endDate)

  const queryStr = params.toString()
  const url = `/api/transactions${queryStr ? `?${queryStr}` : ''}`

  return useQuery<PaginatedResponse<TransactionWithCategory>>({
    queryKey: ['transactions', filters],
    queryFn: () => apiRequest(url),
    staleTime: 30 * 1000,
  })
}

export function useTransaction(id: string | undefined) {
  return useQuery<ApiResponse<TransactionWithCategory>>({
    queryKey: ['transaction', id],
    queryFn: () => apiRequest(`/api/transactions/${id}`),
    enabled: !!id,
    staleTime: 30 * 1000,
  })
}

export function useCreateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: TransactionCreate) => {
      const res = await apiRequest<ApiResponse<Transaction>>(
        '/api/transactions',
        {
          method: 'POST',
          body: JSON.stringify(data),
        },
      )
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Transaction created')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TransactionUpdate }) => {
      const res = await apiRequest<ApiResponse<Transaction>>(
        `/api/transactions/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify(data),
        },
      )
      return res.data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['transaction', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Transaction updated')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/transactions/${id}`, { method: 'DELETE' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast.success('Transaction deleted')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

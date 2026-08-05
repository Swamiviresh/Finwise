'use client'

import { useQuery } from '@tanstack/react-query'
import type {
  DashboardData,
  ChartDataPoint,
  CategoryDistribution,
  ApiResponse,
} from '@/types'
import { apiRequest } from '@/hooks/use-auth'

export function useDashboardData() {
  return useQuery<ApiResponse<DashboardData>>({
    queryKey: ['dashboard'],
    queryFn: () => apiRequest('/api/dashboard'),
    staleTime: 30 * 1000,
  })
}

export function useMonthlyChart(months: number = 6) {
  return useQuery<ApiResponse<ChartDataPoint[]>>({
    queryKey: ['dashboard', 'monthly-chart', months],
    queryFn: () =>
      apiRequest(`/api/dashboard/monthly-chart?months=${months}`),
    staleTime: 60 * 1000,
  })
}

export function useCategoryDistribution() {
  return useQuery<ApiResponse<CategoryDistribution[]>>({
    queryKey: ['dashboard', 'category-distribution'],
    queryFn: () => apiRequest('/api/dashboard/category-distribution'),
    staleTime: 60 * 1000,
  })
}

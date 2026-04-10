import { useMutation, useQueryClient } from '@tanstack/react-query'
import { testsApi } from '../api/endpoints'
import type { TestRunRequest } from '../api/endpoints'
import toast from 'react-hot-toast'

export function useTestRunner() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: TestRunRequest) => testsApi.run(request),
    onSuccess: () => {
      toast.success('Test started!')
    },
    onError: (error: { response?: { data?: { detail?: string } } }) => {
      const detail = error.response?.data?.detail || 'Failed to start test'
      toast.error(detail)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['speed'] })
    },
  })
}

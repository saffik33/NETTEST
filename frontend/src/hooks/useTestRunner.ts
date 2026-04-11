import { useMutation, useQueryClient } from '@tanstack/react-query'
import { testsApi } from '../api/endpoints'
import type { TestRunRequest } from '../api/endpoints'
import { runClientSpeedTest, saveSpeedResult } from '../services/clientSpeedTest'
import { useRealtimeStore } from '../stores/realtimeStore'
import toast from 'react-hot-toast'

export function useTestRunner() {
  const queryClient = useQueryClient()
  const { setTestStarted, setPhaseStarted, setSpeedProgress, setPhaseCompleted } =
    useRealtimeStore.getState()

  return useMutation({
    mutationFn: async (request: TestRunRequest) => {
      // Step 1: Start backend session (without speed test — we do it client-side)
      const backendRequest = { ...request, include_speed: false }
      const { data } = await testsApi.run(backendRequest)
      const sessionId = data.session_id

      // Step 2: Run speed test CLIENT-SIDE if requested
      if (request.include_speed !== false) {
        setTestStarted(sessionId)
        setPhaseStarted('speed', 'Testing your connection speed...')

        try {
          const result = await runClientSpeedTest((progress) => {
            const phaseMap = { download: 'testing_download', upload: 'testing_upload', complete: 'complete' } as const
            setSpeedProgress(phaseMap[progress.phase], progress.phase === 'download' ? progress.progress * 0.5 : 0.5 + progress.progress * 0.5)
          })

          // Save result to backend
          await saveSpeedResult(result, sessionId)

          setPhaseCompleted('speed', {
            download_mbps: result.download_mbps,
            upload_mbps: result.upload_mbps,
          })

          toast.success(`Speed: ${result.download_mbps} ↓ / ${result.upload_mbps} ↑ Mbps`)
        } catch (e) {
          console.error('Client-side speed test failed:', e)
          toast.error('Speed test failed')
        }
      }

      return data
    },
    onError: (error: { response?: { data?: { detail?: string } } }) => {
      const detail = error.response?.data?.detail || 'Failed to start test'
      toast.error(detail)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['speed'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

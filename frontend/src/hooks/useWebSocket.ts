import { useEffect } from 'react'
import { wsClient } from '../api/websocket'
import type { WSMessage } from '../api/websocket'
import { useRealtimeStore } from '../stores/realtimeStore'

export function useWebSocket() {
  const store = useRealtimeStore()

  useEffect(() => {
    wsClient.connect()

    const unsubscribe = wsClient.onMessage((message: WSMessage) => {
      const { type, payload } = message

      switch (type) {
        case 'test_started':
          store.setTestStarted(payload.session_id as number)
          break
        case 'test_phase_started':
          store.setPhaseStarted(payload.phase as string, payload.description as string)
          break
        case 'speed_progress':
          store.setSpeedProgress(payload.phase as string, payload.progress_pct as number)
          break
        case 'test_phase_completed':
          store.setPhaseCompleted(payload.phase as string, payload.result as Record<string, unknown>)
          break
        case 'test_completed':
          store.setTestCompleted()
          break
        case 'test_failed':
          store.setTestFailed(payload.error as string)
          break
      }
    })

    return () => {
      unsubscribe()
      wsClient.disconnect()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}

import { create } from 'zustand'

interface TestProgress {
  sessionId: number | null
  isRunning: boolean
  currentPhase: string
  phaseDescription: string
  speedProgress: number
  speedPhase: string
  lastResult: {
    download_mbps?: number
    upload_mbps?: number
    server_name?: string
  } | null
}

interface RealtimeState {
  testProgress: TestProgress
  setTestStarted: (sessionId: number) => void
  setPhaseStarted: (phase: string, description: string) => void
  setSpeedProgress: (phase: string, progress: number) => void
  setPhaseCompleted: (phase: string, result: Record<string, unknown>) => void
  setTestCompleted: () => void
  setTestFailed: (error: string) => void
  reset: () => void
}

const initialProgress: TestProgress = {
  sessionId: null,
  isRunning: false,
  currentPhase: '',
  phaseDescription: '',
  speedProgress: 0,
  speedPhase: '',
  lastResult: null,
}

export const useRealtimeStore = create<RealtimeState>((set) => ({
  testProgress: { ...initialProgress },

  setTestStarted: (sessionId) =>
    set({ testProgress: { ...initialProgress, sessionId, isRunning: true } }),

  setPhaseStarted: (phase, description) =>
    set((state) => ({
      testProgress: { ...state.testProgress, currentPhase: phase, phaseDescription: description },
    })),

  setSpeedProgress: (phase, progress) =>
    set((state) => ({
      testProgress: { ...state.testProgress, speedPhase: phase, speedProgress: progress },
    })),

  setPhaseCompleted: (phase, result) =>
    set((state) => ({
      testProgress: {
        ...state.testProgress,
        lastResult: phase === 'speed' ? (result as TestProgress['lastResult']) : state.testProgress.lastResult,
      },
    })),

  setTestCompleted: () =>
    set((state) => ({
      testProgress: { ...state.testProgress, isRunning: false, currentPhase: 'done' },
    })),

  setTestFailed: (_error) =>
    set((state) => ({
      testProgress: { ...state.testProgress, isRunning: false, currentPhase: 'failed' },
    })),

  reset: () => set({ testProgress: { ...initialProgress } }),
}))

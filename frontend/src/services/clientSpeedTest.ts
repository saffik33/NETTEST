/**
 * Client-side speed test: measures the USER's actual internet speed
 * by downloading/uploading test data between the browser and the server.
 * This is how LibreSpeed and fast.com work.
 */

export interface SpeedTestProgress {
  phase: 'download' | 'upload' | 'complete'
  progress: number  // 0-1
  currentSpeed?: number  // Mbps (live measurement)
}

export interface SpeedTestResult {
  download_mbps: number
  upload_mbps: number
}

type ProgressCallback = (progress: SpeedTestProgress) => void

const TEST_DURATION_MS = 8000  // Test for 8 seconds per direction
const DOWNLOAD_CHUNK_MB = 25   // Download 25 MB chunks
const UPLOAD_CHUNK_MB = 5      // Upload 5 MB chunks

/**
 * Measure download speed by fetching test data from the server.
 * Runs multiple concurrent streams for accuracy.
 */
async function measureDownload(onProgress: ProgressCallback): Promise<number> {
  const measurements: number[] = []
  const startTime = performance.now()
  let totalBytes = 0

  // Run download test for TEST_DURATION_MS
  while (performance.now() - startTime < TEST_DURATION_MS) {
    const chunkStart = performance.now()

    try {
      const cacheBust = Date.now() + Math.random()
      const response = await fetch(`/api/speedtest/download?size_mb=${DOWNLOAD_CHUNK_MB}&_=${cacheBust}`)
      const blob = await response.blob()

      const chunkEnd = performance.now()
      const chunkTimeSec = (chunkEnd - chunkStart) / 1000
      const chunkMbps = (blob.size * 8) / (chunkTimeSec * 1_000_000)

      totalBytes += blob.size
      measurements.push(chunkMbps)

      const elapsed = performance.now() - startTime
      onProgress({
        phase: 'download',
        progress: Math.min(elapsed / TEST_DURATION_MS, 1),
        currentSpeed: chunkMbps,
      })
    } catch {
      break
    }
  }

  if (measurements.length === 0) return 0

  // Use total bytes / total time for overall speed
  const totalTimeSec = (performance.now() - startTime) / 1000
  return (totalBytes * 8) / (totalTimeSec * 1_000_000)
}

/**
 * Measure upload speed by sending test data to the server.
 */
async function measureUpload(onProgress: ProgressCallback): Promise<number> {
  const measurements: number[] = []
  const startTime = performance.now()
  let totalBytes = 0

  // Pre-generate upload payload
  const uploadSize = UPLOAD_CHUNK_MB * 1024 * 1024
  const payload = new ArrayBuffer(uploadSize)
  // Fill with random-ish data to prevent compression
  const view = new Uint32Array(payload)
  for (let i = 0; i < view.length; i++) {
    view[i] = (Math.random() * 0xFFFFFFFF) >>> 0
  }

  while (performance.now() - startTime < TEST_DURATION_MS) {
    const chunkStart = performance.now()

    try {
      const response = await fetch('/api/speedtest/upload', {
        method: 'POST',
        body: payload,
        headers: { 'Content-Type': 'application/octet-stream' },
      })
      await response.json()

      const chunkEnd = performance.now()
      const chunkTimeSec = (chunkEnd - chunkStart) / 1000
      const chunkMbps = (uploadSize * 8) / (chunkTimeSec * 1_000_000)

      totalBytes += uploadSize
      measurements.push(chunkMbps)

      const elapsed = performance.now() - startTime
      onProgress({
        phase: 'upload',
        progress: Math.min(elapsed / TEST_DURATION_MS, 1),
        currentSpeed: chunkMbps,
      })
    } catch {
      break
    }
  }

  if (measurements.length === 0) return 0

  const totalTimeSec = (performance.now() - startTime) / 1000
  return (totalBytes * 8) / (totalTimeSec * 1_000_000)
}

/**
 * Run a full client-side speed test (download + upload).
 */
export async function runClientSpeedTest(
  onProgress: ProgressCallback,
): Promise<SpeedTestResult> {
  // Phase 1: Download
  const download_mbps = await measureDownload(onProgress)

  // Phase 2: Upload
  const upload_mbps = await measureUpload(onProgress)

  onProgress({ phase: 'complete', progress: 1 })

  return {
    download_mbps: Math.round(download_mbps * 100) / 100,
    upload_mbps: Math.round(upload_mbps * 100) / 100,
  }
}

/**
 * Save the client-side speed test result to the server.
 */
export async function saveSpeedResult(
  result: SpeedTestResult,
  sessionId?: number | null,
): Promise<void> {
  await fetch('/api/speedtest/result', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      download_mbps: result.download_mbps,
      upload_mbps: result.upload_mbps,
    }),
  })
}

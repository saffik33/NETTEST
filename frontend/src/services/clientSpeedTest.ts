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

const TEST_DURATION_MS = 12_000  // Test for 12 seconds per direction
const PARALLEL_STREAMS = 8       // Concurrent connections to saturate the pipe
const DOWNLOAD_CHUNK_MB = 25     // Larger chunks = less HTTP overhead on high-latency links
const UPLOAD_CHUNK_MB = 4        // Larger upload chunks for remote servers
const WARMUP_MS = 2000           // Discard first 2s (TCP slow-start over long routes)

/**
 * Measure download speed using multiple parallel streams.
 * This saturates the connection like fast.com / speedtest.net.
 */
async function measureDownload(onProgress: ProgressCallback): Promise<number> {
  const startTime = performance.now()
  let totalBytes = 0
  let warmupBytes = 0
  let warmupDone = false
  let running = true

  // Each stream fetches chunks in a loop until time runs out
  const streamWorker = async () => {
    while (running && performance.now() - startTime < TEST_DURATION_MS) {
      try {
        const cacheBust = Date.now() + Math.random()
        const response = await fetch(`/api/speedtest/download?size_mb=${DOWNLOAD_CHUNK_MB}&_=${cacheBust}`)
        const blob = await response.blob()
        totalBytes += blob.size
        if (!warmupDone && performance.now() - startTime >= WARMUP_MS) {
          warmupBytes = totalBytes
          warmupDone = true
        }
      } catch {
        break
      }
    }
  }

  // Progress reporter
  const progressInterval = setInterval(() => {
    const elapsed = performance.now() - startTime
    const measuredBytes = warmupDone ? totalBytes - warmupBytes : 0
    const measuredTime = warmupDone ? (elapsed - WARMUP_MS) / 1000 : 0
    const currentMbps = measuredTime > 0 ? (measuredBytes * 8) / (measuredTime * 1_000_000) : 0
    onProgress({
      phase: 'download',
      progress: Math.min(elapsed / TEST_DURATION_MS, 1),
      currentSpeed: currentMbps,
    })
  }, 250)

  // Launch parallel streams
  const streams = Array.from({ length: PARALLEL_STREAMS }, () => streamWorker())
  await Promise.all(streams)
  running = false
  clearInterval(progressInterval)

  // Only count bytes transferred AFTER warmup for accurate measurement
  const measuredBytes = totalBytes - warmupBytes
  const measuredTimeSec = (performance.now() - startTime - WARMUP_MS) / 1000
  if (measuredTimeSec <= 0 || measuredBytes <= 0) return 0
  return (measuredBytes * 8) / (measuredTimeSec * 1_000_000)
}

/**
 * Measure upload speed using multiple parallel streams.
 */
async function measureUpload(onProgress: ProgressCallback): Promise<number> {
  const startTime = performance.now()
  let totalBytes = 0
  let warmupBytes = 0
  let warmupDone = false
  let running = true

  // Pre-generate upload payload (shared across streams)
  const uploadSize = UPLOAD_CHUNK_MB * 1024 * 1024
  const payload = new ArrayBuffer(uploadSize)
  const view = new Uint32Array(payload)
  for (let i = 0; i < view.length; i++) {
    view[i] = (Math.random() * 0xFFFFFFFF) >>> 0
  }

  const streamWorker = async () => {
    while (running && performance.now() - startTime < TEST_DURATION_MS) {
      try {
        const response = await fetch('/api/speedtest/upload', {
          method: 'POST',
          body: payload,
          headers: { 'Content-Type': 'application/octet-stream' },
        })
        await response.json()
        totalBytes += uploadSize
        if (!warmupDone && performance.now() - startTime >= WARMUP_MS) {
          warmupBytes = totalBytes
          warmupDone = true
        }
      } catch {
        break
      }
    }
  }

  const progressInterval = setInterval(() => {
    const elapsed = performance.now() - startTime
    const measuredBytes = warmupDone ? totalBytes - warmupBytes : 0
    const measuredTime = warmupDone ? (elapsed - WARMUP_MS) / 1000 : 0
    const currentMbps = measuredTime > 0 ? (measuredBytes * 8) / (measuredTime * 1_000_000) : 0
    onProgress({
      phase: 'upload',
      progress: Math.min(elapsed / TEST_DURATION_MS, 1),
      currentSpeed: currentMbps,
    })
  }, 250)

  const streams = Array.from({ length: PARALLEL_STREAMS }, () => streamWorker())
  await Promise.all(streams)
  running = false
  clearInterval(progressInterval)

  const measuredBytes = totalBytes - warmupBytes
  const measuredTimeSec = (performance.now() - startTime - WARMUP_MS) / 1000
  if (measuredTimeSec <= 0 || measuredBytes <= 0) return 0
  return (measuredBytes * 8) / (measuredTimeSec * 1_000_000)
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

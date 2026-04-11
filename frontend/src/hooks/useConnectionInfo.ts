/**
 * Browser Network Information API hook.
 * Provides real-time connection type, estimated speed, and RTT.
 * Works even when WiFi hardware scanning isn't available (e.g., cloud deployment).
 */

import { useState, useEffect } from 'react'

interface NetworkInfo {
  effectiveType: string  // '4g', '3g', '2g', 'slow-2g'
  downlink: number       // Estimated Mbps
  rtt: number            // Estimated RTT in ms
  saveData: boolean      // Data saver mode
  type: string           // 'wifi', 'cellular', 'ethernet', 'none', 'unknown'
}

interface NavigatorConnection {
  effectiveType: string
  downlink: number
  rtt: number
  saveData: boolean
  type?: string
  addEventListener: (event: string, handler: () => void) => void
  removeEventListener: (event: string, handler: () => void) => void
}

function getConnection(): NavigatorConnection | null {
  const nav = navigator as { connection?: NavigatorConnection; mozConnection?: NavigatorConnection; webkitConnection?: NavigatorConnection }
  return nav.connection || nav.mozConnection || nav.webkitConnection || null
}

export function useConnectionInfo(): NetworkInfo | null {
  const [info, setInfo] = useState<NetworkInfo | null>(null)

  useEffect(() => {
    const conn = getConnection()
    if (!conn) return

    const update = () => {
      setInfo({
        effectiveType: conn.effectiveType || 'unknown',
        downlink: conn.downlink || 0,
        rtt: conn.rtt || 0,
        saveData: conn.saveData || false,
        type: conn.type || 'unknown',
      })
    }

    update()
    conn.addEventListener('change', update)
    return () => conn.removeEventListener('change', update)
  }, [])

  return info
}

type MessageHandler = (message: WSMessage) => void

export interface WSMessage {
  type: string
  timestamp: string
  payload: Record<string, unknown>
}

class WebSocketClient {
  private ws: WebSocket | null = null
  private handlers: MessageHandler[] = []
  private reconnectDelay = 1000
  private maxReconnectDelay = 30000
  private shouldReconnect = true

  connect() {
    this.shouldReconnect = true
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const url = `${protocol}//${window.location.host}/api/ws`

    this.ws = new WebSocket(url)

    this.ws.onopen = () => {
      this.reconnectDelay = 1000
    }

    this.ws.onmessage = (event) => {
      let message: WSMessage
      try {
        message = JSON.parse(event.data)
      } catch {
        console.error('Failed to parse WebSocket message:', event.data)
        return
      }
      this.handlers.forEach((handler) => {
        try { handler(message) } catch (e) { console.error('WS handler error:', e) }
      })
    }

    this.ws.onclose = () => {
      if (this.shouldReconnect) {
        setTimeout(() => this.connect(), this.reconnectDelay)
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay)
      }
    }

    this.ws.onerror = () => {
      this.ws?.close()
    }
  }

  disconnect() {
    this.shouldReconnect = false
    this.ws?.close()
  }

  onMessage(handler: MessageHandler) {
    this.handlers.push(handler)
    return () => {
      this.handlers = this.handlers.filter((h) => h !== handler)
    }
  }

  send(data: Record<string, unknown>) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }
}

export const wsClient = new WebSocketClient()

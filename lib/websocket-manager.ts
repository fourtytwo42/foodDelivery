import { verifyToken } from './auth'
import WebSocket, { WebSocketServer } from 'ws'

export interface WebSocketClient {
  ws: WebSocket
  userId: string
  subscriptions: Set<string> // Set of order IDs or event types
}

export class WebSocketManager {
  private clients: Map<string, WebSocketClient> = new Map()
  private wss: WebSocketServer | null = null

  constructor() {
    // Initialize on demand
  }

  /**
   * Initialize WebSocket server
   */
  initialize(server: any) {
    if (this.wss) {
      return
    }

    this.wss = new WebSocketServer({ noServer: true })

    server.on('upgrade', (request: any, socket: any, head: any) => {
      // Extract token from query string
      const url = new URL(request.url, `http://${request.headers.host}`)
      const token = url.searchParams.get('token')

      if (!token) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
        socket.destroy()
        return
      }

      // Verify token
      try {
        const payload = verifyToken(token)
        const userId = payload.userId

        // Handle upgrade
        this.wss!.handleUpgrade(request, socket, head, (ws) => {
          this.wss!.emit('connection', ws, request, userId)
        })
      } catch (error) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
        socket.destroy()
      }
    })

    this.wss.on('connection', (ws: WebSocket, request: any, userId: string) => {
      const client: WebSocketClient = {
        ws,
        userId,
        subscriptions: new Set(),
      }

      this.clients.set(userId, client)

      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString())
          this.handleMessage(userId, message)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      })

      ws.on('close', () => {
        this.clients.delete(userId)
      })

      ws.on('error', (error) => {
        console.error('WebSocket error:', error)
        this.clients.delete(userId)
      })

      // Send connection confirmation
      this.sendToUser(userId, 'connection', { status: 'connected' })
    })
  }

  /**
   * Handle incoming message from client
   */
  private handleMessage(userId: string, message: any) {
    const client = this.clients.get(userId)
    if (!client) return

    switch (message.event) {
      case 'subscribe':
        if (message.data?.orderId) {
          client.subscriptions.add(message.data.orderId)
          this.sendToUser(userId, 'subscribed', { orderId: message.data.orderId })
        }
        break
      case 'unsubscribe':
        if (message.data?.orderId) {
          client.subscriptions.delete(message.data.orderId)
          this.sendToUser(userId, 'unsubscribed', { orderId: message.data.orderId })
        }
        break
      default:
        console.log('Unknown message event:', message.event)
    }
  }

  /**
   * Send message to a specific user
   */
  sendToUser(userId: string, event: string, data: any) {
    const client = this.clients.get(userId)
    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      return false
    }

    try {
      client.ws.send(JSON.stringify({ event, data }))
      return true
    } catch (error) {
      console.error('Error sending WebSocket message:', error)
      return false
    }
  }

  /**
   * Broadcast message to multiple users
   */
  broadcast(event: string, data: any, userIds?: string[]) {
    const targets = userIds || Array.from(this.clients.keys())
    let sentCount = 0

    targets.forEach((userId) => {
      if (this.sendToUser(userId, event, data)) {
        sentCount++
      }
    })

    return sentCount
  }

  /**
   * Broadcast order update to subscribed users
   */
  broadcastOrderUpdate(orderId: string, order: any) {
    let sentCount = 0

    this.clients.forEach((client, userId) => {
      if (client.subscriptions.has(orderId)) {
        if (this.sendToUser(userId, 'order:update', { orderId, order })) {
          sentCount++
        }
      }
    })

    return sentCount
  }

  /**
   * Broadcast notification to a user
   */
  broadcastNotification(userId: string, notification: any) {
    return this.sendToUser(userId, 'notification', notification)
  }

  /**
   * Get connected client count
   */
  getConnectedCount(): number {
    return this.clients.size
  }

  /**
   * Check if user is connected
   */
  isUserConnected(userId: string): boolean {
    const client = this.clients.get(userId)
    return client !== undefined && client.ws.readyState === WebSocket.OPEN
  }

  /**
   * Close all connections
   */
  close() {
    this.clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.close()
      }
    })
    this.clients.clear()

    if (this.wss) {
      this.wss.close()
      this.wss = null
    }
  }
}

// Singleton instance
let wsManager: WebSocketManager | null = null

export function getWebSocketManager(): WebSocketManager {
  if (!wsManager) {
    wsManager = new WebSocketManager()
  }
  return wsManager
}

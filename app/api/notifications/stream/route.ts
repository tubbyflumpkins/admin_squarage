import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Store active connections
const clients = new Map<string, ReadableStreamDefaultController>()

export async function GET(request: Request) {
  // Check authentication
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Create a new stream for this client
  const stream = new ReadableStream({
    start(controller) {
      // Store the controller for this user
      clients.set(session.user.id, controller)
      
      // Send initial connection message
      const data = `data: ${JSON.stringify({ type: 'connected', userId: session.user.id })}\n\n`
      controller.enqueue(new TextEncoder().encode(data))
      
      // Set up heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          const ping = `data: ${JSON.stringify({ type: 'ping' })}\n\n`
          controller.enqueue(new TextEncoder().encode(ping))
        } catch (error) {
          // Connection closed, clean up
          clearInterval(heartbeat)
          clients.delete(session.user.id)
        }
      }, 30000) // Send ping every 30 seconds
      
      // Clean up on close
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        clients.delete(session.user.id)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable Nginx buffering
    },
  })
}

// Helper function to send events to specific users (internal use only)
// This is not exported as it's not a valid Next.js route export
function sendEventToUser(userId: string, data: any) {
  const controller = clients.get(userId)
  if (controller) {
    try {
      const message = `data: ${JSON.stringify(data)}\n\n`
      controller.enqueue(new TextEncoder().encode(message))
    } catch (error) {
      // Connection closed, remove from clients
      clients.delete(userId)
    }
  }
}
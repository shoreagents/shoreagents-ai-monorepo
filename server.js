/**
 * Custom Next.js Server with Socket.IO
 * This server handles both Next.js pages and WebSocket connections
 */

const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Initialize Socket.IO
  const io = new Server(httpServer, {
    path: '/api/socketio',
    addTrailingSlash: false,
    cors: {
      origin: dev ? ['http://localhost:3000'] : false,
      methods: ['GET', 'POST']
    },
  })

  // Store connected users
  const connectedUsers = new Map()

  io.on('connection', (socket) => {
    console.log('[WebSocket] Client connected:', socket.id)

    // Handle user authentication/identification
    socket.on('identify', (data) => {
      const { userId, userName } = data
      connectedUsers.set(socket.id, { userId, userName, socketId: socket.id })
      console.log('[WebSocket] User identified:', userName)
      
      // Broadcast online users count
      io.emit('users:online', {
        count: connectedUsers.size,
        users: Array.from(connectedUsers.values())
      })
    })

    // Break events
    socket.on('break:start', (data) => {
      console.log('[WebSocket] Break start event:', data)
      // Broadcast to all clients for real-time updates
      io.emit('break:started', data)
    })

    socket.on('break:end', (data) => {
      console.log('[WebSocket] Break end event:', data)
      // Broadcast to all clients for real-time updates
      io.emit('break:ended', data)
    })

    socket.on('break:pause', (data) => {
      console.log('[WebSocket] Break pause event:', data)
      // Broadcast to all clients for real-time updates
      io.emit('break:paused', data)
    })

    socket.on('break:resume', (data) => {
      console.log('[WebSocket] Break resume event:', data)
      // Broadcast to all clients for real-time updates
      io.emit('break:resumed', data)
    })

    // Task events
    socket.on('task:create', (data) => {
      console.log('[WebSocket] Task created:', data)
      io.emit('task:created', data)
    })

    socket.on('task:update', (data) => {
      console.log('[WebSocket] Task updated:', data)
      io.emit('task:updated', data)
    })

    socket.on('task:delete', (data) => {
      console.log('[WebSocket] Task deleted:', data)
      io.emit('task:deleted', data)
    })

    // Time tracking events - just broadcast, client handles API calls
    socket.on('time:clockin', (data) => {
      console.log('[WebSocket] Clock in event:', data)
      // Broadcast to all clients for real-time updates
      io.emit('time:clockedin', data)
    })

    socket.on('time:clockout', (data) => {
      console.log('[WebSocket] Clock out event:', data)
      // Broadcast to all clients for real-time updates
      io.emit('time:clockedout', data)
    })

    // Data update events - broadcast when data changes
    socket.on('time:data-update', (data) => {
      console.log('[WebSocket] Time data update:', data)
      // Broadcast to all clients for real-time updates
      io.emit('time:data-updated', data)
    })

    // Performance metrics events
    socket.on('metrics:update', (data) => {
      // Only send to the specific user
      socket.emit('metrics:updated', data)
    })

    // Activity feed events
    socket.on('post:create', (data) => {
      console.log('[WebSocket] Post created:', data)
      io.emit('post:created', data)
    })

    socket.on('post:react', (data) => {
      console.log('[WebSocket] Post reaction:', data)
      io.emit('post:reacted', data)
    })

    socket.on('post:comment', (data) => {
      console.log('[WebSocket] Post comment:', data)
      io.emit('post:commented', data)
    })

    // Ticket events
    socket.on('ticket:create', (data) => {
      console.log('[WebSocket] Ticket created:', data)
      io.emit('ticket:created', data)
    })

    socket.on('ticket:update', (data) => {
      console.log('[WebSocket] Ticket updated:', data)
      io.emit('ticket:updated', data)
    })

    socket.on('ticket:respond', (data) => {
      console.log('[WebSocket] Ticket response:', data)
      io.emit('ticket:responded', data)
    })

    // Leaderboard events
    socket.on('leaderboard:update', (data) => {
      io.emit('leaderboard:updated', data)
    })

    // Notification events
    socket.on('notification:send', (data) => {
      console.log('[WebSocket] Notification:', data)
      // Send to specific user or broadcast
      if (data.userId) {
        // Find the socket for this user
        const userSocket = Array.from(connectedUsers.entries())
          .find(([_, user]) => user.userId === data.userId)
        if (userSocket) {
          io.to(userSocket[0]).emit('notification:received', data)
        }
      } else {
        io.emit('notification:received', data)
      }
    })

    // Handle disconnection
    socket.on('disconnect', () => {
      const user = connectedUsers.get(socket.id)
      console.log('[WebSocket] Client disconnected:', user?.userName || socket.id)
      connectedUsers.delete(socket.id)
      
      // Broadcast updated online users
      io.emit('users:online', {
        count: connectedUsers.size,
        users: Array.from(connectedUsers.values())
      })
    })
  })

  httpServer
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
      console.log(`> WebSocket server ready on ws://${hostname}:${port}/api/socketio`)
    })
})

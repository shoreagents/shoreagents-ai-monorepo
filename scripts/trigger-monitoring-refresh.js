/**
 * Script to trigger a monitoring refresh via WebSocket
 * This can be used to test real-time updates
 */

const { io } = require('socket.io-client')

// Connect to the WebSocket server
const socket = io('http://localhost:3000', {
  path: '/api/socketio',
  addTrailingSlash: false,
})

socket.on('connect', () => {
  console.log('✅ Connected to WebSocket server')
  
  // Trigger a force refresh for all monitoring clients
  socket.emit('monitoring:force-refresh')
  console.log('🔄 Triggered force refresh for all monitoring clients')
  
  // Disconnect after sending
  setTimeout(() => {
    socket.disconnect()
    console.log('✅ Disconnected')
    process.exit(0)
  }, 1000)
})

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error)
  process.exit(1)
})

console.log('🚀 Triggering monitoring refresh...')
console.log('💡 Make sure the server is running on http://localhost:3000')

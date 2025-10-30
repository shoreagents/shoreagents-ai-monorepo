/**
 * Test script for real-time monitoring functionality
 * This script simulates performance updates to test the WebSocket connection
 */

const { io } = require('socket.io-client')

// Connect to the WebSocket server
const socket = io('http://localhost:3000', {
  path: '/api/socketio',
  addTrailingSlash: false,
})

socket.on('connect', () => {
  console.log('✅ Connected to WebSocket server')
  
  // Subscribe to monitoring updates
  socket.emit('monitoring:subscribe', { clientId: 'test-client' })
  console.log('📡 Subscribed to monitoring updates')
  
  // Listen for performance updates
  socket.on('monitoring:performance-update', (data) => {
    console.log('🔄 Received performance update:', {
      staffUserId: data.staffUserId,
      type: data.type,
      isActive: data.isActive,
      lastActivity: data.lastActivity,
      metrics: data.metrics ? {
        mouseClicks: data.metrics.mouseClicks,
        keystrokes: data.metrics.keystrokes,
        activeTime: data.metrics.activeTime,
        productivityScore: data.metrics.productivityScore
      } : 'No metrics'
    })
  })
  
  // Simulate some performance updates after a delay
  setTimeout(() => {
    console.log('🧪 Simulating performance updates...')
    
    // Simulate a performance update
    socket.emit('metrics:update', {
      staffUserId: 'test-staff-user-id',
      type: 'latest',
      metrics: {
        mouseClicks: 25,
        keystrokes: 150,
        activeTime: 30,
        productivityScore: 85
      },
      isActive: true,
      lastActivity: new Date().toISOString()
    })
    
    console.log('📤 Sent test performance update')
  }, 2000)
})

socket.on('disconnect', () => {
  console.log('❌ Disconnected from WebSocket server')
})

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error)
})

// Keep the script running for testing
console.log('🚀 Starting real-time monitoring test...')
console.log('💡 Make sure the server is running on http://localhost:3000')
console.log('⏰ Test will run for 30 seconds...')

setTimeout(() => {
  console.log('✅ Test completed')
  socket.disconnect()
  process.exit(0)
}, 30000)

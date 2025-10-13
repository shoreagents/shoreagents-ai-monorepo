# WebSocket Real-Time Communication Guide

This guide explains how to use WebSockets for real-time updates across the entire application.

## 🚀 Overview

We use **Socket.IO** for WebSocket communication, providing:
- ✅ Real-time bi-directional communication
- ✅ Automatic reconnection
- ✅ Event-based messaging
- ✅ Room support for targeted messages

## 📦 Architecture

### Server Side (`server.js`)
Custom Next.js server with Socket.IO integration running on the same port as Next.js.

### Client Side (`lib/websocket-provider.tsx`)
React context provider that manages WebSocket connection and exposes hooks for components.

## 🎯 Available Events

### Break Events
- `break:start` → `break:started` - When a break begins
- `break:end` → `break:ended` - When a break ends

### Task Events
- `task:create` → `task:created` - New task created
- `task:update` → `task:updated` - Task status/details updated
- `task:delete` → `task:deleted` - Task deleted

### Time Tracking Events
- `time:clockin` → `time:clockedin` - User clocks in
- `time:clockout` → `time:clockedout` - User clocks out

### Activity Feed Events
- `post:create` → `post:created` - New post published
- `post:react` → `post:reacted` - New reaction added
- `post:comment` → `post:commented` - New comment added

### Ticket Events
- `ticket:create` → `ticket:created` - New support ticket
- `ticket:update` → `ticket:updated` - Ticket status changed
- `ticket:respond` → `ticket:responded` - New response added

### System Events
- `users:online` - Updates count and list of online users
- `notification:send` → `notification:received` - Push notifications

## 💻 Usage in Components

### Method 1: Using Custom Hooks (Recommended)

```typescript
import { useWebSocketEvent, useWebSocketEmit } from '@/hooks/use-websocket-event'
import { useCallback } from 'react'

function MyComponent() {
  const { emit } = useWebSocketEmit()
  
  // Listen for events
  const handleTaskCreated = useCallback((data) => {
    console.log('New task created:', data)
    // Update your state here
  }, [])
  
  useWebSocketEvent('task:created', handleTaskCreated)
  
  // Emit events
  const createTask = async () => {
    // ... API call to create task
    
    // Emit WebSocket event for real-time updates
    emit('task:create', {
      taskId: newTask.id,
      title: newTask.title,
      userId: newTask.userId,
    })
  }
  
  return <div>...</div>
}
```

### Method 2: Using WebSocket Context Directly

```typescript
import { useWebSocket } from '@/lib/websocket-provider'

function MyComponent() {
  const { socket, isConnected } = useWebSocket()
  
  useEffect(() => {
    if (!socket || !isConnected) return
    
    const handler = (data) => {
      console.log('Received:', data)
    }
    
    socket.on('my:event', handler)
    
    return () => {
      socket.off('my:event', handler)
    }
  }, [socket, isConnected])
  
  return <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
}
```

## 🔧 Adding New Events

### 1. Add Event Handler in `server.js`

```javascript
// In the io.on('connection') block
socket.on('my:event', (data) => {
  console.log('[WebSocket] My event:', data)
  // Broadcast to all clients
  io.emit('my:event:result', data)
  
  // Or send to specific user
  socket.emit('my:event:result', data)
})
```

### 2. Emit Event from Component

```typescript
const { emit } = useWebSocketEmit()

const doSomething = () => {
  emit('my:event', { foo: 'bar' })
}
```

### 3. Listen for Response

```typescript
const handleResult = useCallback((data) => {
  console.log('Got result:', data)
}, [])

useWebSocketEvent('my:event:result', handleResult)
```

## 📱 Real-Time Features

### ✅ Fully Implemented:
- ✅ **Break tracking** - See when teammates start/end breaks
- ✅ **Online users counter** - See who's currently active
- ✅ **Task management** - See task updates in real-time (create, update, delete)
- ✅ **Activity feed** - Live posts, reactions, and comments
- ✅ **Support tickets** - Real-time ticket creation, updates, and responses
- ✅ **Leaderboard** - Live ranking updates when points change
- ✅ **Time tracking** - See clock in/out events in real-time
- ✅ **Dashboard** - Real-time updates across all metrics

### Ready to Implement:
- 🔜 Typing indicators - Show when someone is typing
- 🔜 Presence system - See who's viewing what page
- 🔜 Notifications - Push notifications to specific users
- 🔜 Direct messaging - Real-time chat between users

## 🎨 UI Indicators

### Online Status Badge
```typescript
import { useWebSocket } from '@/lib/websocket-provider'

function OnlineIndicator() {
  const { isConnected, onlineUsers } = useWebSocket()
  
  return (
    <div className="flex items-center gap-2">
      <span className={isConnected ? 'text-green-500' : 'text-red-500'}>
        {isConnected ? '🟢 Online' : '🔴 Offline'}
      </span>
      <span className="text-sm text-gray-400">
        {onlineUsers} users online
      </span>
    </div>
  )
}
```

## 🔒 Security

- WebSocket connections are scoped to authenticated sessions
- User identification happens after connection via `identify` event
- Only authenticated users can emit/receive events
- Sensitive data should still use HTTPS API calls

## 🐛 Debugging

### Check Connection Status
```typescript
const { socket, isConnected } = useWebSocket()
console.log('Socket ID:', socket?.id)
console.log('Connected:', isConnected)
```

### Monitor All Events (Dev Only)
```javascript
// In browser console
window.__socket = socket
socket.onAny((event, ...args) => {
  console.log('[Socket Event]', event, args)
})
```

## 🚀 Running the Server

```bash
# Development (with WebSockets)
npm run dev

# Development (old way, no WebSockets)
npm run dev:next

# Production
npm run build
npm start

# With Electron
npm run dev:all
```

## 📊 Performance Tips

1. **Use `useCallback`** for event handlers to prevent unnecessary re-subscriptions
2. **Batch updates** when possible - don't emit on every keystroke
3. **Throttle/debounce** frequent events like typing or scrolling
4. **Clean up listeners** - always use cleanup in `useEffect`

## 🔄 Example: Real-Time Task Updates

```typescript
// TaskList.tsx
function TaskList() {
  const [tasks, setTasks] = useState([])
  const { emit } = useWebSocketEmit()
  
  // Listen for task updates from other users
  const handleTaskCreated = useCallback((data) => {
    setTasks(prev => [...prev, data.task])
  }, [])
  
  const handleTaskUpdated = useCallback((data) => {
    setTasks(prev => prev.map(t => 
      t.id === data.taskId ? { ...t, ...data.updates } : t
    ))
  }, [])
  
  useWebSocketEvent('task:created', handleTaskCreated)
  useWebSocketEvent('task:updated', handleTaskUpdated)
  
  // Create task and emit event
  const createTask = async (taskData) => {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    })
    const newTask = await response.json()
    
    // Broadcast to all users
    emit('task:create', newTask)
    
    // Update local state
    setTasks(prev => [...prev, newTask])
  }
  
  return <div>...</div>
}
```

## 🎯 Next Steps

1. Add WebSocket events to remaining features (tasks, tickets, etc.)
2. Implement presence system (typing indicators, active views)
3. Add rooms for team-specific updates
4. Implement message queueing for offline users
5. Add reconnection handling and state recovery

---

For questions or issues, see the [main documentation](./README.md).


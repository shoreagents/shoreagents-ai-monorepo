# 🔌 WebSocket Real-Time Updates - Future Enhancement

**Status:** 📋 **PLANNED** (Not yet implemented)  
**Priority:** 🟡 **Medium** (Add after Windows deployment)  
**Estimated Time:** 3-4 hours  
**Complexity:** Medium

---

## 📖 Overview

This document outlines how to add real-time WebSocket functionality to enable instant dashboard updates when Electron syncs performance data.

**Currently:** Dashboard updates every 5 minutes (manual refresh or auto-sync)  
**With WebSockets:** Dashboard updates instantly when data changes

---

## 🎯 Benefits

### **User Experience**
- ✅ **No manual refresh needed** - Dashboard updates automatically
- ✅ **Live monitoring** - Managers see staff activity in real-time
- ✅ **Instant break notifications** - Team sees who's on break
- ✅ **Multi-user sync** - All open dashboards stay in sync

### **Technical Benefits**
- ✅ **Reduced API calls** - Push updates instead of polling
- ✅ **Better UX** - Modern, responsive feel
- ✅ **Scalable** - Handles multiple concurrent users

---

## 🚫 Why Not Implement Now?

**Current system is sufficient because:**

1. **5-minute sync works** - Acceptable for staff monitoring use case
2. **Manual refresh available** - "Sync Now" button + page refresh
3. **Focus on deployment** - Windows rollout is higher priority
4. **Premature optimization** - Wait for user feedback first

**Add WebSockets when:**
- ✅ You have 10+ active users
- ✅ Managers request real-time updates
- ✅ You need live team dashboards
- ✅ Windows deployment is stable

---

## 🛠️ Implementation Options

### **Option A: Socket.io (Recommended)**

**Pros:**
- Easy to implement
- Auto-reconnection built-in
- Room/namespace support
- Fallback to polling

**Cons:**
- Adds ~200KB to bundle
- Extra dependency

**Time:** ~3 hours

---

### **Option B: Native WebSockets**

**Pros:**
- No extra dependencies
- Lightweight
- Full control

**Cons:**
- More boilerplate
- Manual reconnection logic
- More edge cases

**Time:** ~4-5 hours

---

## 📋 Implementation Guide (Socket.io)

### **Step 1: Install Dependencies (5 min)**

```bash
pnpm add socket.io socket.io-client
```

**Packages:**
- `socket.io` - Server-side WebSocket library
- `socket.io-client` - Client-side WebSocket library

---

### **Step 2: Create WebSocket Server (1 hour)**

Create a new API route for WebSocket connections:

**File:** `app/api/socket/route.ts`

```typescript
import { Server } from 'socket.io'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

// Store io instance globally to prevent multiple servers
let io: Server | null = null

export async function GET(req: NextRequest) {
  if (!io) {
    // Get the HTTP server from Next.js
    const httpServer: any = (req as any).socket?.server
    
    if (!httpServer) {
      return new Response('WebSocket not supported', { status: 500 })
    }

    // Create Socket.io server
    io = new Server(httpServer, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        credentials: true
      }
    })

    // Handle connections
    io.on('connection', (socket) => {
      console.log('[WebSocket] Client connected:', socket.id)

      // Join user-specific room
      socket.on('join-user', (userId: string) => {
        socket.join(`user-${userId}`)
        console.log(`[WebSocket] User ${userId} joined their room`)
      })

      // Join team room (for managers)
      socket.on('join-team', (teamId: string) => {
        socket.join(`team-${teamId}`)
        console.log(`[WebSocket] Joined team room: ${teamId}`)
      })

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('[WebSocket] Client disconnected:', socket.id)
      })
    })

    console.log('[WebSocket] Server initialized')
  }

  return new Response('WebSocket server running', { status: 200 })
}

// Export io instance for use in other files
export function getSocketServer() {
  return io
}
```

---

### **Step 3: Emit from API Route (30 min)**

Update the performance API to emit WebSocket events:

**File:** `app/api/performance/route.ts`

```typescript
import { getSocketServer } from '../socket/route'

export async function POST(request: NextRequest) {
  // ... existing code to save metrics ...

  const result = await prisma.performanceMetric.upsert({
    // ... existing upsert logic ...
  })

  // Emit WebSocket event after successful save
  const io = getSocketServer()
  if (io) {
    // Notify the specific user
    io.to(`user-${session.user.id}`).emit('performance-update', {
      userId: session.user.id,
      metrics: result,
      timestamp: Date.now()
    })

    // Also notify team room if user has a team
    if (session.user.teamId) {
      io.to(`team-${session.user.teamId}`).emit('team-performance-update', {
        userId: session.user.id,
        metrics: result,
        timestamp: Date.now()
      })
    }

    console.log('[WebSocket] Performance update emitted')
  }

  return NextResponse.json({ success: true, metric: result }, { status: 201 })
}
```

---

### **Step 4: Optional - Emit from Electron (15 min)**

If you want Electron to emit directly (bypasses API):

**File:** `electron/services/syncService.js`

```javascript
async sendMetrics(metrics) {
  // ... existing sync code ...
  
  if (success) {
    try {
      // Emit WebSocket event after successful sync
      const io = require('socket.io-client')
      const socket = io(config.API_BASE_URL, {
        path: '/api/socket',
        transports: ['websocket']
      })
      
      socket.emit('performance-update', {
        userId: this.userId,
        metrics: metrics,
        timestamp: Date.now()
      })
      
      // Clean up
      setTimeout(() => socket.disconnect(), 1000)
      
      this.log('WebSocket event emitted')
    } catch (err) {
      this.log(`WebSocket emit error: ${err.message}`)
      // Don't fail sync if WebSocket fails
    }
  }
}
```

---

### **Step 5: Listen in Frontend (1 hour)**

Update the performance dashboard to listen for WebSocket events:

**File:** `components/performance-dashboard.tsx`

```typescript
import { useEffect } from 'react'
import { io, Socket } from 'socket.io-client'
import { useSession } from 'next-auth/react'

export default function PerformanceDashboard() {
  const { data: session } = useSession()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Initialize WebSocket connection
  useEffect(() => {
    if (!session?.user?.id) return

    // Initialize socket connection
    const socketInstance = io({
      path: '/api/socket',
      transports: ['websocket', 'polling']
    })

    socketInstance.on('connect', () => {
      console.log('[WebSocket] Connected:', socketInstance.id)
      
      // Join user's room
      socketInstance.emit('join-user', session.user.id)
      
      // Managers can join team room
      if (session.user.role === 'MANAGER' && session.user.teamId) {
        socketInstance.emit('join-team', session.user.teamId)
      }
    })

    socketInstance.on('disconnect', () => {
      console.log('[WebSocket] Disconnected')
    })

    socketInstance.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error)
    })

    // Listen for performance updates
    socketInstance.on('performance-update', (data) => {
      console.log('[WebSocket] Performance update received:', data)
      
      // Refresh metrics without page reload
      fetchMetrics()
      setLastUpdate(new Date())
      
      // Optional: Show toast notification
      toast.success('Performance data updated')
    })

    // Listen for team updates (managers only)
    if (session.user.role === 'MANAGER') {
      socketInstance.on('team-performance-update', (data) => {
        console.log('[WebSocket] Team update received:', data)
        // Refresh team dashboard
        fetchTeamMetrics()
      })
    }

    setSocket(socketInstance)

    // Cleanup on unmount
    return () => {
      if (socketInstance) {
        socketInstance.disconnect()
      }
    }
  }, [session?.user?.id])

  // Rest of component...
  
  return (
    <div>
      {/* Show connection status */}
      {socket && (
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${
            socket.connected ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className="text-xs text-slate-400">
            {socket.connected ? 'Live' : 'Offline'}
          </span>
          {lastUpdate && (
            <span className="text-xs text-slate-500">
              Updated {new Date(lastUpdate).toLocaleTimeString()}
            </span>
          )}
        </div>
      )}
      
      {/* Rest of dashboard */}
    </div>
  )
}
```

---

### **Step 6: Add Connection Status Indicator (30 min)**

**File:** `components/websocket-status.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { Wifi, WifiOff } from 'lucide-react'

export default function WebSocketStatus({ socket }) {
  const [connected, setConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    if (!socket) return

    const handleConnect = () => setConnected(true)
    const handleDisconnect = () => setConnected(false)
    const handleUpdate = () => setLastUpdate(new Date())

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('performance-update', handleUpdate)

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('performance-update', handleUpdate)
    }
  }, [socket])

  if (!socket) return null

  return (
    <div className="fixed bottom-4 right-4 flex items-center gap-2 rounded-lg bg-slate-800/90 px-3 py-2 text-sm shadow-lg backdrop-blur-sm">
      {connected ? (
        <Wifi className="h-4 w-4 text-green-400" />
      ) : (
        <WifiOff className="h-4 w-4 text-red-400" />
      )}
      <div className="flex flex-col">
        <span className={connected ? 'text-green-400' : 'text-red-400'}>
          {connected ? 'Connected' : 'Disconnected'}
        </span>
        {lastUpdate && (
          <span className="text-xs text-slate-500">
            Last update: {lastUpdate.toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  )
}
```

---

## 🧪 Testing Checklist

### **Basic Functionality**
- [ ] WebSocket server starts without errors
- [ ] Client connects successfully
- [ ] Client can join user room
- [ ] Events are emitted from API
- [ ] Events are received in frontend
- [ ] Dashboard refreshes on event

### **Reconnection**
- [ ] Client reconnects after disconnect
- [ ] Rejoins rooms after reconnect
- [ ] No duplicate connections

### **Multi-User**
- [ ] Multiple users can connect simultaneously
- [ ] Each user only receives their own updates
- [ ] Managers receive team updates

### **Performance**
- [ ] No memory leaks
- [ ] Connections close properly
- [ ] Server handles 50+ concurrent connections

### **Error Handling**
- [ ] Graceful degradation if WebSocket fails
- [ ] Falls back to polling if needed
- [ ] Error messages are logged

---

## 🚀 Deployment Considerations

### **Production Environment**

1. **Update Environment Variables:**

```env
# .env.production
NEXTAUTH_URL=https://your-domain.com
WEBSOCKET_CORS_ORIGIN=https://your-domain.com
```

2. **Enable WebSocket in Hosting:**

If deploying to Vercel:
- ⚠️ Vercel doesn't support WebSockets in serverless functions
- Use Vercel Edge Functions or external WebSocket service

**Alternatives:**
- **Railway.app** - Full WebSocket support
- **Render.com** - Full WebSocket support
- **AWS EC2/ECS** - Full control
- **Pusher/Ably** - Managed WebSocket service

3. **Nginx Configuration (if self-hosting):**

```nginx
location /api/socket {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

---

## 📊 Performance Impact

### **Resource Usage**

**Per Connection:**
- Memory: ~50KB per active connection
- CPU: < 0.5% per 100 connections
- Network: ~1-5KB/sec per active user

**With 50 Users:**
- Memory: ~2.5 MB
- CPU: < 1%
- Network: ~50-250 KB/sec

**Verdict:** Minimal impact on modern servers

---

## 🎨 UI Enhancements

### **Real-Time Animations**

Add smooth transitions when data updates:

```tsx
import { motion } from 'framer-motion'

<motion.div
  key={metrics.activeTime}
  initial={{ scale: 1.05, opacity: 0.8 }}
  animate={{ scale: 1, opacity: 1 }}
  transition={{ duration: 0.3 }}
>
  {metrics.activeTime} minutes
</motion.div>
```

### **Toast Notifications**

Show when data updates:

```tsx
import { toast } from 'sonner'

socketInstance.on('performance-update', () => {
  toast.success('Performance data updated', {
    duration: 2000
  })
})
```

### **Pulse Effect**

Add to "Live" badge:

```tsx
<div className="relative">
  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
</div>
```

---

## 🔧 Troubleshooting

### **Issue: WebSocket won't connect**

**Causes:**
- Port already in use
- CORS misconfiguration
- Firewall blocking

**Solutions:**
```bash
# Check if port is available
lsof -i :3000

# Check CORS settings in socket server
# Ensure origin matches NEXTAUTH_URL
```

---

### **Issue: Events not received**

**Causes:**
- Not joined to correct room
- Event name mismatch
- Connection dropped

**Debug:**
```typescript
socket.onAny((eventName, ...args) => {
  console.log('[WebSocket] Received:', eventName, args)
})
```

---

### **Issue: Memory leak**

**Causes:**
- Socket not disconnecting
- Event listeners not removed

**Fix:**
```typescript
useEffect(() => {
  // ... socket setup ...
  
  return () => {
    if (socket) {
      socket.removeAllListeners()
      socket.disconnect()
    }
  }
}, [])
```

---

## 📚 Additional Resources

### **Documentation**
- Socket.io: https://socket.io/docs/v4/
- Next.js WebSocket: https://nextjs.org/docs/api-routes/websocket
- Electron IPC: https://www.electronjs.org/docs/latest/api/ipc-main

### **Examples**
- Socket.io Chat: https://github.com/socketio/socket.io/tree/main/examples/chat
- Next.js WebSocket: https://github.com/vercel/next.js/tree/canary/examples/with-websockets

---

## 🎯 Implementation Priority

**Phase 1 (Now):** ✅ **COMPLETE**
- [x] Basic tracking
- [x] Database sync
- [x] 5-minute intervals
- [x] Manual refresh

**Phase 2 (After Windows Deployment):** 🔄 **IN PROGRESS**
- [ ] Deploy to Windows
- [ ] Get user feedback
- [ ] Monitor usage patterns

**Phase 3 (If Needed):** 📋 **PLANNED**
- [ ] Add auto-refresh (quick win)
- [ ] WebSockets (if real-time needed)
- [ ] Advanced team dashboards

---

## ✅ Decision Checklist

**Add WebSockets if you answer "YES" to 3+ questions:**

- [ ] Do managers need updates faster than 5 minutes?
- [ ] Are there 10+ concurrent dashboard users?
- [ ] Do you need live team monitoring?
- [ ] Is instant break notification critical?
- [ ] Will you deploy to WebSocket-capable hosting?
- [ ] Do you have 3-4 hours for implementation?
- [ ] Is the Windows deployment stable?

**If mostly "NO":** Stick with current system. It works!

---

## 🚀 Quick Start (When Ready)

```bash
# 1. Install dependencies
pnpm add socket.io socket.io-client

# 2. Create WebSocket server
# Copy code from Step 2 above

# 3. Update API routes
# Copy code from Step 3 above

# 4. Update frontend
# Copy code from Step 5 above

# 5. Test
pnpm dev
# Open 2 browser windows
# Login as different users
# Watch real-time updates
```

---

## 📝 Final Notes

**Current System:**
- ✅ Works perfectly for staff monitoring
- ✅ 5-minute sync is acceptable
- ✅ "Sync Now" button available
- ✅ Simple and reliable

**With WebSockets:**
- ✨ Better UX (no refresh needed)
- ✨ Real-time feel
- ⚠️ More complexity
- ⚠️ Hosting limitations

**Recommendation:** Wait for user feedback before adding. Current system is production-ready!

---

**Last Updated:** October 11, 2025  
**Status:** Documentation complete, implementation pending  
**Next Review:** After Windows deployment is stable


/**
 * Daily.co Video Interview Integration
 * 
 * Creates and manages video interview rooms using Daily.co API
 */

interface DailyRoomConfig {
  name?: string
  privacy?: 'public' | 'private'
  properties?: {
    exp?: number // Unix timestamp for room expiration
    enable_recording?: string // 'cloud' | 'local' | 'rtp-tracks'
    enable_chat?: boolean
    enable_screenshare?: boolean
    start_video_off?: boolean
    start_audio_off?: boolean
    owner_only_broadcast?: boolean
    enable_knocking?: boolean
    enable_prejoin_ui?: boolean
    max_participants?: number
  }
}

interface DailyRoom {
  id: string
  name: string
  url: string
  api_created: boolean
  privacy: string
  config: any
  created_at: string
}

/**
 * Create a Daily.co room for an interview
 * @param config Room configuration
 * @returns Room details including URL
 */
export async function createDailyRoom(config?: DailyRoomConfig): Promise<DailyRoom> {
  const DAILY_API_KEY = process.env.DAILY_API_KEY

  if (!DAILY_API_KEY) {
    throw new Error('DAILY_API_KEY not configured in environment variables')
  }

  // Default configuration for interview rooms
  const defaultConfig: DailyRoomConfig = {
    privacy: 'private',
    properties: {
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 3), // 3 hours from now
      enable_recording: 'cloud', // Record all interviews
      enable_chat: true,
      enable_screenshare: true,
      start_video_off: false,
      start_audio_off: false,
      enable_knocking: true, // Candidates must wait to be admitted
      enable_prejoin_ui: true, // Allow camera/mic test before joining
      max_participants: 3, // Client, candidate, optionally an admin
    },
    ...config,
  }

  try {
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(defaultConfig),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Daily.co API error: ${error.error || response.statusText}`)
    }

    const room: DailyRoom = await response.json()
    
    console.log('✅ Daily.co room created:', room.name)
    
    return room
  } catch (error) {
    console.error('❌ Failed to create Daily.co room:', error)
    throw error
  }
}

/**
 * Delete a Daily.co room
 * @param roomName Room name to delete
 */
export async function deleteDailyRoom(roomName: string): Promise<void> {
  const DAILY_API_KEY = process.env.DAILY_API_KEY

  if (!DAILY_API_KEY) {
    throw new Error('DAILY_API_KEY not configured in environment variables')
  }

  try {
    const response = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Daily.co API error: ${error.error || response.statusText}`)
    }

    console.log('✅ Daily.co room deleted:', roomName)
  } catch (error) {
    console.error('❌ Failed to delete Daily.co room:', error)
    throw error
  }
}

/**
 * Get Daily.co room info
 * @param roomName Room name
 * @returns Room details
 */
export async function getDailyRoom(roomName: string): Promise<DailyRoom> {
  const DAILY_API_KEY = process.env.DAILY_API_KEY

  if (!DAILY_API_KEY) {
    throw new Error('DAILY_API_KEY not configured in environment variables')
  }

  try {
    const response = await fetch(`https://api.daily.co/v1/rooms/${roomName}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Daily.co API error: ${error.error || response.statusText}`)
    }

    const room: DailyRoom = await response.json()
    return room
  } catch (error) {
    console.error('❌ Failed to get Daily.co room:', error)
    throw error
  }
}

/**
 * Generate a unique room name for an interview
 * @param clientName Client name
 * @param candidateName Candidate name
 * @returns Unique room name
 */
export function generateInterviewRoomName(clientName: string, candidateName: string): string {
  const timestamp = Date.now()
  const sanitize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '-')
  
  return `interview-${sanitize(clientName)}-${sanitize(candidateName)}-${timestamp}`
}


"use client"

import { useState, useEffect } from "react"
import { ThumbsUp, Heart, PartyPopper, Flame, Hand, Laugh, Angry, Rocket, Zap, Brain, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

/**
 * 🎉 UNIVERSAL REACTION BAR COMPONENT
 * 
 * Works EVERYWHERE across the platform:
 * - Tickets (staff, client, management)
 * - Tasks
 * - Documents
 * - Posts
 * - Reviews
 * - Comments (yes, react to comments!)
 * - Onboarding
 * - Etc.
 * 
 * Reaction Types:
 * 👍 LIKE, ❤️ LOVE, 🎉 CELEBRATE, 🔥 FIRE, 👏 CLAP,
 * 😂 LAUGH, 💩 POO, 🚀 ROCKET, 😲 SHOCKED, 🤯 MIND_BLOWN
 * 
 * Usage:
 * <ReactionBar 
 *   reactableType="TICKET" 
 *   reactableId={ticketId} 
 *   variant="staff"  // Changes styling based on portal
 * />
 */

interface ReactionBarProps {
  reactableType: string  // TICKET, TASK, DOCUMENT, POST, COMMENT, etc.
  reactableId: string
  variant?: 'staff' | 'client' | 'management'  // Portal styling
  size?: 'sm' | 'md' | 'lg'  // Size of reaction buttons
  showCount?: boolean  // Show reaction counts
  animated?: boolean  // Add animations on click
}

interface Reaction {
  count: number
  users: Array<{
    userId: string
    userName: string
    userAvatar: string | null
    userType: string
  }>
}

interface ReactionData {
  [key: string]: Reaction
}

export function ReactionBar({
  reactableType,
  reactableId,
  variant = 'staff',
  size = 'md',
  showCount = true,
  animated = true
}: ReactionBarProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [reacting, setReacting] = useState(false)
  const [reactions, setReactions] = useState<ReactionData>({})
  const [userReaction, setUserReaction] = useState<string | null>(null)
  const [totalReactions, setTotalReactions] = useState(0)
  const [animatingReaction, setAnimatingReaction] = useState<string | null>(null)

  // Fetch reactions on mount
  useEffect(() => {
    fetchReactions()
  }, [reactableType, reactableId])

  const fetchReactions = async () => {
    try {
      setLoading(true)
      const res = await fetch(
        `/api/reactions?reactableType=${reactableType}&reactableId=${reactableId}`
      )
      
      if (!res.ok) {
        throw new Error('Failed to fetch reactions')
      }

      const data = await res.json()
      setReactions(data.reactions || {})
      setUserReaction(data.userReaction)
      setTotalReactions(data.totalReactions || 0)
    } catch (error) {
      console.error('Error fetching reactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReaction = async (reactionType: string) => {
    try {
      setReacting(true)

      // Animate the reaction
      if (animated) {
        setAnimatingReaction(reactionType)
        setTimeout(() => setAnimatingReaction(null), 600)
      }

      // If user already has this reaction, remove it
      if (userReaction === reactionType) {
        const res = await fetch(
          `/api/reactions?reactableType=${reactableType}&reactableId=${reactableId}`,
          { method: 'DELETE' }
        )

        if (!res.ok) {
          throw new Error('Failed to remove reaction')
        }

        toast({
          title: "Reaction removed",
          description: "Your reaction has been removed",
          variant: "success"
        })
      } else {
        // Add or change reaction
        const res = await fetch('/api/reactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reactableType,
            reactableId,
            reactionType
          })
        })

        if (!res.ok) {
          throw new Error('Failed to add reaction')
        }

        const data = await res.json()
        toast({
          title: userReaction ? "Reaction changed" : "Reaction added",
          description: data.message,
          variant: "success"
        })
      }

      // Refresh reactions
      await fetchReactions()

    } catch (error) {
      console.error('Error handling reaction:', error)
      toast({
        title: "Error",
        description: "Failed to update reaction",
        variant: "destructive"
      })
    } finally {
      setReacting(false)
    }
  }

  // Get portal-specific styling classes
  const getVariantClasses = () => {
    switch (variant) {
      case 'staff':
        return {
          container: 'bg-slate-900/50 backdrop-blur-sm border-slate-700',
          button: 'hover:bg-slate-800 border-slate-700',
          buttonActive: 'bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border-indigo-500',
          text: 'text-slate-300',
          count: 'text-slate-400'
        }
      case 'client':
        return {
          container: 'bg-gray-50 border-gray-200',
          button: 'hover:bg-gray-100 border-gray-200',
          buttonActive: 'bg-blue-50 border-blue-400',
          text: 'text-gray-700',
          count: 'text-gray-500'
        }
      case 'management':
        return {
          container: 'bg-slate-900/70 backdrop-blur-md border-slate-700',
          button: 'hover:bg-slate-800 border-slate-700 hover:shadow-lg hover:shadow-purple-500/20',
          buttonActive: 'bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border-purple-500 shadow-lg shadow-purple-500/30',
          text: 'text-slate-200',
          count: 'text-slate-400'
        }
    }
  }

  const classes = getVariantClasses()

  // Get button size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-7 px-2 text-xs'
      case 'md':
        return 'h-9 px-3 text-sm'
      case 'lg':
        return 'h-11 px-4 text-base'
    }
  }

  const sizeClasses = getSizeClasses()

  // Define reaction types with emojis and icons
  const reactionTypes = [
    { type: 'LIKE', emoji: '👍', icon: ThumbsUp, label: 'Like' },
    { type: 'LOVE', emoji: '❤️', icon: Heart, label: 'Love' },
    { type: 'CELEBRATE', emoji: '🎉', icon: PartyPopper, label: 'Celebrate' },
    { type: 'FIRE', emoji: '🔥', icon: Flame, label: 'Fire' },
    { type: 'CLAP', emoji: '👏', icon: Hand, label: 'Clap' },
    { type: 'LAUGH', emoji: '😂', icon: Laugh, label: 'Laugh' },
    { type: 'ROCKET', emoji: '🚀', icon: Rocket, label: 'Rocket' },
    { type: 'SHOCKED', emoji: '😲', icon: Zap, label: 'Shocked' },
    { type: 'MIND_BLOWN', emoji: '🤯', icon: Brain, label: 'Mind Blown' }
  ]

  if (loading) {
    return (
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${classes.container}`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className={`text-xs ${classes.text}`}>Loading reactions...</span>
      </div>
    )
  }

  return (
    <div className={`inline-flex items-center gap-2 p-2 rounded-lg border ${classes.container}`}>
      <TooltipProvider>
        {reactionTypes.map(({ type, emoji, icon: Icon, label }) => {
          const reactionData = reactions[type]
          const count = reactionData?.count || 0
          const isActive = userReaction === type
          const isAnimating = animatingReaction === type

          return (
            <Tooltip key={type}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleReaction(type)}
                  disabled={reacting}
                  className={`
                    relative inline-flex items-center gap-1.5 ${sizeClasses} 
                    rounded-md border transition-all duration-200
                    ${isActive ? classes.buttonActive : classes.button}
                    ${isAnimating && animated ? 'animate-bounce' : ''}
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  <span 
                    className={`text-lg leading-none ${isAnimating && animated ? 'scale-150 transition-transform duration-300' : ''}`}
                  >
                    {emoji}
                  </span>
                  {showCount && count > 0 && (
                    <span className={`font-semibold ${isActive ? classes.text : classes.count}`}>
                      {count}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent className={variant === 'client' ? 'bg-white' : 'bg-slate-800'}>
                <div>
                  <p className="font-semibold">{label}</p>
                  {reactionData && reactionData.users.length > 0 && (
                    <div className="mt-1 text-xs opacity-80">
                      {reactionData.users.slice(0, 3).map((user, i) => (
                        <div key={i}>{user.userName}</div>
                      ))}
                      {reactionData.users.length > 3 && (
                        <div>+ {reactionData.users.length - 3} more</div>
                      )}
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </TooltipProvider>

      {/* Total count separator */}
      {showCount && totalReactions > 0 && (
        <div className={`ml-2 pl-2 border-l border-inherit ${classes.count} text-xs font-medium`}>
          {totalReactions} {totalReactions === 1 ? 'reaction' : 'reactions'}
        </div>
      )}
    </div>
  )
}

/**
 * Compact version - just shows emoji counts, click to expand
 */
export function ReactionBarCompact({
  reactableType,
  reactableId,
  variant = 'staff',
  onExpand
}: ReactionBarProps & { onExpand?: () => void }) {
  const [loading, setLoading] = useState(true)
  const [reactions, setReactions] = useState<ReactionData>({})
  const [totalReactions, setTotalReactions] = useState(0)

  useEffect(() => {
    fetchReactions()
  }, [reactableType, reactableId])

  const fetchReactions = async () => {
    try {
      setLoading(true)
      const res = await fetch(
        `/api/reactions?reactableType=${reactableType}&reactableId=${reactableId}`
      )
      
      if (!res.ok) return

      const data = await res.json()
      setReactions(data.reactions || {})
      setTotalReactions(data.totalReactions || 0)
    } catch (error) {
      console.error('Error fetching reactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const getVariantClasses = () => {
    switch (variant) {
      case 'staff':
        return {
          button: 'hover:bg-slate-800 border-slate-700 text-slate-300',
          text: 'text-slate-400'
        }
      case 'client':
        return {
          button: 'hover:bg-gray-100 border-gray-200 text-gray-700',
          text: 'text-gray-500'
        }
      case 'management':
        return {
          button: 'hover:bg-slate-800 border-slate-700 text-slate-200 hover:shadow-lg hover:shadow-purple-500/20',
          text: 'text-slate-400'
        }
    }
  }

  const classes = getVariantClasses()

  // Define emojis for compact display
  const emojiMap: { [key: string]: string } = {
    LIKE: '👍',
    LOVE: '❤️',
    CELEBRATE: '🎉',
    FIRE: '🔥',
    CLAP: '👏',
    LAUGH: '😂',
    ROCKET: '🚀',
    SHOCKED: '😲',
    MIND_BLOWN: '🤯'
  }

  if (loading || totalReactions === 0) {
    return null
  }

  // Get top 3 reactions
  const topReactions = Object.entries(reactions)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 3)

  return (
    <button
      onClick={onExpand}
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border
        transition-all duration-200 ${classes.button}
      `}
    >
      {topReactions.map(([type, data]) => (
        <span key={type} className="inline-flex items-center gap-0.5 text-sm">
          <span>{emojiMap[type]}</span>
          <span className={`font-medium ${classes.text}`}>{data.count}</span>
        </span>
      ))}
      {totalReactions > 0 && (
        <span className={`text-xs font-medium ${classes.text}`}>
          · {totalReactions}
        </span>
      )}
    </button>
  )
}


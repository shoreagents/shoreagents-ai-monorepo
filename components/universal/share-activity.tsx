"use client"

import { useState } from "react"
import { Share2, Sparkles, Send, X, Loader2, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

/**
 * 📢 UNIVERSAL SHARE ACTIVITY COMPONENT
 * 
 * Works EVERYWHERE across the platform:
 * - Onboarding completion 🎉
 * - Performance reviews ⭐
 * - Milestones reached 🏆
 * - Tasks completed ✅
 * - Certifications earned 📜
 * - Anniversaries 🎂
 * - Promotions 🚀
 * - First week/month complete 💪
 * 
 * User-controlled: Staff CHOOSE what to share!
 * No auto-posting spam!
 * 
 * Usage:
 * <ShareActivityButton 
 *   activityType="ONBOARDING_COMPLETE" 
 *   activityId={onboardingId}
 *   variant="staff"
 *   trigger="button"  // or "modal"
 * />
 */

interface ShareActivityButtonProps {
  activityType: string  // ONBOARDING_COMPLETE, PERFORMANCE_REVIEW, etc.
  activityId: string
  variant?: 'staff' | 'client' | 'management'  // Portal styling
  trigger?: 'button' | 'modal' | 'inline'  // How to trigger
  defaultMessage?: string  // Pre-fill message
  onSuccess?: () => void  // Callback after successful share
  autoOpen?: boolean  // Auto-open modal on mount
}

export function ShareActivityButton({
  activityType,
  activityId,
  variant = 'staff',
  trigger = 'button',
  defaultMessage = '',
  onSuccess,
  autoOpen = false
}: ShareActivityButtonProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(autoOpen)
  const [message, setMessage] = useState(defaultMessage)
  const [sharing, setSharing] = useState(false)
  const [shared, setShared] = useState(false)

  const handleShare = async () => {
    try {
      setSharing(true)

      const res = await fetch('/api/shared-activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityType,
          activityId,
          message: message.trim() || null
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to share activity')
      }

      const data = await res.json()

      setShared(true)
      toast({
        title: "🎉 Shared!",
        description: "Your achievement has been shared to the feed!",
        variant: "success"
      })

      // Close modal after short delay
      setTimeout(() => {
        setOpen(false)
        onSuccess?.()
      }, 1500)

    } catch (error) {
      console.error('Error sharing activity:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to share activity",
        variant: "destructive"
      })
    } finally {
      setSharing(false)
    }
  }

  // Get portal-specific styling classes
  const getVariantClasses = () => {
    switch (variant) {
      case 'staff':
        return {
          button: 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white',
          modal: 'bg-slate-900 border-slate-700',
          input: 'bg-slate-800 border-slate-600 text-slate-100 focus:ring-indigo-500',
          text: 'text-slate-200',
          muted: 'text-slate-400',
          icon: 'text-indigo-400'
        }
      case 'client':
        return {
          button: 'bg-blue-600 hover:bg-blue-700 text-white',
          modal: 'bg-white border-gray-200',
          input: 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500',
          text: 'text-gray-900',
          muted: 'text-gray-500',
          icon: 'text-blue-600'
        }
      case 'management':
        return {
          button: 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg hover:shadow-purple-500/30 text-white',
          modal: 'bg-slate-900 border-slate-700',
          input: 'bg-slate-800 border-slate-600 text-slate-100 focus:ring-purple-500',
          text: 'text-slate-100',
          muted: 'text-slate-400',
          icon: 'text-purple-400'
        }
    }
  }

  const classes = getVariantClasses()

  // Get activity display info
  const getActivityInfo = () => {
    const activityMap: { [key: string]: { emoji: string; title: string; description: string } } = {
      ONBOARDING_COMPLETE: {
        emoji: '🎉',
        title: 'Onboarding Complete!',
        description: 'You\'ve completed your onboarding journey. Welcome to the team!'
      },
      PERFORMANCE_REVIEW: {
        emoji: '⭐',
        title: 'Performance Review',
        description: 'Share your latest performance review with the team'
      },
      MILESTONE_REACHED: {
        emoji: '🏆',
        title: 'Milestone Reached!',
        description: 'You\'ve hit an important milestone in your journey'
      },
      TASK_COMPLETED: {
        emoji: '✅',
        title: 'Task Completed',
        description: 'Celebrate completing an important task'
      },
      CERTIFICATION_EARNED: {
        emoji: '📜',
        title: 'Certification Earned!',
        description: 'You\'ve earned a new certification'
      },
      ANNIVERSARY: {
        emoji: '🎂',
        title: 'Work Anniversary!',
        description: 'Celebrate your time with the company'
      },
      PROMOTION: {
        emoji: '🚀',
        title: 'Promoted!',
        description: 'You\'ve been promoted! Congratulations!'
      },
      CONTRACT_SIGNED: {
        emoji: '📝',
        title: 'Contract Signed',
        description: 'You\'ve officially joined the team'
      },
      FIRST_WEEK_COMPLETE: {
        emoji: '💪',
        title: 'First Week Complete!',
        description: 'You\'ve made it through your first week'
      },
      FIRST_MONTH_COMPLETE: {
        emoji: '🌟',
        title: 'First Month Complete!',
        description: 'One month down, many more to go!'
      }
    }

    return activityMap[activityType] || {
      emoji: '🎉',
      title: 'Achievement',
      description: 'Share your achievement with the team'
    }
  }

  const activityInfo = getActivityInfo()

  // Render trigger button (if trigger === 'button')
  if (trigger === 'button') {
    return (
      <>
        <Button
          onClick={() => setOpen(true)}
          className={`gap-2 ${classes.button}`}
          disabled={shared}
        >
          {shared ? (
            <>
              <Check className="h-4 w-4" />
              Shared!
            </>
          ) : (
            <>
              <Share2 className="h-4 w-4" />
              Share to Feed
            </>
          )}
        </Button>

        <ShareActivityModal
          open={open}
          onOpenChange={setOpen}
          activityInfo={activityInfo}
          message={message}
          setMessage={setMessage}
          sharing={sharing}
          shared={shared}
          handleShare={handleShare}
          variant={variant}
          classes={classes}
        />
      </>
    )
  }

  // Render modal only (if trigger === 'modal')
  if (trigger === 'modal') {
    return (
      <ShareActivityModal
        open={open}
        onOpenChange={setOpen}
        activityInfo={activityInfo}
        message={message}
        setMessage={setMessage}
        sharing={sharing}
        shared={shared}
        handleShare={handleShare}
        variant={variant}
        classes={classes}
      />
    )
  }

  // Render inline (minimal UI)
  return (
    <div className={`p-4 rounded-lg border ${variant === 'client' ? 'bg-blue-50 border-blue-200' : 'bg-slate-800/50 border-slate-700'}`}>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl">{activityInfo.emoji}</span>
        <div>
          <h4 className={`font-semibold ${classes.text}`}>{activityInfo.title}</h4>
          <p className={`text-sm ${classes.muted}`}>{activityInfo.description}</p>
        </div>
      </div>
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Add a message (optional)"
        className={`mb-3 ${classes.input}`}
        disabled={sharing || shared}
      />
      <Button
        onClick={handleShare}
        disabled={sharing || shared}
        className={`w-full gap-2 ${classes.button}`}
      >
        {sharing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sharing...
          </>
        ) : shared ? (
          <>
            <Check className="h-4 w-4" />
            Shared!
          </>
        ) : (
          <>
            <Share2 className="h-4 w-4" />
            Share to Feed
          </>
        )}
      </Button>
    </div>
  )
}

// Internal modal component
function ShareActivityModal({
  open,
  onOpenChange,
  activityInfo,
  message,
  setMessage,
  sharing,
  shared,
  handleShare,
  variant,
  classes
}: any) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`sm:max-w-md ${classes.modal}`}>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-3 rounded-full ${variant === 'client' ? 'bg-blue-100' : 'bg-slate-800'}`}>
              <Sparkles className={`h-6 w-6 ${classes.icon}`} />
            </div>
            <div>
              <DialogTitle className={classes.text}>
                Share Your Achievement
              </DialogTitle>
              <DialogDescription className={classes.muted}>
                Celebrate with your team!
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {shared ? (
          // Success state
          <div className="text-center py-8">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${variant === 'client' ? 'bg-green-100' : 'bg-green-500/20'}`}>
              <Check className={`h-8 w-8 ${variant === 'client' ? 'text-green-600' : 'text-green-400'}`} />
            </div>
            <h3 className={`text-xl font-semibold mb-2 ${classes.text}`}>
              🎉 Shared Successfully!
            </h3>
            <p className={classes.muted}>
              Your achievement is now visible in the feed
            </p>
          </div>
        ) : (
          // Share form
          <div className="space-y-4">
            {/* Activity preview */}
            <div className={`p-4 rounded-lg border ${variant === 'client' ? 'bg-blue-50 border-blue-200' : 'bg-slate-800/50 border-slate-700'}`}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{activityInfo.emoji}</span>
                <div>
                  <h4 className={`font-semibold ${classes.text}`}>{activityInfo.title}</h4>
                  <p className={`text-sm ${classes.muted}`}>{activityInfo.description}</p>
                </div>
              </div>
            </div>

            {/* Message input */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${classes.text}`}>
                Add a message (optional)
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share your thoughts, feelings, or what this means to you..."
                className={`min-h-[100px] ${classes.input}`}
                disabled={sharing}
              />
              <p className={`text-xs mt-1 ${classes.muted}`}>
                Max 500 characters
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={() => onOpenChange(false)}
                variant="outline"
                className="flex-1"
                disabled={sharing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleShare}
                disabled={sharing}
                className={`flex-1 gap-2 ${classes.button}`}
              >
                {sharing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sharing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Share to Feed
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

/**
 * Helper function to trigger share modal from anywhere
 */
export function useShareActivity() {
  const [shareData, setShareData] = useState<{
    activityType: string
    activityId: string
    variant?: 'staff' | 'client' | 'management'
    defaultMessage?: string
  } | null>(null)

  const openShareModal = (data: {
    activityType: string
    activityId: string
    variant?: 'staff' | 'client' | 'management'
    defaultMessage?: string
  }) => {
    setShareData(data)
  }

  const closeShareModal = () => {
    setShareData(null)
  }

  return {
    openShareModal,
    closeShareModal,
    ShareModal: shareData ? (
      <ShareActivityButton
        activityType={shareData.activityType}
        activityId={shareData.activityId}
        variant={shareData.variant}
        defaultMessage={shareData.defaultMessage}
        trigger="modal"
        autoOpen={true}
        onSuccess={closeShareModal}
      />
    ) : null
  }
}


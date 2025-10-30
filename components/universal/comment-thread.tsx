"use client"

import { useState, useEffect } from "react"
import { MessageCircle, Send, Edit2, Trash2, Reply, MoreVertical, Loader2, Paperclip, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"

/**
 * 🌍 UNIVERSAL COMMENT THREAD COMPONENT
 * 
 * Works EVERYWHERE across the platform:
 * - Tickets (staff, client, management)
 * - Tasks
 * - Documents
 * - Posts
 * - Reviews
 * - Onboarding
 * - Job Acceptances
 * - Etc.
 * 
 * Usage:
 * <CommentThread 
 *   commentableType="TICKET" 
 *   commentableId={ticketId} 
 *   variant="staff"  // Changes styling based on portal
 * />
 */

interface CommentThreadProps {
  commentableType: string  // TICKET, TASK, DOCUMENT, POST, etc.
  commentableId: string
  variant?: 'staff' | 'client' | 'management'  // Portal styling
  autoFocus?: boolean  // Auto-focus text input on mount
  maxHeight?: string   // Max height for scrolling (e.g., "500px")
}

interface Comment {
  id: string
  userId: string
  userType: 'STAFF' | 'CLIENT' | 'MANAGEMENT' | 'SYSTEM'
  userName: string
  userAvatar: string | null
  content: string
  attachments: string[]
  parentId: string | null
  isEdited: boolean
  editedAt: Date | null
  createdAt: Date
  updatedAt: Date
  replies?: Comment[]
}

export function CommentThread({
  commentableType,
  commentableId,
  variant = 'staff',
  autoFocus = false,
  maxHeight = '600px'
}: CommentThreadProps) {
  const { toast } = useToast()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  // Fetch comments on mount
  useEffect(() => {
    fetchComments()
  }, [commentableType, commentableId])

  const fetchComments = async () => {
    try {
      setLoading(true)
      const res = await fetch(
        `/api/comments?commentableType=${commentableType}&commentableId=${commentableId}`
      )
      
      if (!res.ok) {
        throw new Error('Failed to fetch comments')
      }

      const data = await res.json()
      setComments(data.comments || [])
    } catch (error) {
      console.error('Error fetching comments:', error)
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (parentId: string | null = null) => {
    const content = parentId ? editContent : newComment

    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Comment cannot be empty",
        variant: "destructive"
      })
      return
    }

    try {
      setSubmitting(true)

      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentableType,
          commentableId,
          content: content.trim(),
          parentId,
          attachments: []
        })
      })

      if (!res.ok) {
        throw new Error('Failed to post comment')
      }

      const data = await res.json()

      toast({
        title: "Success",
        description: parentId ? "Reply posted!" : "Comment posted!",
        variant: "success"
      })

      // Clear inputs
      setNewComment('')
      setReplyingTo(null)
      setEditContent('')

      // Refresh comments
      await fetchComments()

    } catch (error) {
      console.error('Error posting comment:', error)
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (commentId: string) => {
    if (!editContent.trim()) {
      toast({
        title: "Error",
        description: "Comment cannot be empty",
        variant: "destructive"
      })
      return
    }

    try {
      setSubmitting(true)

      const res = await fetch('/api/comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commentId,
          content: editContent.trim()
        })
      })

      if (!res.ok) {
        throw new Error('Failed to edit comment')
      }

      toast({
        title: "Success",
        description: "Comment updated!",
        variant: "success"
      })

      setEditingComment(null)
      setEditContent('')
      await fetchComments()

    } catch (error) {
      console.error('Error editing comment:', error)
      toast({
        title: "Error",
        description: "Failed to edit comment",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return
    }

    try {
      const res = await fetch(`/api/comments?commentId=${commentId}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        throw new Error('Failed to delete comment')
      }

      toast({
        title: "Success",
        description: "Comment deleted",
        variant: "success"
      })

      await fetchComments()

    } catch (error) {
      console.error('Error deleting comment:', error)
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive"
      })
    }
  }

  const startEdit = (comment: Comment) => {
    setEditingComment(comment.id)
    setEditContent(comment.content)
  }

  const cancelEdit = () => {
    setEditingComment(null)
    setEditContent('')
  }

  // Get portal-specific styling classes
  const getVariantClasses = () => {
    switch (variant) {
      case 'staff':
        return {
          container: 'bg-slate-900/50 backdrop-blur-sm border-slate-700',
          comment: 'bg-slate-800/80 border-slate-700 hover:border-indigo-500/50',
          reply: 'bg-slate-800/60 border-slate-600',
          input: 'bg-slate-800 border-slate-600 text-slate-100 focus:ring-indigo-500',
          button: 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700',
          userBadge: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
          text: 'text-slate-200'
        }
      case 'client':
        return {
          container: 'bg-white border-gray-200',
          comment: 'bg-gray-50 border-gray-200 hover:border-blue-300',
          reply: 'bg-gray-100 border-gray-200',
          input: 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500',
          button: 'bg-blue-600 hover:bg-blue-700',
          userBadge: 'bg-blue-100 text-blue-700 border-blue-200',
          text: 'text-gray-900'
        }
      case 'management':
        return {
          container: 'bg-slate-900/70 backdrop-blur-md border-slate-700',
          comment: 'bg-slate-800/90 border-slate-700 hover:border-purple-500/50 shadow-lg shadow-purple-500/10',
          reply: 'bg-slate-800/70 border-slate-600',
          input: 'bg-slate-800 border-slate-600 text-slate-100 focus:ring-purple-500',
          button: 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg hover:shadow-purple-500/30',
          userBadge: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
          text: 'text-slate-100'
        }
    }
  }

  const classes = getVariantClasses()

  if (loading) {
    return (
      <div className={`p-8 rounded-xl border ${classes.container} flex items-center justify-center`}>
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
        <span className={`ml-3 ${classes.text}`}>Loading comments...</span>
      </div>
    )
  }

  return (
    <div className={`rounded-xl border ${classes.container} overflow-hidden`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-inherit">
        <div className="flex items-center gap-2">
          <MessageCircle className={`h-5 w-5 ${variant === 'staff' ? 'text-indigo-400' : variant === 'client' ? 'text-blue-600' : 'text-purple-400'}`} />
          <h3 className={`font-semibold ${classes.text}`}>
            Comments {comments.length > 0 && `(${comments.length})`}
          </h3>
        </div>
      </div>

      {/* Comments List */}
      <div className="p-6 space-y-4" style={{ maxHeight, overflowY: 'auto' }}>
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className={`h-12 w-12 mx-auto mb-3 ${variant === 'staff' ? 'text-slate-600' : variant === 'client' ? 'text-gray-300' : 'text-slate-700'}`} />
            <p className={`${variant === 'staff' ? 'text-slate-400' : variant === 'client' ? 'text-gray-500' : 'text-slate-400'}`}>
              No comments yet. Be the first to comment!
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              variant={variant}
              classes={classes}
              onReply={(id) => setReplyingTo(id)}
              onEdit={startEdit}
              onDelete={handleDelete}
              editingComment={editingComment}
              editContent={editContent}
              setEditContent={setEditContent}
              handleEdit={handleEdit}
              cancelEdit={cancelEdit}
              submitting={submitting}
            />
          ))
        )}
      </div>

      {/* New Comment Input */}
      <div className="px-6 py-4 border-t border-inherit">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src="" />
            <AvatarFallback className={variant === 'staff' ? 'bg-indigo-600' : variant === 'client' ? 'bg-blue-600' : 'bg-purple-600'}>
              You
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className={`min-h-[80px] resize-none ${classes.input}`}
              autoFocus={autoFocus}
              disabled={submitting}
            />
            <div className="flex items-center justify-between mt-2">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                disabled={submitting}
              >
                <Paperclip className="h-4 w-4" />
                Attach
              </Button>
              <Button
                onClick={() => handleSubmit(null)}
                disabled={submitting || !newComment.trim()}
                className={`gap-2 ${classes.button}`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Post Comment
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Comment Item Component
function CommentItem({
  comment,
  variant,
  classes,
  onReply,
  onEdit,
  onDelete,
  editingComment,
  editContent,
  setEditContent,
  handleEdit,
  cancelEdit,
  submitting,
  isReply = false
}: any) {
  const [showActions, setShowActions] = useState(false)

  const getUserBadge = (userType: string) => {
    const badges = {
      STAFF: '👤 Staff',
      CLIENT: '🏢 Client',
      MANAGEMENT: '👔 Management',
      SYSTEM: '🤖 System'
    }
    return badges[userType as keyof typeof badges] || userType
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className={`${isReply ? 'ml-12' : ''}`}>
      <div
        className={`p-4 rounded-lg border ${isReply ? classes.reply : classes.comment} transition-all`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Comment Header */}
        <div className="flex items-start gap-3">
          <Avatar className="h-9 w-9 flex-shrink-0">
            <AvatarImage src={comment.userAvatar || undefined} />
            <AvatarFallback className={variant === 'staff' ? 'bg-indigo-600' : variant === 'client' ? 'bg-blue-600' : 'bg-purple-600'}>
              {getInitials(comment.userName)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-semibold ${classes.text}`}>
                {comment.userName}
              </span>
              <span className={`px-2 py-0.5 text-xs rounded-full border ${classes.userBadge}`}>
                {getUserBadge(comment.userType)}
              </span>
              <span className={`text-xs ${variant === 'staff' ? 'text-slate-500' : variant === 'client' ? 'text-gray-500' : 'text-slate-500'}`}>
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
              {comment.isEdited && (
                <span className={`text-xs italic ${variant === 'staff' ? 'text-slate-500' : variant === 'client' ? 'text-gray-500' : 'text-slate-500'}`}>
                  (edited)
                </span>
              )}
            </div>

            {/* Comment Content or Edit Form */}
            {editingComment === comment.id ? (
              <div className="mt-2 space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className={`min-h-[80px] ${classes.input}`}
                  disabled={submitting}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleEdit(comment.id)}
                    disabled={submitting || !editContent.trim()}
                    className={classes.button}
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={cancelEdit}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className={`mt-2 text-sm leading-relaxed whitespace-pre-wrap ${classes.text}`}>
                {comment.content}
              </p>
            )}

            {/* Attachments */}
            {comment.attachments && comment.attachments.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {comment.attachments.map((url: string, i: number) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-xs px-3 py-1 rounded-full border ${classes.userBadge} hover:opacity-80 transition-opacity`}
                  >
                    📎 Attachment {i + 1}
                  </a>
                ))}
              </div>
            )}

            {/* Actions */}
            {showActions && editingComment !== comment.id && (
              <div className="mt-3 flex items-center gap-3">
                <button
                  onClick={() => onReply(comment.id)}
                  className={`text-xs flex items-center gap-1 ${variant === 'staff' ? 'text-indigo-400 hover:text-indigo-300' : variant === 'client' ? 'text-blue-600 hover:text-blue-700' : 'text-purple-400 hover:text-purple-300'} transition-colors`}
                >
                  <Reply className="h-3 w-3" />
                  Reply
                </button>
                <button
                  onClick={() => onEdit(comment)}
                  className={`text-xs flex items-center gap-1 ${variant === 'staff' ? 'text-slate-400 hover:text-slate-300' : variant === 'client' ? 'text-gray-600 hover:text-gray-700' : 'text-slate-400 hover:text-slate-300'} transition-colors`}
                >
                  <Edit2 className="h-3 w-3" />
                  Edit
                </button>
                <button
                  onClick={() => onDelete(comment.id)}
                  className="text-xs flex items-center gap-1 text-red-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.replies.map((reply: Comment) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              variant={variant}
              classes={classes}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              editingComment={editingComment}
              editContent={editContent}
              setEditContent={setEditContent}
              handleEdit={handleEdit}
              cancelEdit={cancelEdit}
              submitting={submitting}
              isReply={true}
            />
          ))}
        </div>
      )}
    </div>
  )
}


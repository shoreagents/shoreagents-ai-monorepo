"use client"

import { useState, useEffect, useRef } from "react"
import { Heart, ThumbsUp, Flame, PartyPopper, Sparkles, MessageSquare, Send, Image as ImageIcon, FileText, Trash2, X, Laugh, Skull, Rocket, Zap, BrainCircuit, AtSign } from "lucide-react"
import Image from "next/image"
import { useWebSocket } from "@/lib/websocket-provider"

type PostType = "UPDATE" | "WIN" | "CELEBRATION" | "ACHIEVEMENT" | "KUDOS" | "ANNOUNCEMENT"
type ReactionType = "LIKE" | "LOVE" | "FIRE" | "CELEBRATE" | "CLAP" | "LAUGH" | "POO" | "ROCKET" | "SHOCKED" | "MIND_BLOWN"

interface User {
  id: string
  name: string
  avatar: string | null
  role?: string
}

interface StaffMember {
  id: string
  name: string
  avatar: string | null
}

interface Reaction {
  id: string
  type: ReactionType
  user: {
    id: string
    name: string
  }
}

interface Comment {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    name: string
    avatar: string | null
  }
}

interface Post {
  id: string
  content: string
  type: PostType
  images: string[]
  taggedUsers?: StaffMember[]
  createdAt: string
  user: User
  reactions: Reaction[]
  comments: Comment[]
}

const reactionIcons = {
  LIKE: { icon: ThumbsUp, color: "text-blue-400", label: "Like" },
  LOVE: { icon: Heart, color: "text-red-400", label: "Love" },
  FIRE: { icon: Flame, color: "text-orange-400", label: "Fire" },
  CELEBRATE: { icon: PartyPopper, color: "text-purple-400", label: "Celebrate" },
  CLAP: { icon: Sparkles, color: "text-emerald-400", label: "Clap" },
  LAUGH: { icon: Laugh, color: "text-yellow-400", label: "Haha" },
  POO: { icon: Skull, color: "text-amber-600", label: "Poo" },
  ROCKET: { icon: Rocket, color: "text-cyan-400", label: "Rocket" },
  SHOCKED: { icon: Zap, color: "text-pink-400", label: "Shocked" },
  MIND_BLOWN: { icon: BrainCircuit, color: "text-fuchsia-400", label: "Mind Blown" },
}

export default function ActivityLog() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [newPostContent, setNewPostContent] = useState("")
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({})
  const [currentUserId, setCurrentUserId] = useState<string>("")
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [total, setTotal] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // 🔥 WebSocket for real-time updates
  const { on, off } = useWebSocket()

  useEffect(() => {
    fetchPosts()
    fetchCurrentUser()
  }, [])

  // 🔥 Listen for real-time activity updates
  useEffect(() => {
    if (!on || !off) return

    // New post added
    const handleNewPost = (newPost: any) => {
      // Only add if it matches our audience filter (STAFF or ALL)
      if (newPost.audience === 'STAFF' || newPost.audience === 'ALL') {
        setPosts((prev) => [newPost, ...prev])
        console.log('✨ New post received:', newPost.id)
      }
    }

    // Reaction added
    const handleReactionAdded = (data: any) => {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === data.postId
            ? { ...post, reactions: [...post.reactions, data.reaction] }
            : post
        )
      )
    }

    // Reaction updated
    const handleReactionUpdated = (data: any) => {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === data.postId
            ? {
                ...post,
                reactions: post.reactions.map((r) =>
                  r.user.id === data.reaction.user.id ? data.reaction : r
                ),
              }
            : post
        )
      )
    }

    // Reaction removed
    const handleReactionRemoved = (data: any) => {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === data.postId
            ? {
                ...post,
                reactions: post.reactions.filter(
                  (r) => !(r.user.id === data.userId && r.type === data.type)
                ),
              }
            : post
        )
      )
    }

    // Comment added
    const handleCommentAdded = (data: any) => {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === data.postId
            ? { ...post, comments: [...post.comments, data.comment] }
            : post
        )
      )
    }

    // Comment deleted
    const handleCommentDeleted = (data: any) => {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === data.postId
            ? {
                ...post,
                comments: post.comments.filter((c) => c.id !== data.commentId),
              }
            : post
        )
      )
    }

    // Register event listeners
    on('activity:newPost', handleNewPost)
    on('activity:reactionAdded', handleReactionAdded)
    on('activity:reactionUpdated', handleReactionUpdated)
    on('activity:reactionRemoved', handleReactionRemoved)
    on('activity:commentAdded', handleCommentAdded)
    on('activity:commentDeleted', handleCommentDeleted)

    // Cleanup on unmount
    return () => {
      off('activity:newPost', handleNewPost)
      off('activity:reactionAdded', handleReactionAdded)
      off('activity:reactionUpdated', handleReactionUpdated)
      off('activity:reactionRemoved', handleReactionRemoved)
      off('activity:commentAdded', handleCommentAdded)
      off('activity:commentDeleted', handleCommentDeleted)
    }
  }, [on, off])

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch("/api/profile")
      const data = await response.json()
      setCurrentUserId(data.user.id)
    } catch (error) {
      console.error("Error fetching current user:", error)
    }
  }

  const fetchPosts = async (pageNum = 1) => {
    try {
      // Staff see posts for STAFF and ALL audiences (15 posts per page)
      const response = await fetch(`/api/posts?audience=STAFF&page=${pageNum}&limit=15`)
      const data = await response.json()
      
      if (pageNum === 1) {
        setPosts(data.posts || [])
      } else {
        setPosts(prev => [...prev, ...(data.posts || [])])
      }
      
      setHasMore(data.pagination?.hasMore || false)
      setTotal(data.pagination?.total || 0)
      setPage(pageNum)
    } catch (error) {
      console.error("Error fetching posts:", error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMore = async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    await fetchPosts(page + 1)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const filesArray = Array.from(files).slice(0, 5) // Max 5 images
    setSelectedImages(filesArray)

    // Generate previews
    const previews = filesArray.map((file) => URL.createObjectURL(file))
    setImagePreviews(previews)
  }

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const createPost = async () => {
    if (!newPostContent.trim() && selectedImages.length === 0) return

    setUploading(true)
    let imageUrls: string[] = []

    // Upload images first if any
    if (selectedImages.length > 0) {
      const formData = new FormData()
      selectedImages.forEach((file) => {
        formData.append("images", file)
      })

      try {
        const uploadResponse = await fetch("/api/posts/images", {
          method: "POST",
          body: formData,
        })
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          imageUrls = uploadData.urls
        }
      } catch (error) {
        console.error("Error uploading images:", error)
      }
    }

    // Create post
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newPostContent,
          type: "UPDATE",
          images: imageUrls,
          audience: "STAFF", // Staff posts go to staff feed
        }),
      })
      if (response.ok) {
        await fetchPosts()
        setNewPostContent("")
        setSelectedImages([])
        setImagePreviews([])
      }
    } catch (error) {
      console.error("Error creating post:", error)
    } finally {
      setUploading(false)
    }
  }

  const toggleReaction = async (postId: string, type: ReactionType) => {
    try {
      await fetch("/api/posts/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, type }),
      })
      await fetchPosts()
    } catch (error) {
      console.error("Error toggling reaction:", error)
    }
  }

  const addComment = async (postId: string) => {
    const content = commentInputs[postId]
    if (!content?.trim()) return

    try {
      await fetch("/api/posts/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, content }),
      })
      setCommentInputs({ ...commentInputs, [postId]: "" })
      await fetchPosts()
    } catch (error) {
      console.error("Error adding comment:", error)
    }
  }

  const deleteComment = async (commentId: string) => {
    try {
      await fetch(`/api/posts/comments?id=${commentId}`, { method: "DELETE" })
      await fetchPosts()
    } catch (error) {
      console.error("Error deleting comment:", error)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return "just now"
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  const getReactionCount = (reactions: Reaction[], type: ReactionType) => {
    return reactions.filter((r) => r.type === type).length
  }

  const hasUserReacted = (reactions: Reaction[], type: ReactionType) => {
    return reactions.some((r) => r.type === type && r.user.id === currentUserId)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
        <div className="mx-auto max-w-2xl space-y-4">
          <div className="h-32 rounded-xl bg-slate-800/50 animate-pulse" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 rounded-xl bg-slate-800/50 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
      <div className="mx-auto max-w-2xl space-y-4">
        {/* Header */}
        <div className="rounded-xl bg-gradient-to-br from-indigo-900/50 via-purple-900/50 to-indigo-900/50 p-6 backdrop-blur-xl ring-1 ring-white/10 shadow-xl">
          <h1 className="text-3xl font-bold text-white">Team Feed 🎉</h1>
          <p className="mt-1 text-slate-300">Share updates, wins, memes, and 💩 takes with the team!</p>
        </div>

        {/* Create Post */}
        <div className="rounded-xl bg-slate-900/50 p-6 backdrop-blur-xl ring-1 ring-white/10">
          <textarea
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            placeholder="What's on your mind? Share a win, meme, or update! 🚀"
            className="w-full rounded-lg bg-slate-800/50 p-4 text-white placeholder-slate-500 outline-none ring-1 ring-white/10 focus:ring-indigo-400/50"
            rows={3}
          />

          {/* Image Previews */}
          {imagePreviews.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative aspect-video overflow-hidden rounded-lg">
                  <Image
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 flex items-center justify-between">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.gif,.pdf"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 rounded-lg bg-slate-800/50 px-4 py-2 text-sm text-slate-300 transition-all hover:bg-slate-700/50"
            >
              <ImageIcon className="h-4 w-4" />
              Add Image/GIF/PDF
            </button>
            <button
              onClick={createPost}
              disabled={uploading || (!newPostContent.trim() && selectedImages.length === 0)}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2 font-semibold text-white transition-all hover:from-indigo-500 hover:to-purple-500 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-xl"
            >
              {uploading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Posting...
                </>
              ) : (
                <>
                  Post 🚀
                </>
              )}
            </button>
          </div>
        </div>

        {/* Posts Feed */}
        {posts.length === 0 ? (
          <div className="rounded-xl bg-slate-900/50 p-12 text-center backdrop-blur-xl ring-1 ring-white/10">
            <p className="text-slate-400">No posts yet. Be the first to share something! 🎉</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post, index) => {
              const isTagged = post.taggedUsers?.some(u => u.id === currentUserId)
              return (
              <div
                key={post.id}
                className={`animate-fade-in-up rounded-xl p-6 backdrop-blur-xl ring-1 transition-all hover:shadow-xl ${
                  isTagged 
                    ? 'bg-indigo-500/10 ring-indigo-400/40 hover:ring-indigo-400/60' 
                    : 'bg-slate-900/50 ring-white/10 hover:ring-white/20'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Post Header */}
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 overflow-hidden rounded-full ring-2 ring-indigo-400/30 transition-all hover:ring-indigo-400/60 hover:scale-105">
                    <Image
                      src={post.user.avatar || "/placeholder-user.jpg"}
                      alt={post.user.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-white hover:text-indigo-300 transition-colors cursor-pointer">{post.user.name}</div>
                      {isTagged && (
                        <span className="text-xs px-2 py-0.5 bg-indigo-500/30 text-indigo-300 rounded-full">
                          Tagged you
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-400">{formatTimeAgo(post.createdAt)}</div>
                  </div>
                </div>

                {/* Post Content */}
                <div className="mt-4">
                  <p className="whitespace-pre-wrap text-white">{post.content}</p>
                </div>

                {/* Tagged Users */}
                {post.taggedUsers && post.taggedUsers.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {post.taggedUsers.map((staff) => (
                      <div key={staff.id} className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 text-indigo-300 rounded-full text-sm">
                        {staff.avatar ? (
                          <Image
                            src={staff.avatar}
                            alt={staff.name}
                            width={20}
                            height={20}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                            {staff.name.charAt(0)}
                          </div>
                        )}
                        <span>{staff.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Post Images */}
                {post.images && post.images.length > 0 && (
                  <div className={`mt-4 grid gap-2 ${post.images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                    {post.images.map((image, index) => {
                      const isPDF = image.toLowerCase().endsWith('.pdf')
                      return (
                        <div key={index} className="relative aspect-video overflow-hidden rounded-lg">
                          {isPDF ? (
                            <div className="flex h-full items-center justify-center bg-slate-800/50">
                              <div className="text-center">
                                <FileText className="mx-auto mb-2 h-12 w-12 text-indigo-400" />
                                <p className="text-sm text-slate-300">PDF Document</p>
                                <a
                                  href={image}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-2 inline-block text-xs text-indigo-400 hover:underline"
                                >
                                  Open PDF
                                </a>
                              </div>
                            </div>
                          ) : (
                            <Image
                              src={image}
                              alt={`Post image ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Reactions */}
                <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                  {/* Reaction Summary */}
                  {post.reactions.length > 0 && (
                    <div className="text-sm text-slate-400">
                      {Object.entries(reactionIcons).map(([type, { icon: Icon, color }]) => {
                        const reactions = post.reactions.filter((r) => r.type === type)
                        if (reactions.length === 0) return null
                        const names = reactions.map((r) => r.user.name).slice(0, 3)
                        const extra = reactions.length - 3
                        return (
                          <span key={type} className="mr-3">
                            <Icon className={`inline h-4 w-4 ${color} mr-1`} />
                            <span className="text-white">{names.join(", ")}</span>
                            {extra > 0 && <span> and {extra} others</span>}
                          </span>
                        )
                      }).filter(Boolean)}
                    </div>
                  )}
                  
                  {/* Reaction Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(reactionIcons).map(([type, { icon: Icon, color, label }]) => {
                      const count = getReactionCount(post.reactions, type as ReactionType)
                      const hasReacted = hasUserReacted(post.reactions, type as ReactionType)
                      const whoReacted = post.reactions
                        .filter((r) => r.type === type)
                        .map((r) => r.user.name)
                      
                      return (
                        <button
                          key={type}
                          onClick={() => toggleReaction(post.id, type as ReactionType)}
                          title={whoReacted.length > 0 ? whoReacted.join(", ") : label}
                          className={`group relative flex items-center gap-1 rounded-full px-3 py-1.5 text-sm transition-all duration-200 ${
                            hasReacted
                              ? `${color} bg-slate-800/70 ring-1 ring-current scale-105`
                              : "text-slate-400 hover:bg-slate-800/50 hover:scale-110 hover:text-white"
                          } active:scale-95`}
                        >
                          <Icon className={`h-4 w-4 transition-transform ${hasReacted ? "animate-bounce" : "group-hover:rotate-12"}`} />
                          {count > 0 && <span className="font-semibold">{count}</span>}
                          
                          {/* Tooltip on hover */}
                          {whoReacted.length > 0 && (
                            <span className="pointer-events-none absolute -top-10 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1 text-xs text-white opacity-0 shadow-xl ring-1 ring-white/10 transition-opacity group-hover:opacity-100">
                              {whoReacted.join(", ")}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Comments Section */}
                <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                  {post.comments.map((comment, idx) => (
                    <div 
                      key={comment.id} 
                      className="flex gap-3 animate-fade-in-up"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full ring-2 ring-white/10 transition-all hover:ring-white/30">
                        <Image
                          src={comment.user.avatar || "/placeholder-user.jpg"}
                          alt={comment.user.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="group rounded-lg bg-slate-800/50 p-3 transition-all hover:bg-slate-800/70">
                          <div className="flex items-center justify-between">
                            <div className="font-semibold text-sm text-white">{comment.user.name}</div>
                            {comment.user.id === currentUserId && (
                              <button
                                onClick={() => deleteComment(comment.id)}
                                className="text-slate-400 opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-slate-300">{comment.content}</p>
                        </div>
                        <div className="mt-1 ml-1 text-xs text-slate-500">{formatTimeAgo(comment.createdAt)}</div>
                      </div>
                    </div>
                  ))}

                  {/* Add Comment */}
                  <div className="flex gap-2 items-center">
                    <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full ring-2 ring-white/10">
                      <Image
                        src={post.user.avatar || "/placeholder-user.jpg"}
                        alt="Your avatar"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <input
                      type="text"
                      value={commentInputs[post.id] || ""}
                      onChange={(e) =>
                        setCommentInputs({ ...commentInputs, [post.id]: e.target.value })
                      }
                      onKeyPress={(e) => e.key === "Enter" && addComment(post.id)}
                      placeholder="Write a comment... 💬"
                      className="flex-1 rounded-lg bg-slate-800/50 px-4 py-2 text-sm text-white placeholder-slate-500 outline-none ring-1 ring-white/10 transition-all focus:ring-2 focus:ring-indigo-400/50 focus:bg-slate-800/70"
                    />
                    <button
                      onClick={() => addComment(post.id)}
                      disabled={!commentInputs[post.id]?.trim()}
                      className="rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 p-2 text-white transition-all hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )})}

            {/* Load More Button */}
            {!loading && hasMore && (
              <div className="flex flex-col items-center gap-2 py-6">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium transition-all hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-lg shadow-indigo-500/20"
                >
                  {loadingMore ? "Loading..." : "Load More Posts"}
                </button>
                <p className="text-sm text-slate-400">
                  Showing {posts.length} of {total} posts
                </p>
              </div>
            )}

            {/* No More Posts Message */}
            {!loading && !hasMore && posts.length > 0 && (
              <div className="flex items-center justify-center py-8">
                <p className="text-sm text-slate-500">🎉 You've reached the end!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

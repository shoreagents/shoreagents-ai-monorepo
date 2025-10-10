"use client"

import { useState, useEffect } from "react"
import { Heart, ThumbsUp, Flame, Zap, Award, MessageSquare, Send } from "lucide-react"

type PostType = "ACHIEVEMENT" | "ANNOUNCEMENT" | "WORK_WIN" | "KUDOS" | "MILESTONE" | "CELEBRATION"
type ReactionType = "LIKE" | "LOVE" | "CELEBRATE" | "FIRE" | "CLAP"

interface Post {
  id: string
  content: string
  type: PostType
  authorId: string
  createdAt: string
}

export default function ActivityLog() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newPostContent, setNewPostContent] = useState("")

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      const response = await fetch("/api/posts")
      if (!response.ok) throw new Error("Failed to fetch posts")
      const data = await response.json()
      setPosts(data.posts)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load posts")
    } finally {
      setLoading(false)
    }
  }

  const createPost = async () => {
    if (!newPostContent.trim()) return
    
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newPostContent,
          type: "WORK_WIN",
        }),
      })
      if (!response.ok) throw new Error("Failed to create post")
      await fetchPosts()
      setNewPostContent("")
    } catch (err) {
      console.error("Error creating post:", err)
    }
  }

  const postTypeConfig = {
    ACHIEVEMENT: { emoji: "🏆", color: "bg-amber-500/20 text-amber-400" },
    ANNOUNCEMENT: { emoji: "📢", color: "bg-blue-500/20 text-blue-400" },
    WORK_WIN: { emoji: "✨", color: "bg-emerald-500/20 text-emerald-400" },
    KUDOS: { emoji: "🙌", color: "bg-purple-500/20 text-purple-400" },
    MILESTONE: { emoji: "🎯", color: "bg-pink-500/20 text-pink-400" },
    CELEBRATION: { emoji: "🎉", color: "bg-orange-500/20 text-orange-400" },
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="h-32 rounded-xl bg-slate-800/50 animate-pulse" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-slate-800/50 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-xl bg-red-500/10 p-6 ring-1 ring-red-500/30">
            <h2 className="text-xl font-bold text-red-400">Error Loading Feed</h2>
            <p className="mt-2 text-red-300">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 pt-20 md:p-8 lg:pt-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="rounded-2xl bg-gradient-to-br from-blue-900/50 via-purple-900/50 to-blue-900/50 p-6 shadow-xl backdrop-blur-xl ring-1 ring-white/10">
          <h1 className="text-3xl font-bold text-white">Team Feed</h1>
          <p className="mt-1 text-slate-300">Share wins, give kudos, and celebrate together</p>
        </div>

        {/* Create Post */}
        <div className="rounded-2xl bg-slate-900/50 p-6 backdrop-blur-xl ring-1 ring-white/10">
          <div className="flex items-start gap-3">
            <img
              src="/placeholder-user.jpg"
              alt="You"
              className="h-10 w-10 rounded-full object-cover ring-2 ring-white/20"
            />
            <div className="flex-1">
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="Share a win, give kudos, or celebrate a milestone..."
                className="w-full resize-none rounded-xl bg-slate-800/50 px-4 py-3 text-white placeholder-slate-500 outline-none ring-1 ring-white/10 focus:ring-blue-500/50"
                rows={3}
              />
              <div className="mt-3 flex justify-end">
                <button
                  onClick={createPost}
                  disabled={!newPostContent.trim()}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-medium text-white transition-all hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Feed */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="rounded-xl bg-slate-900/50 p-12 text-center backdrop-blur-xl ring-1 ring-white/10">
              <p className="text-slate-400">No posts yet. Be the first to share something!</p>
            </div>
          ) : (
            posts.map((post) => {
              const typeConfig = postTypeConfig[post.type]

              return (
                <div
                  key={post.id}
                  className="rounded-2xl bg-slate-900/50 p-6 backdrop-blur-xl ring-1 ring-white/10 transition-all hover:bg-slate-800/50"
                >
                  {/* Post Header */}
                  <div className="flex items-start gap-3">
                    <img
                      src="/placeholder-user.jpg"
                      alt="User"
                      className="h-12 w-12 rounded-full object-cover ring-2 ring-white/20"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white">Team Member</h3>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${typeConfig.color}`}>
                          {typeConfig.emoji} {post.type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400">
                        {new Date(post.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="mt-4">
                    <p className="text-white leading-relaxed">{post.content}</p>
                  </div>

                  {/* Reactions */}
                  <div className="mt-4 flex gap-2 border-t border-white/10 pt-3">
                    <button className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-blue-400">
                      <ThumbsUp className="h-4 w-4" />
                      Like
                    </button>
                    <button className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-red-400">
                      <Heart className="h-4 w-4" />
                      Love
                    </button>
                    <button className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-emerald-400">
                      <Award className="h-4 w-4" />
                      Celebrate
                    </button>
                    <button className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-orange-400">
                      <Flame className="h-4 w-4" />
                      Fire
                    </button>
                    <button className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-purple-400">
                      <Zap className="h-4 w-4" />
                      Clap
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

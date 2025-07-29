'use client'

import React, { useState, useEffect, useRef } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { 
  MessageCircle, 
  Send, 
  AtSign, 
  ThumbsUp, 
  ThumbsDown, 
  HelpCircle, 
  CheckCircle2,
  Heart,
  MoreVertical,
  Edit2,
  Trash2,
  Reply,
  Globe,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/Button'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { useWebSocket } from '@/hooks/useWebSocket'

interface User {
  id: string
  name: string
  role: string
}

interface Reaction {
  id: string
  type: string
  user: User
}

interface Comment {
  id: string
  content: string
  originalLang: string
  createdAt: string
  updatedAt: string
  user: User
  reactions: Reaction[]
  replies: Comment[]
  mentions: string[]
}

interface CommentsProps {
  mediaId: string
  projectMembers?: User[]
}

const reactionIcons = {
  like: Heart,
  thumbsup: ThumbsUp,
  thumbsdown: ThumbsDown,
  question: HelpCircle,
  check: CheckCircle2
}

export default function Comments({ mediaId, projectMembers = [] }: CommentsProps) {
  const { user } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isPosting, setIsPosting] = useState(false)
  const [showMentions, setShowMentions] = useState(false)
  const [mentionSearch, setMentionSearch] = useState('')
  const [selectedMentions, setSelectedMentions] = useState<string[]>([])
  const commentInputRef = useRef<HTMLTextAreaElement>(null)
  
  // Get user's language preference
  const userLang = navigator.language.split('-')[0] || 'en'
  
  // WebSocket connection for real-time updates
  const { socket } = useWebSocket()
  
  useEffect(() => {
    fetchComments()
    
    // Join media room for real-time updates
    if (socket) {
      socket.emit('join_media', mediaId)
      
      // Listen for comment events
      socket.on('comment:created', handleNewComment)
      socket.on('comment:updated', handleCommentUpdate)
      socket.on('comment:deleted', handleCommentDelete)
      socket.on('reaction:added', handleReactionAdded)
      socket.on('reaction:removed', handleReactionRemoved)
      
      return () => {
        socket.emit('leave_media', mediaId)
        socket.off('comment:created')
        socket.off('comment:updated')
        socket.off('comment:deleted')
        socket.off('reaction:added')
        socket.off('reaction:removed')
      }
    }
  }, [mediaId, socket])
  
  const fetchComments = async () => {
    try {
      const response = await api.get(`/media/${mediaId}/comments?lang=${userLang}`)
      setComments(response.data)
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleNewComment = (data: any) => {
    if (data.mediaId === mediaId) {
      setComments(prev => [data.comment, ...prev])
    }
  }
  
  const handleCommentUpdate = (data: any) => {
    if (data.mediaId === mediaId) {
      setComments(prev => prev.map(c => 
        c.id === data.comment.id ? data.comment : c
      ))
    }
  }
  
  const handleCommentDelete = (data: any) => {
    if (data.mediaId === mediaId) {
      setComments(prev => prev.filter(c => c.id !== data.commentId))
    }
  }
  
  const handleReactionAdded = (data: any) => {
    if (data.mediaId === mediaId) {
      setComments(prev => prev.map(c => {
        if (c.id === data.commentId) {
          return {
            ...c,
            reactions: [...c.reactions, data.reaction]
          }
        }
        return c
      }))
    }
  }
  
  const handleReactionRemoved = (data: any) => {
    if (data.mediaId === mediaId) {
      setComments(prev => prev.map(c => {
        if (c.id === data.commentId) {
          return {
            ...c,
            reactions: c.reactions.filter(r => 
              !(r.type === data.type && r.user.id === data.userId)
            )
          }
        }
        return c
      }))
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || isPosting) return
    
    setIsPosting(true)
    try {
      await api.post('/comments', {
        content: newComment,
        mediaId,
        parentId: replyingTo,
        mentions: selectedMentions
      })
      
      setNewComment('')
      setReplyingTo(null)
      setSelectedMentions([])
    } catch (error) {
      console.error('Failed to post comment:', error)
    } finally {
      setIsPosting(false)
    }
  }
  
  const handleEdit = async (commentId: string) => {
    if (!editContent.trim()) return
    
    try {
      await api.patch(`/comments/${commentId}`, {
        content: editContent
      })
      setEditingId(null)
      setEditContent('')
    } catch (error) {
      console.error('Failed to update comment:', error)
    }
  }
  
  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return
    
    try {
      await api.delete(`/comments/${commentId}`)
    } catch (error) {
      console.error('Failed to delete comment:', error)
    }
  }
  
  const toggleReaction = async (commentId: string, type: string) => {
    const comment = comments.find(c => c.id === commentId)
    const existingReaction = comment?.reactions.find(
      r => r.type === type && r.user.id === user?.id
    )
    
    try {
      if (existingReaction) {
        await api.delete(`/comments/${commentId}/reactions/${type}`)
      } else {
        await api.post(`/comments/${commentId}/reactions`, { type })
      }
    } catch (error) {
      console.error('Failed to toggle reaction:', error)
    }
  }
  
  const handleMention = (userId: string, userName: string) => {
    const newText = newComment.replace(/@\w*$/, `@${userName} `)
    setNewComment(newText)
    setSelectedMentions([...selectedMentions, userId])
    setShowMentions(false)
    commentInputRef.current?.focus()
  }
  
  const renderComment = (comment: Comment, isReply = false) => {
    const isOwner = comment.user.id === user?.id
    const isEditing = editingId === comment.id
    
    return (
      <div key={comment.id} className={`${isReply ? 'ml-12' : ''} mb-4`}>
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {comment.user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">{comment.user.name}</span>
                  <span className="text-xs text-gray-500">{comment.user.role}</span>
                  {comment.originalLang !== userLang && (
                    <span className="flex items-center gap-1 text-xs text-blue-400">
                      <Globe className="h-3 w-3" />
                      Translated
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </span>
              </div>
              
              {isOwner && (
                <div className="relative group">
                  <button className="p-1 rounded hover:bg-gray-700">
                    <MoreVertical className="h-4 w-4 text-gray-400" />
                  </button>
                  <div className="absolute right-0 top-full mt-1 bg-gray-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingId(comment.id)
                        setEditContent(comment.content)
                      }}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-700 w-full text-left"
                    >
                      <Edit2 className="h-3 w-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-gray-700 w-full text-left text-red-400"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {isEditing ? (
              <div className="mt-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white"
                  rows={2}
                />
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    onClick={() => handleEdit(comment.id)}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingId(null)
                      setEditContent('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="mt-1 text-gray-300">{comment.content}</p>
            )}
            
            <div className="flex items-center gap-4 mt-2">
              {/* Reactions */}
              <div className="flex items-center gap-2">
                {Object.entries(reactionIcons).map(([type, Icon]) => {
                  const count = comment.reactions.filter(r => r.type === type).length
                  const hasReacted = comment.reactions.some(
                    r => r.type === type && r.user.id === user?.id
                  )
                  
                  return (
                    <button
                      key={type}
                      onClick={() => toggleReaction(comment.id, type)}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                        hasReacted 
                          ? 'bg-safety-orange/20 text-safety-orange' 
                          : 'hover:bg-gray-700 text-gray-400'
                      }`}
                    >
                      <Icon className="h-3 w-3" />
                      {count > 0 && <span>{count}</span>}
                    </button>
                  )
                })}
              </div>
              
              {/* Reply button */}
              {!isReply && (
                <button
                  onClick={() => setReplyingTo(comment.id)}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-white"
                >
                  <Reply className="h-3 w-3" />
                  Reply
                </button>
              )}
            </div>
            
            {/* Replies */}
            {comment.replies.length > 0 && (
              <div className="mt-4">
                {comment.replies.map(reply => renderComment(reply, true))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="h-5 w-5 text-safety-orange" />
        <h3 className="text-lg font-semibold text-white">
          Comments ({comments.length})
        </h3>
      </div>
      
      {/* Comment form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="relative">
          <textarea
            ref={commentInputRef}
            value={newComment}
            onChange={(e) => {
              setNewComment(e.target.value)
              // Check for @ mentions
              const lastWord = e.target.value.split(' ').pop() || ''
              if (lastWord.startsWith('@')) {
                setShowMentions(true)
                setMentionSearch(lastWord.slice(1))
              } else {
                setShowMentions(false)
              }
            }}
            placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-safety-orange focus:border-transparent resize-none"
            rows={3}
          />
          
          {/* Mention suggestions */}
          {showMentions && (
            <div className="absolute bottom-full mb-2 left-0 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {projectMembers
                .filter(member => 
                  member.name.toLowerCase().includes(mentionSearch.toLowerCase())
                )
                .map(member => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => handleMention(member.id, member.name)}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-gray-700 w-full text-left"
                  >
                    <AtSign className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-white">{member.name}</p>
                      <p className="text-xs text-gray-400">{member.role}</p>
                    </div>
                  </button>
                ))}
            </div>
          )}
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <AtSign className="h-3 w-3" />
              <span>Mention team members</span>
            </div>
            
            <div className="flex items-center gap-2">
              {replyingTo && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setReplyingTo(null)}
                >
                  Cancel Reply
                </Button>
              )}
              <Button
                type="submit"
                size="sm"
                disabled={!newComment.trim() || isPosting}
                className="bg-safety-orange hover:bg-orange-700"
              >
                {isPosting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span className="ml-2">Post</span>
              </Button>
            </div>
          </div>
        </div>
      </form>
      
      {/* Comments list */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map(comment => renderComment(comment))
        )}
      </div>
    </div>
  )
}
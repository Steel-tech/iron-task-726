'use client'

import React, { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { 
  Send, 
  AtSign, 
  Globe,
  Users,
  Circle,
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
  online?: boolean
}

interface ChatMessage {
  id: string
  message: string
  originalLang: string
  createdAt: string
  user: User
  mentions: string[]
}

interface TeamChatProps {
  projectId: string
  projectName?: string
}

export default function TeamChat({ projectId, projectName }: TeamChatProps) {
  const { user } = useAuth()
  const { socket, connected } = useWebSocket()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [onlineMembers, setOnlineMembers] = useState<User[]>([])
  const [showMentions, setShowMentions] = useState(false)
  const [mentionSearch, setMentionSearch] = useState('')
  const [selectedMentions, setSelectedMentions] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const userLang = navigator.language.split('-')[0] || 'en'
  
  useEffect(() => {
    fetchMessages()
    fetchOnlineMembers()
    
    // Listen for real-time messages
    if (socket) {
      socket.on('teamchat:message', handleNewMessage)
      
      return () => {
        socket.off('teamchat:message')
      }
    }
  }, [projectId, socket])
  
  useEffect(() => {
    scrollToBottom()
  }, [messages])
  
  const fetchMessages = async () => {
    try {
      const response = await api.get(`/projects/${projectId}/chat`)
      setMessages(response.data)
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const fetchOnlineMembers = async () => {
    try {
      const response = await api.get(`/projects/${projectId}/online-members`)
      setOnlineMembers(response.data)
    } catch (error) {
      console.error('Failed to fetch online members:', error)
    }
  }
  
  const handleNewMessage = (message: ChatMessage) => {
    setMessages(prev => [...prev, message])
  }
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || isSending) return
    
    setIsSending(true)
    try {
      await api.post('/team-chat', {
        projectId,
        message: newMessage,
        mentions: selectedMentions
      })
      
      setNewMessage('')
      setSelectedMentions([])
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsSending(false)
    }
  }
  
  const handleMention = (userId: string, userName: string) => {
    const newText = newMessage.replace(/@\w*$/, `@${userName} `)
    setNewMessage(newText)
    setSelectedMentions([...selectedMentions, userId])
    setShowMentions(false)
    inputRef.current?.focus()
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setNewMessage(value)
    
    const lastWord = value.split(' ').pop() || ''
    if (lastWord.startsWith('@')) {
      setShowMentions(true)
      setMentionSearch(lastWord.slice(1))
    } else {
      setShowMentions(false)
    }
  }
  
  const renderMessage = (message: ChatMessage) => {
    const isOwn = message.user.id === user?.id
    const showTranslation = message.originalLang !== userLang
    
    return (
      <div
        key={message.id}
        className={`mb-4 flex ${isOwn ? 'justify-end' : 'justify-start'}`}
      >
        <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : ''}`}>
          <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'justify-end' : ''}`}>
            <span className="text-xs text-gray-500">
              {message.user.name}
            </span>
            {showTranslation && (
              <Globe className="h-3 w-3 text-blue-400" />
            )}
            <span className="text-xs text-gray-600">
              {format(new Date(message.createdAt), 'HH:mm')}
            </span>
          </div>
          
          <div
            className={`rounded-lg px-4 py-2 ${
              isOwn
                ? 'bg-safety-orange text-white'
                : 'bg-gray-700 text-white'
            }`}
          >
            <p className="text-sm">{message.message}</p>
          </div>
        </div>
      </div>
    )
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
      </div>
    )
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="brushed-metal border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">
              {projectName || 'Team Chat'}
            </h3>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Users className="h-3 w-3" />
              <span>{onlineMembers.length} online</span>
              {connected ? (
                <Circle className="h-2 w-2 fill-green-500 text-green-500" />
              ) : (
                <Circle className="h-2 w-2 fill-red-500 text-red-500" />
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map(renderMessage)}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      {/* Input */}
      <form onSubmit={handleSubmit} className="brushed-metal border-t border-gray-700 p-4">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="w-full px-4 py-2 pr-12 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-safety-orange focus:border-transparent"
          />
          
          {/* Mention suggestions */}
          {showMentions && (
            <div className="absolute bottom-full mb-2 left-0 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {onlineMembers
                .filter(member => 
                  member.name.toLowerCase().includes(mentionSearch.toLowerCase()) &&
                  member.id !== user?.id
                )
                .map(member => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => handleMention(member.id, member.name)}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-gray-700 w-full text-left"
                  >
                    <AtSign className="h-4 w-4 text-gray-400" />
                    <div className="flex items-center gap-2">
                      <span className="text-white">{member.name}</span>
                      <span className="text-xs text-gray-400">{member.role}</span>
                      {member.online && (
                        <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                      )}
                    </div>
                  </button>
                ))}
            </div>
          )}
          
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-safety-orange hover:text-orange-600 disabled:opacity-50"
          >
            {isSending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
        
        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <AtSign className="h-3 w-3" />
            <span>Mention team members</span>
          </div>
          <div className="flex items-center gap-1">
            <Globe className="h-3 w-3" />
            <span>Auto-translated to all languages</span>
          </div>
        </div>
      </form>
    </div>
  )
}
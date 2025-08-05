'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/Button'
import {
  MessageSquare,
  Send,
  Paperclip,
  Camera,
  MapPin,
  Users,
  X,
  Minimize2,
  Maximize2,
  Phone,
  Video,
  MoreVertical,
  AlertTriangle,
  Clock,
  CheckCheck,
  Mic,
  MicOff
} from 'lucide-react'

interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  senderRole: string
  content: string
  timestamp: Date
  type: 'text' | 'image' | 'file' | 'location' | 'safety_alert' | 'voice'
  metadata?: {
    fileName?: string
    fileSize?: number
    imageUrl?: string
    location?: { lat: number; lng: number; address?: string }
    safetyLevel?: 'low' | 'medium' | 'high' | 'critical'
    voiceDuration?: number
  }
  status: 'sending' | 'sent' | 'delivered' | 'read'
  replies?: ChatMessage[]
}

interface ChatChannel {
  id: string
  name: string
  type: 'project' | 'direct' | 'group' | 'emergency'
  projectId?: string
  participants: string[]
  unreadCount: number
  lastMessage?: ChatMessage
  isActive: boolean
}

interface TeamChatPanelProps {
  isMinimized?: boolean
  onToggleMinimize?: () => void
  currentUserId: string
  currentUserName: string
  currentUserRole: string
}

export default function TeamChatPanel({
  isMinimized = false,
  onToggleMinimize,
  currentUserId = 'user_1',
  currentUserName = 'Mike Johnson',
  currentUserRole = 'FOREMAN'
}: TeamChatPanelProps) {
  const [channels, setChannels] = useState<ChatChannel[]>([])
  const [activeChannel, setActiveChannel] = useState<string>('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isRecordingVoice, setIsRecordingVoice] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize with mock data
  useEffect(() => {
    const mockChannels: ChatChannel[] = [
      {
        id: 'emergency',
        name: '🚨 Emergency Alert',
        type: 'emergency',
        participants: ['user_1', 'user_2', 'user_3'],
        unreadCount: 0,
        isActive: true
      },
      {
        id: 'project_1',
        name: 'Downtown Office Complex',
        type: 'project',
        projectId: 'project_1',
        participants: ['user_1', 'user_2', 'user_3', 'user_4'],
        unreadCount: 2,
        isActive: true
      },
      {
        id: 'project_2',
        name: 'Highway Bridge Project',
        type: 'project',
        projectId: 'project_2',
        participants: ['user_1', 'user_5', 'user_6'],
        unreadCount: 0,
        isActive: true
      },
      {
        id: 'foremen_group',
        name: 'Foremen Group',
        type: 'group',
        participants: ['user_1', 'user_7', 'user_8'],
        unreadCount: 1,
        isActive: true
      }
    ]

    const mockMessages: ChatMessage[] = [
      {
        id: 'msg_1',
        senderId: 'user_2',
        senderName: 'Sarah Chen',
        senderRole: 'SAFETY_OFFICER',
        content: 'Safety inspection completed for Bay 3. All clear!',
        timestamp: new Date(Date.now() - 300000),
        type: 'text',
        status: 'read'
      },
      {
        id: 'msg_2',
        senderId: 'user_3',
        senderName: 'Roberto Martinez',
        senderRole: 'IRONWORKER',
        content: 'Beam installation progress photo',
        timestamp: new Date(Date.now() - 180000),
        type: 'image',
        metadata: {
          imageUrl: '/api/placeholder/300/200'
        },
        status: 'read'
      },
      {
        id: 'msg_3',
        senderId: 'user_4',
        senderName: 'Dave Thompson',
        senderRole: 'WELDER',
        content: 'Need additional welding rods delivered to Level 2',
        timestamp: new Date(Date.now() - 60000),
        type: 'text',
        status: 'delivered'
      }
    ]

    setChannels(mockChannels)
    setActiveChannel('project_1')
    setMessages(mockMessages)
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeChannel) return

    const message: ChatMessage = {
      id: `msg_${Date.now()}`,
      senderId: currentUserId,
      senderName: currentUserName,
      senderRole: currentUserRole,
      content: newMessage.trim(),
      timestamp: new Date(),
      type: 'text',
      status: 'sending'
    }

    setMessages(prev => [...prev, message])
    setNewMessage('')

    // Simulate message delivery
    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === message.id ? { ...msg, status: 'sent' } : msg
      ))
    }, 500)

    setTimeout(() => {
      setMessages(prev => prev.map(msg => 
        msg.id === message.id ? { ...msg, status: 'delivered' } : msg
      ))
    }, 1000)
  }

  const sendLocationMessage = async () => {
    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition((position) => {
      const message: ChatMessage = {
        id: `msg_${Date.now()}`,
        senderId: currentUserId,
        senderName: currentUserName,
        senderRole: currentUserRole,
        content: 'Shared current location',
        timestamp: new Date(),
        type: 'location',
        metadata: {
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: 'Current work site location'
          }
        },
        status: 'sent'
      }

      setMessages(prev => [...prev, message])
    })
  }

  const sendEmergencyAlert = () => {
    const message: ChatMessage = {
      id: `msg_${Date.now()}`,
      senderId: currentUserId,
      senderName: currentUserName,
      senderRole: currentUserRole,
      content: 'EMERGENCY: Immediate assistance required at my location!',
      timestamp: new Date(),
      type: 'safety_alert',
      metadata: {
        safetyLevel: 'critical'
      },
      status: 'sent'
    }

    setMessages(prev => [...prev, message])
    
    // Switch to emergency channel
    setActiveChannel('emergency')
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const message: ChatMessage = {
      id: `msg_${Date.now()}`,
      senderId: currentUserId,
      senderName: currentUserName,
      senderRole: currentUserRole,
      content: file.type.startsWith('image/') ? 'Shared an image' : `Shared file: ${file.name}`,
      timestamp: new Date(),
      type: file.type.startsWith('image/') ? 'image' : 'file',
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        imageUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      },
      status: 'sent'
    }

    setMessages(prev => [...prev, message])
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getMessageStatusIcon = (status: ChatMessage['status']) => {
    switch (status) {
      case 'sending': return <Clock className="w-3 h-3 text-gray-400" />
      case 'sent': return <CheckCheck className="w-3 h-3 text-gray-400" />
      case 'delivered': return <CheckCheck className="w-3 h-3 text-blue-500" />
      case 'read': return <CheckCheck className="w-3 h-3 text-green-500" />
    }
  }

  const activeChannelData = channels.find(c => c.id === activeChannel)

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={onToggleMinimize}
          className="rounded-full w-14 h-14 shadow-lg"
          variant="construction-primary"
        >
          <MessageSquare className="w-6 h-6" />
        </Button>
        {channels.some(c => c.unreadCount > 0) && (
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
            {channels.reduce((sum, c) => sum + c.unreadCount, 0)}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-600 text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          <h3 className="font-semibold">Team Chat</h3>
          {activeChannelData && (
            <span className="text-xs bg-blue-500 px-2 py-1 rounded">
              {activeChannelData.name}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-blue-500 p-1"
            onClick={sendEmergencyAlert}
            title="Emergency Alert"
          >
            <AlertTriangle className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-blue-500 p-1"
            onClick={onToggleMinimize}
          >
            <Minimize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Channel List */}
        <div className="w-24 border-r border-gray-200 bg-gray-50">
          <div className="p-2 space-y-1">
            {channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => setActiveChannel(channel.id)}
                className={`w-full p-2 rounded text-xs font-medium transition-colors relative ${
                  activeChannel === channel.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                } ${channel.type === 'emergency' ? 'text-red-600' : ''}`}
                title={channel.name}
              >
                {channel.type === 'emergency' && '🚨'}
                {channel.type === 'project' && '🏗️'}
                {channel.type === 'group' && '👥'}
                {channel.type === 'direct' && '💬'}
                
                {channel.unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">
                    {channel.unreadCount}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.senderId === currentUserId ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${
                  message.senderId === currentUserId 
                    ? 'bg-blue-500 text-white' 
                    : message.type === 'safety_alert'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-900'
                } rounded-lg p-3`}>
                  {message.senderId !== currentUserId && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-xs">{message.senderName}</span>
                      <span className="text-xs opacity-75 px-1 py-0.5 bg-black/20 rounded">
                        {message.senderRole}
                      </span>
                    </div>
                  )}
                  
                  {message.type === 'image' && message.metadata?.imageUrl && (
                    <img
                      src={message.metadata.imageUrl}
                      alt="Shared image"
                      className="rounded mb-2 max-w-full h-32 object-cover"
                    />
                  )}
                  
                  {message.type === 'location' && (
                    <div className="flex items-center gap-2 mb-2 text-sm">
                      <MapPin className="w-4 h-4" />
                      <span>{message.metadata?.location?.address || 'Location shared'}</span>
                    </div>
                  )}
                  
                  <p className="text-sm">{message.content}</p>
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs opacity-75">
                      {formatTime(message.timestamp)}
                    </span>
                    {message.senderId === currentUserId && (
                      <div className="flex items-center">
                        {getMessageStatusIcon(message.status)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*,*"
                className="hidden"
              />
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                className="flex-shrink-0"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={sendLocationMessage}
                className="flex-shrink-0"
              >
                <MapPin className="w-4 h-4" />
              </Button>
              
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                size="icon"
                className="flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
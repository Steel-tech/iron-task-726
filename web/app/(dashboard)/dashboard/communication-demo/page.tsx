'use client'

import { useState } from 'react'
import { MessageCircle, Users, Globe, AtSign, Bell } from 'lucide-react'
import { Button } from '@/components/Button'
import Comments from '@/components/Comments'
import TeamChat from '@/components/TeamChat'
import NotificationBell from '@/components/NotificationBell'

// Demo data
const demoMedia = {
  id: 'demo-media-1',
  fileUrl: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=2000',
  mediaType: 'PHOTO' as const,
  project: {
    id: 'demo-project-1',
    name: 'Downtown Tower Construction'
  }
}

const demoProjectMembers = [
  { id: '1', name: 'John Steel', role: 'STEEL_ERECTOR' },
  { id: '2', name: 'Mike Welder', role: 'WELDER' },
  { id: '3', name: 'Sarah Safety', role: 'SAFETY_INSPECTOR' },
  { id: '4', name: 'Tom Manager', role: 'PROJECT_MANAGER' },
  { id: '5', name: 'Carlos Constructor', role: 'STEEL_ERECTOR' },
  { id: '6', name: 'Maria Engineer', role: 'ADMIN' }
]

export default function CommunicationDemoPage() {
  const [activeTab, setActiveTab] = useState<'comments' | 'chat'>('comments')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageCircle className="h-8 w-8 text-safety-orange" />
          <h1 className="text-3xl font-bold font-shogun text-white">Communication Demo</h1>
        </div>
      </div>

      {/* Feature Overview */}
      <div className="brushed-metal rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Multi-Language Team Communication</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <Globe className="h-12 w-12 text-safety-orange mx-auto mb-3" />
            <h3 className="font-medium text-white mb-2">Auto-Translation</h3>
            <p className="text-sm text-gray-400">
              Comments and messages are automatically translated to each team member&apos;s language
            </p>
          </div>
          <div className="text-center">
            <AtSign className="h-12 w-12 text-safety-orange mx-auto mb-3" />
            <h3 className="font-medium text-white mb-2">@Mentions</h3>
            <p className="text-sm text-gray-400">
              Tag team members to ensure they see important messages and get instant notifications
            </p>
          </div>
          <div className="text-center">
            <Bell className="h-12 w-12 text-safety-orange mx-auto mb-3" />
            <h3 className="font-medium text-white mb-2">Smart Notifications</h3>
            <p className="text-sm text-gray-400">
              Get notified when mentioned, when someone replies, or reacts to your comments
            </p>
          </div>
        </div>
      </div>

      {/* Demo Tabs */}
      <div className="brushed-metal rounded-lg shadow-lg">
        <div className="border-b border-gray-700">
          <div className="flex">
            <button
              onClick={() => setActiveTab('comments')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'comments'
                  ? 'text-white border-b-2 border-safety-orange'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <MessageCircle className="h-4 w-4 inline mr-2" />
              Photo Comments
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'chat'
                  ? 'text-white border-b-2 border-safety-orange'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Users className="h-4 w-4 inline mr-2" />
              Team Chat
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'comments' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Photo Preview */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Construction Photo</h3>
                <img
                  src={demoMedia.fileUrl}
                  alt="Construction site"
                  className="w-full rounded-lg"
                />
                <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                  <h4 className="font-medium text-white mb-2">Try These Features:</h4>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li>• Type @ to mention team members</li>
                    <li>• Add reactions to comments (👍 ❤️ ❓ ✓)</li>
                    <li>• Reply to create threaded discussions</li>
                    <li>• Edit or delete your own comments</li>
                    <li>• See auto-translation indicators 🌐</li>
                  </ul>
                </div>
              </div>

              {/* Comments Section */}
              <div>
                <Comments 
                  mediaId={demoMedia.id}
                  projectMembers={demoProjectMembers}
                />
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              <div className="h-[600px] brushed-metal rounded-lg overflow-hidden">
                <TeamChat
                  projectId={demoMedia.project.id}
                  projectName={demoMedia.project.name}
                />
              </div>
              <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                <h4 className="font-medium text-white mb-2">Team Chat Features:</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>• Real-time messaging with WebSocket</li>
                  <li>• See who&apos;s online with green indicators</li>
                  <li>• @mention team members for urgent messages</li>
                  <li>• Auto-translation for multilingual teams</li>
                  <li>• Message history and search</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* How It Works */}
      <div className="brushed-metal rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-6">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-safety-orange rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-3">
              1
            </div>
            <h3 className="font-medium text-white mb-2">Create a Project</h3>
            <p className="text-sm text-gray-400">
              Set up your construction project in Iron Task
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-safety-orange rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-3">
              2
            </div>
            <h3 className="font-medium text-white mb-2">Take Photos</h3>
            <p className="text-sm text-gray-400">
              Capture construction progress and safety issues
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-safety-orange rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-3">
              3
            </div>
            <h3 className="font-medium text-white mb-2">Add Comments</h3>
            <p className="text-sm text-gray-400">
              Discuss directly on photos with auto-translation
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-safety-orange rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-3">
              4
            </div>
            <h3 className="font-medium text-white mb-2">@Mention</h3>
            <p className="text-sm text-gray-400">
              Tag team members for instant notifications
            </p>
          </div>
        </div>
      </div>

      {/* Language Support */}
      <div className="brushed-metal rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Supported Languages</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { code: 'en', name: 'English', flag: '🇺🇸' },
            { code: 'es', name: 'Spanish', flag: '🇪🇸' },
            { code: 'fr', name: 'French', flag: '🇫🇷' },
            { code: 'de', name: 'German', flag: '🇩🇪' },
            { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
            { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
            { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
            { code: 'ko', name: 'Korean', flag: '🇰🇷' }
          ].map(lang => (
            <div key={lang.code} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
              <span className="text-2xl">{lang.flag}</span>
              <div>
                <p className="font-medium text-white">{lang.name}</p>
                <p className="text-xs text-gray-400">Auto-translated</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
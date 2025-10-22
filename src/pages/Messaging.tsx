import { useState, useEffect, useRef } from 'react'
import { Search, Send, Paperclip, Smile, MoreVertical, Bell, Settings } from 'lucide-react'
import { useMessaging } from '../contexts/MessagingContext'
import { useAuth } from '../contexts/AuthContext'
import { messagingService } from '../services/messagingService'
import { TeamMessage } from '../types'

export default function Messaging() {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<TeamMessage[]>([])
  const [loading, setLoading] = useState(true)
  const { teams, activeTeam, setActiveTeam, loading: contextLoading, unreadCounts, markMessagesAsRead, refreshUnreadCounts } = useMessaging()
  const { currentUser } = useAuth()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const hasMarkedAsRead = useRef(false)

  // Load messages when active team changes
  useEffect(() => {
    if (!activeTeam || !currentUser) return

    const loadMessages = async () => {
      try {
        setLoading(true)
        hasMarkedAsRead.current = false
        const teamMessages = await messagingService.getTeamMessages(activeTeam.id)
        setMessages(teamMessages)
      } catch (error) {
        console.error('Error loading messages:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMessages()
  }, [activeTeam, currentUser])

  // Mark messages as read when they are displayed to the user
  useEffect(() => {
    if (!activeTeam || !currentUser || loading || messages.length === 0 || hasMarkedAsRead.current) return

    const markAsRead = async () => {
      try {
        await markMessagesAsRead(activeTeam.id)
        hasMarkedAsRead.current = true
      } catch (error) {
        console.error('Error marking messages as read:', error)
      }
    }

    // Add a small delay to ensure messages are rendered before marking as read
    const timer = setTimeout(() => {
      markAsRead()
    }, 100)

    return () => clearTimeout(timer)
  }, [activeTeam, currentUser, loading, messages.length, markMessagesAsRead])

  // Subscribe to real-time messages
  useEffect(() => {
    if (!activeTeam || !currentUser) return

    const unsubscribe = messagingService.subscribeToTeamMessagesWithSound(
      activeTeam.id,
      currentUser.uid,
      (newMessages) => {
        setMessages(newMessages)
        // If we receive new messages and we're currently viewing this team,
        // we might want to mark them as read if they're displayed
        if (!loading && newMessages.length > messages.length && !hasMarkedAsRead.current) {
          hasMarkedAsRead.current = true
          markMessagesAsRead(activeTeam.id)
        }
      }
    )

    return () => unsubscribe()
  }, [activeTeam, currentUser, loading, messages.length, markMessagesAsRead])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !activeTeam || !currentUser) return

    try {
      await messagingService.createMessage(
        {
          teamId: activeTeam.id,
          content: message
        },
        currentUser.uid,
        currentUser.name,
        currentUser.email
      )

      setMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
      // Show user-friendly error message
      alert(error instanceof Error ? error.message : 'Failed to send message. Please try again.')
    }
  }

  // Show loading state while context is loading
  if (contextLoading) {
    return (
      <div className="flex h-full bg-white dark:bg-gray-800 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading teams...</p>
        </div>
      </div>
    )
  }

  // Show message if user is not part of any teams
  if (teams.length === 0) {
    return (
      <div className="flex h-full bg-white dark:bg-gray-800 items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">No Teams Available</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            You are not currently a member of any teams. Contact your administrator to be added to a team.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full bg-white dark:bg-gray-800">
      {/* Sidebar - Team List */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Team Messages</h1>
            <div className="flex space-x-2">
              <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <MoreVertical className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search teams..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-gray-600 outline-none"
            />
          </div>
        </div>

        {/* Team List */}
        <div className="flex-1 overflow-y-auto">
          {teams.map((team) => {
            const unreadCount = unreadCounts[team.id] || 0;
            return (
              <div
                key={team.id}
                className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  activeTeam?.id === team.id ? 'bg-blue-50 dark:bg-blue-900' : ''
                }`}
                onClick={() => setActiveTeam(team)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: team.color || '#3B82F6' }}
                      >
                        {team.name.charAt(0)}
                      </div>
                      {unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">{team.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate w-40">
                        {team.description || 'Team chat'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {team.memberCount} {team.memberCount === 1 ? 'member' : 'members'}
                    </p>
                    {unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        {activeTeam ? (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: activeTeam.color || '#3B82F6' }}
              >
                {activeTeam.name.charAt(0)}
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-gray-100">{activeTeam.name}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{activeTeam.memberCount} members</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <Bell className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
              <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <Settings className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-bold text-gray-900 dark:text-gray-100">Select a Team</h2>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeTeam ? (
            loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                  <p className="text-gray-500 dark:text-gray-400">Loading messages...</p>
                </div>
              </div>
            ) : messages.length > 0 ? (
              <div>
                <div className="text-xs text-gray-500 mb-2">Displaying {messages.length} messages</div>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex mb-4 ${msg.senderId === currentUser?.uid ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] px-4 py-2 rounded-lg ${
                        msg.senderId === currentUser?.uid
                          ? 'bg-blue-500 text-white rounded-br-none'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none'
                      }`}
                    >
                      {msg.senderId !== currentUser?.uid && (
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          {msg.senderName}
                        </p>
                      )}
                      <p className="break-words">{msg.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.senderId === currentUser?.uid ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-gray-500 dark:text-gray-400">No messages yet. Be the first to start the conversation!</p>
                  <p className="text-xs text-gray-400 mt-2">Team ID: {activeTeam.id}</p>
                </div>
              </div>
            )
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-gray-500 dark:text-gray-400">Select a team to view messages</p>
              </div>
            </div>
          )}
        </div>

        {/* Message Input */}
        {activeTeam && currentUser && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
              <button 
                type="button"
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Paperclip className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
              <button 
                type="button"
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Smile className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-gray-600 outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={!message.trim()}
                className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
                  message.trim()
                    ? 'bg-primary-500 hover:bg-primary-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
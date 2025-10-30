import { useState, useEffect, useRef } from 'react'
import { Search, Send, Paperclip, Smile, MoreVertical, Bell, Settings } from 'lucide-react'
import { useMessaging } from '../contexts/MessagingContext'
import { useAuth } from '../contexts/AuthContext'
import { messagingService } from '../services/messagingService'
import { TeamMessage, TeamMember } from '../types'
import MentionInput from '../components/messaging/MentionInput'
import { teamService } from '../services/teamService'


export default function Messaging() {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<TeamMessage[]>([])
  const [loading, setLoading] = useState(true)
  const { teams, activeTeam, setActiveTeam, loading: contextLoading, unreadCounts, markMessagesAsRead, refreshUnreadCounts } = useMessaging()
  const { currentUser } = useAuth()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const hasMarkedAsRead = useRef(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [messageNotifications, setMessageNotifications] = useState(true)
  const [soundAlerts, setSoundAlerts] = useState(true)
  const [mentionNotifications, setMentionNotifications] = useState(true)

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

  // Function to extract mentioned users from message content
  const extractMentionedUsers = async (content: string): Promise<string[]> => {
    if (!activeTeam || !currentUser) return []

    try {
      console.log('=== extractMentionedUsers called ===');
      console.log('Content:', content);
      console.log('Active team ID:', activeTeam.id);
      console.log('Current user ID:', currentUser.uid);
      
      // Get team members
      const teamMembers = await teamService.getTeamMembers(activeTeam.id)
      console.log('Team members:', teamMembers);
      
      // Filter out the current user and inactive members
      const activeMembers = teamMembers.filter(
        member => member.userId !== currentUser.uid && member.isActive
      )
      console.log('Active members (excluding current user):', activeMembers);
      
      // Extract mentioned user IDs
      const mentionedUserIds: string[] = []
      
      // Find all mentions in the message
      const mentionRegex = /@(\w+)/g
      let match
      while ((match = mentionRegex.exec(content)) !== null) {
        const mentionedUserName = match[1]
        console.log('Found mention:', mentionedUserName);
        const mentionedMember = activeMembers.find(
          member => member.userName === mentionedUserName
        )
        if (mentionedMember) {
          console.log('Found matching member:', mentionedMember);
          mentionedUserIds.push(mentionedMember.userId)
        } else {
          console.log('No matching member found for:', mentionedUserName);
        }
      }
      
      console.log('Extracted mentioned user IDs:', mentionedUserIds);
      return mentionedUserIds
    } catch (error) {
      console.error('Error extracting mentioned users:', error)
      return []
    }
  }

  // Function to handle sending messages with mentions
  const handleSendMessageWithMentions = async (content: string, mentionedUserIds: string[]) => {
    console.log('=== handleSendMessageWithMentions called ===');
    console.log('Content:', content);
    console.log('Mentioned user IDs:', mentionedUserIds);
    
    if (!content.trim() || !activeTeam || !currentUser) return

    try {
      await messagingService.createMessage(
        {
          teamId: activeTeam.id,
          content: content
        },
        currentUser.uid,
        currentUser.name,
        currentUser.email
      )

      // Send mention notifications
      if (mentionedUserIds.length > 0) {
        console.log('Sending mention notifications to', mentionedUserIds.length, 'users');
        const { MentionNotificationService } = await import('../services/mentionNotificationService')
        
        // Send notification to each mentioned user
        for (const userId of mentionedUserIds) {
          if (userId !== currentUser.uid) {
            console.log('Sending notification to user:', userId);
            try {
              await MentionNotificationService.createMentionNotification(
                userId,
                currentUser.name,
                'message',
                `${activeTeam.name}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
                activeTeam.id
              )
            } catch (error) {
              console.error('Error sending mention notification:', error)
            }
          }
        }
      } else {
        console.log('No mentions to send notifications for');
      }

      setMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
      // Show user-friendly error message
      alert(error instanceof Error ? error.message : 'Failed to send message. Please try again.')
    }
  }

  // Handle send button click
  const handleSendButtonClick = async () => {
    if (!message.trim() || !activeTeam || !currentUser) return

    // Extract mentioned users
    const mentionedUserIds = await extractMentionedUsers(message)
    
    // Send message with mentions
    await handleSendMessageWithMentions(message, mentionedUserIds)
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
              <button 
                onClick={() => setShowSettingsModal(true)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
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
            <form onSubmit={(e) => { e.preventDefault(); }} className="flex items-center space-x-2">
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
                <MentionInput
                  value={message}
                  onChange={setMessage}
                  onSendMessage={handleSendMessageWithMentions}
                  teamId={activeTeam.id}
                  currentUserId={currentUser.uid}
                  currentUserName={currentUser.name}
                  placeholder="Type a message... @ to mention teammates"
                />
              </div>
              <button
                type="submit"
                disabled={!message.trim()}
                onClick={handleSendButtonClick}
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

      {/* Team Messaging Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Team Messaging Settings</h3>
                <button 
                  onClick={() => setShowSettingsModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Message Notifications</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Get notified when new messages arrive</p>
                  </div>
                  <button
                    onClick={() => setMessageNotifications(!messageNotifications)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      messageNotifications ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        messageNotifications ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Sound Alerts</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Play sound when receiving messages</p>
                  </div>
                  <button
                    onClick={() => setSoundAlerts(!soundAlerts)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      soundAlerts ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        soundAlerts ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Mention Notifications</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Get notified when you're mentioned</p>
                  </div>
                  <button
                    onClick={() => setMentionNotifications(!mentionNotifications)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      mentionNotifications ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        mentionNotifications ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
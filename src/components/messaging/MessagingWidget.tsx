import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { 
  MessageCircle, 
  X, 
  Send, 
  Smile, 
  Edit2,
  Trash2,
  Reply,
  GripHorizontal
} from 'lucide-react'
import { useMessaging } from '../../contexts/MessagingContext'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { Message } from '../../types'
import { formatDistanceToNow } from 'date-fns'
// Added MentionInput import
import MentionInput from '../common/MentionInput'
// Added MentionText import
import MentionText from '../common/MentionText'

interface MessagingWidgetProps {
  teamId?: string
  teamName?: string
}

export default function MessagingWidget({ teamId, teamName }: MessagingWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [editingMessage, setEditingMessage] = useState<Message | null>(null)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [mentions, setMentions] = useState<string[]>([]) // Added mentions state
  const [widgetHeight, setWidgetHeight] = useState<number>(384) // Default height in pixels (h-96 = 24rem = 384px)
  const [isResizing, setIsResizing] = useState(false)
  const [isUserScrolling, setIsUserScrolling] = useState(false) // Track if user is manually scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const location = useLocation()
  const resizeRef = useRef<HTMLDivElement>(null)

  const { 
    currentTeamId, 
    setCurrentTeamId, 
    messages, 
    teamChats,
    sendMessage, 
    editMessage, 
    deleteMessage, 
    addReaction,
    unreadCounts,
    markMessagesAsRead,
    isMessagingWidgetOpen,
    setIsMessagingWidgetOpen
  } = useMessaging()
  const { currentUser } = useAuth()
  const { isDarkMode } = useTheme()

  // Sync widget open state with context
  useEffect(() => {
    setIsMessagingWidgetOpen(isOpen)
  }, [isOpen, setIsMessagingWidgetOpen])

  // Load saved widget height from localStorage
  useEffect(() => {
    const savedHeight = localStorage.getItem('chatWidgetHeight')
    if (savedHeight) {
      setWidgetHeight(parseInt(savedHeight, 10))
    }
  }, [])

  // Save widget height to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('chatWidgetHeight', widgetHeight.toString())
  }, [widgetHeight])

  // Handle URL parameters to auto-open widget for chat mentions
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const teamParam = params.get('team')
    const isChatRoute = location.pathname === '/chat'
    
    if (isChatRoute && teamParam) {
      // Set the team and open the widget
      setCurrentTeamId(teamParam)
      setIsOpen(true)
    }
  }, [location, setCurrentTeamId])

  // Mark messages as read when the widget opens and there's a current team
  useEffect(() => {
    if (isOpen && currentTeamId) {
      markMessagesAsRead(currentTeamId)
    }
  }, [isOpen, currentTeamId])

  // Set team ID when component mounts or teamId prop changes
  useEffect(() => {
    if (teamId && teamId !== currentTeamId) {
      setCurrentTeamId(teamId)
    }
  }, [teamId, currentTeamId, setCurrentTeamId])

  // Scroll to bottom when team changes or widget opens
  useEffect(() => {
    if (isOpen && messagesContainerRef.current) {
      // Reset user scrolling state when opening or changing teams
      setIsUserScrolling(false);
      // Scroll to bottom after a short delay to ensure content is rendered
      setTimeout(() => {
        if (messagesContainerRef.current && messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView();
        }
      }, 100);
    }
  }, [isOpen, currentTeamId]);

  // Handle auto-scroll to bottom when new messages arrive (but only if user is not manually scrolling)
  useEffect(() => {
    if (!isUserScrolling && messagesContainerRef.current) {
      // Add a small delay to ensure DOM is updated before scrolling
      setTimeout(() => {
        if (messagesContainerRef.current && messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 10);
    }
  }, [messages, isUserScrolling]);

  // Clear messages when no team is selected
  useEffect(() => {
    if (!currentTeamId) {
      // This will be handled by the context, but we can ensure UI state is clean
    }
  }, [currentTeamId])

  // Focus textarea when opening
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      // Focus will be handled by MentionInput
    }
  }, [isOpen])

  // Handle mouse events for resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      
      const newHeight = window.innerHeight - e.clientY - 24 // 24px for bottom margin
      // Set minimum and maximum height constraints
      const minHeight = 200
      const maxHeight = window.innerHeight - 100
      
      if (newHeight >= minHeight && newHeight <= maxHeight) {
        setWidgetHeight(newHeight)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  // Function to generate a consistent color based on user name
  const getColorForUser = (name: string): string => {
    // Simple hash function to generate a consistent color
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Generate HSL color with consistent saturation and lightness
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 40%)`;
  };

  // Handle scroll events to detect user scrolling direction
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Check if user is near the bottom (within 100px)
      const isNearBottom = 
        container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      
      // Update isUserScrolling state
      // If user is not near bottom, they are manually scrolling
      setIsUserScrolling(!isNearBottom);
    };

    container.addEventListener('scroll', handleScroll);
    
    // Clean up the event listener
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }); // Empty dependency array is fine since we're attaching to the ref

  // Handle message text change with mentions
  const handleMessageTextChange = (value: string, newMentions: string[]) => {
    setMessageText(value)
    setMentions(newMentions)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageText.trim()) return

    try {
      if (editingMessage) {
        await editMessage(editingMessage.id, messageText)
        setEditingMessage(null)
      } else {
        await sendMessage(messageText, replyingTo?.id, mentions)
        // Process mentions for notifications
        // Note: This would typically be done server-side for security
      }
      setMessageText('')
      setMentions([]) // Clear mentions
      // No need to set wasAtBottom since we're using isUserScrolling
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleEditMessage = (message: Message) => {
    setEditingMessage(message)
    setMessageText(message.content)
    // Focus will be handled by MentionInput
  }

  const handleCancelEdit = () => {
    setEditingMessage(null)
    setMessageText('')
    setMentions([]) // Clear mentions
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await deleteMessage(messageId)
      } catch (error) {
        console.error('Error deleting message:', error)
      }
    }
  }

  const handleAddReaction = async (messageId: string, emoji: string) => {
    try {
      await addReaction(messageId, emoji)
      setShowEmojiPicker(false)
    } catch (error) {
      console.error('Error adding reaction:', error)
    }
  }

  const handleStartResize = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }

  const emojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '👏']

  const canEditMessage = (message: Message) => {
    return currentUser && message.senderId === currentUser.uid
  }

  const canDeleteMessage = (message: Message) => {
    return currentUser && message.senderId === currentUser.uid
  }

  // Calculate total unread messages across all teams
  const totalUnreadCount = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0)

  // Show widget even without a team - it will show a message to join a team
  // if (!currentTeamId) {
  //   return null
  // }

  return (
    <>
      {/* Widget Toggle Button with Unread Count */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 sm:bottom-12 sm:right-16 p-3 rounded-full shadow-lg hover:bg-primary-700 transition-colors z-40 ${isDarkMode ? 'bg-primary-600 text-white' : 'bg-primary-600 text-white'}`}
        title="Team Chat"
      >
        <div className="relative">
          <MessageCircle className="h-6 w-6" />
          {totalUnreadCount > 0 && (
            <span className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
            </span>
          )}
        </div>
      </button>

      {/* Messaging Widget */}
      {isOpen && (
        <div 
          className={`fixed bottom-6 right-6 sm:bottom-12 sm:right-16 w-80 sm:w-96 rounded-lg shadow-xl border flex flex-col z-50 max-h-[calc(100vh-4rem)] sm:max-h-[calc(100vh-6rem)] ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
          style={{ height: `${widgetHeight}px` }}
        >
          {/* Resize Handle */}
          <div
            ref={resizeRef}
            className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize flex items-center justify-center"
            onMouseDown={handleStartResize}
          >
            <div className={`w-8 h-1 rounded-full opacity-0 hover:opacity-100 transition-opacity ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
          </div>

          {/* Header */}
          <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} rounded-t-lg pt-3`}>
            <div className="flex-1">
              <h3 className={`font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                {teamName || (() => {
                  const currentTeam = teamChats.find(chat => chat.teamId === currentTeamId)
                  return currentTeam ? currentTeam.teamName : 'No Team Selected'
                })()}
              </h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {currentTeamId ? `${messages.length} messages` : 'Join a team to start chatting'}
                {currentTeamId && unreadCounts[currentTeamId] > 0 && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    {unreadCounts[currentTeamId]} unread
                  </span>
                )}
              </p>
            </div>
            
            {/* Team Selector */}
            {teamChats.length > 1 && (
              <select
                value={currentTeamId || ''}
                onChange={(e) => setCurrentTeamId(e.target.value || null)}
                className={`ml-2 text-xs border rounded px-2 py-1 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
              >
                <option value="">Select Team</option>
                {teamChats.map(chat => (
                  <option key={chat.teamId} value={chat.teamId}>
                    {chat.teamName}
                    {unreadCounts[chat.teamId] > 0 && ` (${unreadCounts[chat.teamId]})`}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className={`p-1 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
            >
              <X className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </button>
          </div>

          {/* Messages */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-1 py-2 space-y-2">
            {!currentTeamId ? (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <MessageCircle className={`h-12 w-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                  <h4 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>No Team Selected</h4>
                  <p className={`mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Join a team to start chatting with your teammates.
                  </p>
                  <button
                    onClick={() => window.location.href = '/teams'}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Go to Teams
                  </button>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <MessageCircle className={`h-12 w-12 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                  <h4 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>No Messages Yet</h4>
                  <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                    Be the first to start a conversation in {teamChats.find(chat => chat.teamId === currentTeamId)?.teamName || 'this team'}.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => {
                  const isCurrentUser = currentUser && message.senderId === currentUser.uid;
                  return (
                    <div 
                      key={message.id} 
                      className={`group flex ${isCurrentUser ? 'justify-end' : 'justify-start'} w-full px-1`}
                    >
                      <div className={`flex ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} max-w-[92%] w-auto`}>
                        <div 
                          className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${isCurrentUser ? 'ml-2' : 'mr-2'} self-start`}
                          title={`${message.senderName} (${message.senderEmail})`}
                          style={{ backgroundColor: getColorForUser(message.senderName) }}
                        >
                          {message.senderName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`flex items-baseline ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} space-x-1 mb-1`}>
                            <h4 className={`text-sm font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{message.senderName}</h4>
                            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
                            </span>
                          </div>
                          <div className="relative">
                            <div className={`${isCurrentUser ? 'float-right clear-right' : 'float-left clear-left'}`}>
                              <p className={`text-sm whitespace-pre-wrap break-words p-3 rounded-2xl ${
                                isCurrentUser 
                                  ? 'bg-blue-500 text-white rounded-tr-none' 
                                  : `${isDarkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-100 text-gray-800'} rounded-tl-none`
                              }`}>
                                {/* Use MentionText to properly display mentions */}
                                <MentionText 
                                  text={message.content} 
                                  mentions={[]} // In a real implementation, you would pass actual mention data here
                                />
                              </p>
                              
                              {/* Reactions */}
                              {message.reactions && message.reactions.length > 0 && (
                                <div className={`flex flex-wrap gap-1 mt-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                                  {message.reactions.map((reaction, index) => (
                                    <span 
                                      key={index} 
                                      className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${isDarkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-100 text-gray-600'}`}
                                    >
                                      {reaction.emoji}
                                      <span className="ml-1">{reaction.userName}</span>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            {/* Message Actions */}
                            <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1 absolute -top-8 ${isCurrentUser ? 'left-0' : 'right-0'}`}>
                              <button
                                onClick={() => setReplyingTo(message)}
                                className={`p-1.5 rounded-full shadow-md hover:shadow-lg transition-all ${isDarkMode ? 'text-gray-400 hover:text-gray-200 bg-gray-700' : 'text-gray-500 hover:text-gray-700 bg-white'}`}
                                title="Reply"
                              >
                                <Reply className="h-4 w-4" />
                              </button>
                              {canEditMessage(message) && (
                                <button
                                  onClick={() => handleEditMessage(message)}
                                  className={`p-1.5 rounded-full shadow-md hover:shadow-lg transition-all ${isDarkMode ? 'text-gray-400 hover:text-gray-200 bg-gray-700' : 'text-gray-500 hover:text-gray-700 bg-white'}`}
                                  title="Edit"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                              )}
                              {canDeleteMessage(message) && (
                                <button
                                  onClick={() => handleDeleteMessage(message.id)}
                                  className={`p-1.5 rounded-full shadow-md hover:shadow-lg transition-all ${isDarkMode ? 'text-gray-400 hover:text-red-400 bg-gray-700' : 'text-gray-500 hover:text-red-500 bg-white'}`}
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                className={`p-1.5 rounded-full shadow-md hover:shadow-lg transition-all ${isDarkMode ? 'text-gray-400 hover:text-gray-200 bg-gray-700' : 'text-gray-500 hover:text-gray-700 bg-white'}`}
                                title="Add reaction"
                              >
                                <Smile className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Reply indicator */}
          {replyingTo && (
            <div className={`px-4 py-2 border-t flex items-center justify-between ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Replying to {replyingTo.senderName}</span>
              <button 
                onClick={() => setReplyingTo(null)}
                className={isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className={`border-t p-4 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex space-x-2">
              {currentTeamId && currentUser?.uid ? (
                <MentionInput
                  value={messageText}
                  onChange={handleMessageTextChange}
                  teamId={currentTeamId || undefined}
                  currentUserId={currentUser?.uid}
                  placeholder="Type a message"
                  className={`flex-grow resize-none border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:cursor-not-allowed ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100 disabled:bg-gray-800' : 'bg-white border-gray-300 text-gray-900 disabled:bg-gray-100'}`}
                  rows={1}
                  disabled={!currentTeamId}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage(e)
                    }
                  }}
                />
              ) : (
                <div className="flex-grow">
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message"
                    className={`w-full resize-none border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:cursor-not-allowed ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100 disabled:bg-gray-800' : 'bg-white border-gray-300 text-gray-900 disabled:bg-gray-100'}`}
                    rows={1}
                    disabled={!currentTeamId}
                  />
                  {!currentTeamId && (
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Join a team to enable @mentions</p>
                  )}
                </div>
              )}
              <button
                type="submit"
                disabled={!messageText.trim() || !currentTeamId}
                className={`px-3 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center h-[36px] ${isDarkMode ? 'bg-primary-600 text-white' : 'bg-primary-600 text-white'}`}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
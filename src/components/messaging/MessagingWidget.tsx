import { useState, useRef, useEffect } from 'react'
import { 
  MessageCircle, 
  X, 
  Send, 
  Smile, 
  Edit2,
  Trash2,
  Reply
} from 'lucide-react'
import { useMessaging } from '../../contexts/MessagingContext'
import { useAuth } from '../../contexts/AuthContext'
import { Message } from '../../types'
import { formatDistanceToNow } from 'date-fns'

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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { 
    currentTeamId, 
    setCurrentTeamId, 
    messages, 
    teamChats,
    sendMessage, 
    editMessage, 
    deleteMessage, 
    addReaction 
  } = useMessaging()
  const { currentUser } = useAuth()

  // Set team ID when component mounts or teamId prop changes
  useEffect(() => {
    if (teamId && teamId !== currentTeamId) {
      setCurrentTeamId(teamId)
    }
  }, [teamId, currentTeamId, setCurrentTeamId])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus textarea when opening
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isOpen])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageText.trim()) return

    try {
      if (editingMessage) {
        await editMessage(editingMessage.id, messageText)
        setEditingMessage(null)
      } else {
        await sendMessage(messageText, replyingTo?.id)
        setReplyingTo(null)
      }
      setMessageText('')
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleEditMessage = (message: Message) => {
    setEditingMessage(message)
    setMessageText(message.content)
    textareaRef.current?.focus()
  }

  const handleCancelEdit = () => {
    setEditingMessage(null)
    setMessageText('')
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

  const emojis = ['👍', '❤️', '😂', '😮', '😢', '😡', '🎉', '👏']

  const canEditMessage = (message: Message) => {
    return currentUser && message.senderId === currentUser.uid
  }

  const canDeleteMessage = (message: Message) => {
    return currentUser && message.senderId === currentUser.uid
  }

  // Show widget even without a team - it will show a message to join a team
  // if (!currentTeamId) {
  //   return null
  // }

  return (
    <>
      {/* Widget Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-4 sm:bottom-12 bg-primary-600 text-white p-3 rounded-full shadow-lg hover:bg-primary-700 transition-colors z-40"
        title="Team Chat"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {/* Messaging Widget */}
      {isOpen && (
        <div className="fixed bottom-6 right-4 sm:bottom-12 w-80 sm:w-96 h-80 sm:h-96 bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col z-50 max-h-[calc(100vh-4rem)] sm:max-h-[calc(100vh-6rem)]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">
                {teamName || (() => {
                  const currentTeam = teamChats.find(chat => chat.teamId === currentTeamId)
                  return currentTeam ? currentTeam.teamName : 'No Team Selected'
                })()}
              </h3>
              <p className="text-sm text-gray-500">
                {currentTeamId ? `${messages.length} messages` : 'Join a team to start chatting'}
              </p>
            </div>
            
            {/* Team Selector */}
            {teamChats.length > 1 && (
              <select
                value={currentTeamId || ''}
                onChange={(e) => setCurrentTeamId(e.target.value || null)}
                className="ml-2 text-xs border border-gray-300 rounded px-2 py-1 bg-white"
              >
                <option value="">Select Team</option>
                {teamChats.map(chat => (
                  <option key={chat.teamId} value={chat.teamId}>
                    {chat.teamName}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {!currentTeamId ? (
              <div className="flex items-center justify-center h-full text-center">
                <div>
                  <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Team Selected</h4>
                  <p className="text-gray-500 mb-4">
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
                  <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Messages Yet</h4>
                  <p className="text-gray-500">
                    Start the conversation by sending a message below.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.senderId === currentUser?.uid ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-3 py-2 rounded-lg ${
                    message.senderId === currentUser?.uid
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {message.senderId !== currentUser?.uid && (
                    <p className="text-xs font-medium mb-1 opacity-75">
                      {message.senderName}
                    </p>
                  )}
                  
                  {replyingTo?.id === message.id && (
                    <div className="text-xs opacity-75 mb-1 p-1 bg-black bg-opacity-20 rounded">
                      Replying to: {replyingTo.content.substring(0, 50)}...
                    </div>
                  )}
                  
                  <p className="text-sm">{message.content}</p>
                  
                  {message.isEdited && (
                    <p className="text-xs opacity-75 mt-1">(edited)</p>
                  )}
                  
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs opacity-75">
                      {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                    </p>
                    
                    {message.reactions && message.reactions.length > 0 && (
                      <div className="flex space-x-1">
                        {Object.entries(
                          message.reactions.reduce((acc, reaction) => {
                            acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1
                            return acc
                          }, {} as Record<string, number>)
                        ).map(([emoji, count]) => (
                          <button
                            key={emoji}
                            onClick={() => handleAddReaction(message.id, emoji)}
                            className="text-xs hover:bg-black hover:bg-opacity-20 rounded px-1"
                          >
                            {emoji} {count}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Message Actions */}
                  <div className="flex space-x-1 mt-2">
                    <button
                      onClick={() => setReplyingTo(message)}
                      className="text-xs opacity-75 hover:opacity-100 p-1 hover:bg-black hover:bg-opacity-20 rounded"
                      title="Reply"
                    >
                      <Reply className="h-3 w-3" />
                    </button>
                    
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="text-xs opacity-75 hover:opacity-100 p-1 hover:bg-black hover:bg-opacity-20 rounded"
                      title="React"
                    >
                      <Smile className="h-3 w-3" />
                    </button>
                    
                    {canEditMessage(message) && (
                      <button
                        onClick={() => handleEditMessage(message)}
                        className="text-xs opacity-75 hover:opacity-100 p-1 hover:bg-black hover:bg-opacity-20 rounded"
                        title="Edit"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                    )}
                    
                    {canDeleteMessage(message) && (
                      <button
                        onClick={() => handleDeleteMessage(message.id)}
                        className="text-xs opacity-75 hover:opacity-100 p-1 hover:bg-black hover:bg-opacity-20 rounded"
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="absolute bottom-20 left-4 right-4 bg-white border border-gray-200 rounded-lg p-2 shadow-lg">
              <div className="flex space-x-2">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleAddReaction(messages[messages.length - 1]?.id || '', emoji)}
                    className="text-lg hover:bg-gray-100 rounded p-1"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
            {!currentTeamId && (
              <div className="mb-2 p-2 bg-yellow-50 rounded text-xs text-yellow-600">
                Join a team to start messaging
              </div>
            )}
            {replyingTo && (
              <div className="mb-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                Replying to: {replyingTo.content.substring(0, 50)}...
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="ml-2 text-primary-600 hover:text-primary-800"
                >
                  Cancel
                </button>
              </div>
            )}
            
            {editingMessage && (
              <div className="mb-2 p-2 bg-blue-50 rounded text-xs text-blue-600">
                Editing message...
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="ml-2 text-primary-600 hover:text-primary-800"
                >
                  Cancel
                </button>
              </div>
            )}
            
            <div className="flex space-x-2">
              <textarea
                ref={textareaRef}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={currentTeamId ? "Type a message..." : "Join a team to start messaging..."}
                disabled={!currentTeamId}
                className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage(e)
                  }
                }}
              />
              <button
                type="submit"
                disabled={!messageText.trim() || !currentTeamId}
                className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
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

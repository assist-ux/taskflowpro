import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { messagingService } from '../services/messagingService'
import { Message, TeamChat, CreateMessageData } from '../types'
import { playNotificationSound, playMessageSentSound } from '../utils/soundUtils'

interface MessagingContextType {
  currentTeamId: string | null
  setCurrentTeamId: (teamId: string | null) => void
  messages: Message[]
  teamChats: TeamChat[]
  isLoading: boolean
  sendMessage: (content: string, replyTo?: string, mentions?: string[]) => Promise<void>
  editMessage: (messageId: string, newContent: string) => Promise<void>
  deleteMessage: (messageId: string) => Promise<void>
  addReaction: (messageId: string, emoji: string) => Promise<void>
  loadTeamChats: () => Promise<void>
  unreadCounts: Record<string, number> // Track unread messages per team
  markMessagesAsRead: (teamId: string) => void // Mark messages as read for a team
  lastReadTimestamps: Record<string, number> // Track last read timestamp per team
  isMessagingWidgetOpen: boolean // Track if messaging widget is open
  setIsMessagingWidgetOpen: (isOpen: boolean) => void // Set messaging widget open state
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined)

export function useMessaging() {
  const context = useContext(MessagingContext)
  if (context === undefined) {
    throw new Error('useMessaging must be used within a MessagingProvider')
  }
  return context
}

interface MessagingProviderProps {
  children: ReactNode
}

export function MessagingProvider({ children }: MessagingProviderProps) {
  const [currentTeamId, setCurrentTeamId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [teamChats, setTeamChats] = useState<TeamChat[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  const [lastMessageIds, setLastMessageIds] = useState<Record<string, string>>({}) // Track last message ID per team
  const [lastReadTimestamps, setLastReadTimestamps] = useState<Record<string, number>>({}) // Track last read timestamp per team
  const [isMessagingWidgetOpen, setIsMessagingWidgetOpen] = useState(false) // Track if messaging widget is open
  const { currentUser } = useAuth()

  // Load last read timestamps from localStorage on mount
  useEffect(() => {
    if (currentUser) {
      const savedTimestamps = localStorage.getItem(`lastReadTimestamps_${currentUser.uid}`)
      if (savedTimestamps) {
        try {
          setLastReadTimestamps(JSON.parse(savedTimestamps))
        } catch (e) {
          console.error('Error parsing last read timestamps:', e)
        }
      }
    }
  }, [currentUser])

  // Save last read timestamps to localStorage when they change
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`lastReadTimestamps_${currentUser.uid}`, JSON.stringify(lastReadTimestamps))
    }
  }, [lastReadTimestamps, currentUser])

  // Load team chats on mount
  useEffect(() => {
    if (currentUser) {
      loadTeamChats()
    }
  }, [currentUser])

  // Clear messages when user changes
  useEffect(() => {
    if (!currentUser) {
      setMessages([])
      setTeamChats([])
      setCurrentTeamId(null)
    }
  }, [currentUser])

  // Subscribe to messages when team changes
  useEffect(() => {
    if (currentTeamId && currentUser) {
      setIsLoading(true)
      
      // Verify user has access to this team before subscribing
      messagingService.verifyTeamAccess(currentUser.uid, currentTeamId)
        .then(hasAccess => {
          if (hasAccess) {
            const unsubscribe = messagingService.subscribeToTeamMessages(
              currentTeamId,
              (newMessages) => {
                // Check for new messages to play sound notifications
                if (newMessages.length > 0) {
                  // Find truly new messages by comparing with last known message IDs
                  const lastMessageId = lastMessageIds[currentTeamId];
                  const lastMessageIndex = lastMessageId 
                    ? newMessages.findIndex(msg => msg.id === lastMessageId)
                    : -1;
                  
                  // If we found the last message, check messages after it
                  // If we didn't find it, all messages are new (initial load)
                  const newMessageStartIndex = lastMessageIndex >= 0 
                    ? lastMessageIndex + 1 
                    : 0;
                  
                  const trulyNewMessages = newMessages.slice(newMessageStartIndex);
                  
                  // Removed sound notifications for new chat messages
                  // Sounds are only played for mentions and other notifications
                  
                  // Update last message ID for this team
                  if (newMessages.length > 0) {
                    setLastMessageIds(prev => ({
                      ...prev,
                      [currentTeamId]: newMessages[newMessages.length - 1].id
                    }));
                  }
                }
                
                setMessages(newMessages)
                setIsLoading(false)
              }
            )

            return () => {
              unsubscribe()
              setMessages([])
            }
          } else {
            console.warn('User does not have access to team:', currentTeamId)
            // Force clear the current team ID if user doesn't have access
            setCurrentTeamId(null)
            setMessages([])
            setIsLoading(false)
            // Reload team chats to ensure we have the current membership
            loadTeamChats()
          }
        })
        .catch(error => {
          console.error('Error verifying team access:', error)
          setCurrentTeamId(null)
          setMessages([])
          setIsLoading(false)
        })
    } else {
      setMessages([])
    }
  }, [currentTeamId, currentUser, lastMessageIds])

  // Update unread counts when messages or lastReadTimestamps change
  useEffect(() => {
    if (currentTeamId && currentUser) {
      // Get the last read timestamp for this team
      const lastReadTimestamp = lastReadTimestamps[currentTeamId] || 0;
      
      // Count unread messages (messages sent after the last read timestamp and not sent by current user)
      const unreadCount = messages.filter(
        message => message.senderId !== currentUser.uid && message.timestamp.getTime() > lastReadTimestamp
      ).length
      
      // Only update state if the count has changed to prevent unnecessary re-renders
      setUnreadCounts(prev => {
        const currentCount = prev[currentTeamId] || 0;
        if (currentCount !== unreadCount) {
          return {
            ...prev,
            [currentTeamId]: unreadCount
          }
        }
        return prev
      })
    }
  }, [messages.length, lastReadTimestamps, currentTeamId, currentUser]) // Use messages.length instead of messages array

  // Update unread counts for all teams
  const updateUnreadCount = (teamId: string, teamMessages: Message[]) => {
    if (!currentUser) return
    
    // Get the last read timestamp for this team
    const lastReadTimestamp = lastReadTimestamps[teamId] || 0;
    
    // Count unread messages (messages sent after the last read timestamp and not sent by current user)
    const unreadCount = teamMessages.filter(
      message => message.senderId !== currentUser.uid && message.timestamp.getTime() > lastReadTimestamp
    ).length
    
    // Only update state if the count has changed to prevent unnecessary re-renders
    setUnreadCounts(prev => {
      if (prev[teamId] !== unreadCount) {
        return {
          ...prev,
          [teamId]: unreadCount
        }
      }
      return prev
    })
  }

  // Mark messages as read for a specific team
  const markMessagesAsRead = useCallback((teamId: string) => {
    // Update the last read timestamp for this team
    const now = Date.now();
    setLastReadTimestamps(prev => ({
      ...prev,
      [teamId]: now
    }))
    
    // Update unread count
    setUnreadCounts(prev => ({
      ...prev,
      [teamId]: 0
    }))
  }, [])

  const loadTeamChats = async () => {
    if (!currentUser) return
    
    try {
      setIsLoading(true)
      const chats = await messagingService.getUserTeamChats(currentUser.uid)
      setTeamChats(chats)
      
      // If currently selected team is not in the new list, clear it
      if (currentTeamId && !chats.some(chat => chat.teamId === currentTeamId)) {
        console.warn('Current team is no longer accessible, clearing selection')
        setCurrentTeamId(null)
        setMessages([])
      }
      
      // Automatically select the first team if no team is currently selected
      if (chats.length > 0 && !currentTeamId) {
        setCurrentTeamId(chats[0].teamId)
      }
    } catch (error) {
      console.error('Error loading team chats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async (content: string, replyTo?: string, mentions?: string[]) => {
    if (!currentTeamId || !currentUser || !content.trim()) return

    try {
      // Verify user still has access to this team before sending
      const hasAccess = await messagingService.verifyTeamAccess(currentUser.uid, currentTeamId)
      if (!hasAccess) {
        console.error('Access denied: User is not a member of this team')
        // Force refresh team chats and clear current team
        setCurrentTeamId(null)
        loadTeamChats()
        throw new Error('You are not a member of this team')
      }

      const messageData: any = {
        teamId: currentTeamId,
        content: content.trim()
      }
      
      if (replyTo) {
        messageData.replyTo = replyTo
      }

      await messagingService.sendMessage(
        messageData,
        currentUser.uid,
        currentUser.name,
        currentUser.email,
        mentions // Pass mentions to the messaging service
      )
      
      // Removed sound notification when user sends a message
      // Sound notifications are only played for mentions and other notifications
    } catch (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }

  const editMessage = async (messageId: string, newContent: string) => {
    if (!newContent.trim()) return

    try {
      await messagingService.editMessage(messageId, newContent.trim())
    } catch (error) {
      console.error('Error editing message:', error)
      throw error
    }
  }

  const deleteMessage = async (messageId: string) => {
    try {
      await messagingService.deleteMessage(messageId)
    } catch (error) {
      console.error('Error deleting message:', error)
      throw error
    }
  }

  const addReaction = async (messageId: string, emoji: string) => {
    if (!currentUser) return

    try {
      await messagingService.addReaction(messageId, emoji, currentUser.uid, currentUser.name)
    } catch (error) {
      console.error('Error adding reaction:', error)
      throw error
    }
  }

  const value = {
    currentTeamId,
    setCurrentTeamId,
    messages,
    teamChats,
    isLoading,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    loadTeamChats,
    unreadCounts,
    markMessagesAsRead,
    lastReadTimestamps,
    isMessagingWidgetOpen,
    setIsMessagingWidgetOpen
  }

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  )
}
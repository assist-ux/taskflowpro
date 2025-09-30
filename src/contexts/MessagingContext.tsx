import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { messagingService } from '../services/messagingService'
import { Message, TeamChat, CreateMessageData } from '../types'

interface MessagingContextType {
  currentTeamId: string | null
  setCurrentTeamId: (teamId: string | null) => void
  messages: Message[]
  teamChats: TeamChat[]
  isLoading: boolean
  sendMessage: (content: string, replyTo?: string) => Promise<void>
  editMessage: (messageId: string, newContent: string) => Promise<void>
  deleteMessage: (messageId: string) => Promise<void>
  addReaction: (messageId: string, emoji: string) => Promise<void>
  loadTeamChats: () => Promise<void>
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
  const { currentUser } = useAuth()

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
  }, [currentTeamId, currentUser])

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

  const sendMessage = async (content: string, replyTo?: string) => {
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
        currentUser.email
      )
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
    loadTeamChats
  }

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  )
}

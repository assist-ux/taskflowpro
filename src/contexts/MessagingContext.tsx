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

  // Subscribe to messages when team changes
  useEffect(() => {
    if (currentTeamId && currentUser) {
      setIsLoading(true)
      
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
      setMessages([])
    }
  }, [currentTeamId, currentUser])

  const loadTeamChats = async () => {
    if (!currentUser) return
    
    try {
      setIsLoading(true)
      const chats = await messagingService.getUserTeamChats(currentUser.uid)
      setTeamChats(chats)
      
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

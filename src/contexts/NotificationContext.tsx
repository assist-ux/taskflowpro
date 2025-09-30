import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { MentionNotification } from '../types'
import { mentionNotificationService } from '../services/mentionNotificationService'

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error' | 'mention'
  timestamp: Date
  isRead: boolean
  actionUrl?: string
  mentionedBy?: string
  mentionedByName?: string
  contextType?: 'comment' | 'note' | 'task'
  contextTitle?: string
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  clearAllNotifications: () => void
  loadMentionNotifications: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const { currentUser } = useAuth()

  // Load notifications from localStorage on mount
  useEffect(() => {
    if (currentUser) {
      const savedNotifications = localStorage.getItem(`notifications_${currentUser.uid}`)
      if (savedNotifications) {
        try {
          const parsed = JSON.parse(savedNotifications)
          setNotifications(parsed.map((n: any) => ({
            ...n,
            timestamp: new Date(n.timestamp)
          })))
        } catch (error) {
          console.error('Error loading notifications:', error)
        }
      }
    }
  }, [currentUser])

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (currentUser && notifications.length > 0) {
      localStorage.setItem(`notifications_${currentUser.uid}`, JSON.stringify(notifications))
    }
  }, [notifications, currentUser])

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      isRead: false
    }

    setNotifications(prev => [newNotification, ...prev])

    // Auto-remove after 5 seconds for info notifications
    if (notification.type === 'info') {
      setTimeout(() => {
        removeNotification(newNotification.id)
      }, 5000)
    }
  }

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, isRead: true }))
    )
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }

  const clearAllNotifications = () => {
    setNotifications([])
    if (currentUser) {
      localStorage.removeItem(`notifications_${currentUser.uid}`)
    }
  }

  const loadMentionNotifications = async () => {
    if (!currentUser) return

    try {
      const mentionNotifications = await mentionNotificationService.getMentionNotifications(currentUser.uid)
      
      // Convert mention notifications to regular notifications
      const convertedNotifications: Notification[] = mentionNotifications.map(mentionNotif => ({
        id: mentionNotif.id,
        title: mentionNotif.title,
        message: mentionNotif.message,
        type: 'mention' as const,
        timestamp: mentionNotif.createdAt,
        isRead: mentionNotif.isRead,
        actionUrl: mentionNotif.actionUrl,
        mentionedBy: mentionNotif.mentionedBy,
        mentionedByName: mentionNotif.mentionedByName,
        contextType: mentionNotif.contextType,
        contextTitle: mentionNotif.contextTitle
      }))

      // Merge with existing notifications, avoiding duplicates
      setNotifications(prev => {
        const existingIds = new Set(prev.map(n => n.id))
        const newNotifications = convertedNotifications.filter(n => !existingIds.has(n.id))
        return [...newNotifications, ...prev].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      })
    } catch (error) {
      console.error('Error loading mention notifications:', error)
    }
  }

  // Load mention notifications when user changes
  useEffect(() => {
    if (currentUser) {
      loadMentionNotifications()
      // Add welcome notifications for new features
      addWelcomeNotifications()
    }
  }, [currentUser])

  // Add welcome notifications for major features
  const addWelcomeNotifications = () => {
    if (!currentUser) return

    // Check if user has already seen these notifications
    const hasSeenWelcome = localStorage.getItem(`welcome_notifications_${currentUser.uid}`)
    if (hasSeenWelcome) return

    // Add major feature announcements
    const welcomeNotifications = [
      {
        title: '🎉 Welcome to Clockistry!',
        message: 'Discover our new calendar system, API integration, and comprehensive user documentation. Click to explore!',
        type: 'success' as const,
        actionUrl: '/about'
      },
      {
        title: '📅 New Calendar Feature',
        message: 'Track your time entries visually with our new calendar system. Switch between month, week, and day views!',
        type: 'info' as const,
        actionUrl: '/calendar'
      },
      {
        title: '🔧 API Now Available',
        message: 'Full REST API is now live with Express.js and Firebase Functions. Perfect for integrations!',
        type: 'info' as const,
        actionUrl: '/about'
      }
    ]

    // Add notifications with a delay to avoid overwhelming the user
    welcomeNotifications.forEach((notification, index) => {
      setTimeout(() => {
        addNotification(notification)
      }, index * 2000) // 2 second delay between each notification
    })

    // Mark that user has seen welcome notifications
    localStorage.setItem(`welcome_notifications_${currentUser.uid}`, 'true')
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    loadMentionNotifications
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

import { MentionNotification } from '../types'
import { database } from '../config/firebase'
import { ref, push, get, query, orderByChild, equalTo, update } from 'firebase/database'

class MentionNotificationService {
  // Create a mention notification
  async createMentionNotification(
    mentionedUserId: string,
    mentionedBy: string,
    mentionedByName: string,
    contextType: 'comment' | 'note' | 'task',
    contextId: string,
    contextTitle: string,
    taskId?: string,
    projectId?: string
  ): Promise<void> {
    try {
      const actionUrl = this.generateActionUrl(contextType, contextId, taskId, projectId)
      
      const notification: Omit<MentionNotification, 'id'> = {
        type: 'mention',
        title: `${mentionedByName} mentioned you`,
        message: `You were mentioned in ${contextType === 'comment' ? 'a comment' : contextType === 'note' ? 'notes' : 'a task'}`,
        mentionedBy,
        mentionedByName,
        contextType,
        contextId,
        contextTitle,
        taskId,
        projectId,
        isRead: false,
        createdAt: new Date(),
        actionUrl
      }

      const notificationsRef = ref(database, 'mentionNotifications')
      const newNotificationRef = push(notificationsRef)
      
      await update(newNotificationRef, {
        ...notification,
        id: newNotificationRef.key,
        mentionedUserId, // Store the user ID for querying
        createdAt: notification.createdAt.toISOString()
      })
    } catch (error) {
      console.error('Error creating mention notification:', error)
      throw error
    }
  }

  // Get mention notifications for a user
  async getMentionNotifications(userId: string): Promise<MentionNotification[]> {
    try {
      const notificationsRef = ref(database, 'mentionNotifications')
      const q = query(notificationsRef, orderByChild('mentionedUserId'), equalTo(userId))
      
      const snapshot = await get(q)
      const notifications: MentionNotification[] = []
      
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          const data = childSnapshot.val()
          notifications.push({
            id: childSnapshot.key!,
            ...data,
            createdAt: new Date(data.createdAt)
          } as MentionNotification)
        })
      }
      
      // Sort by createdAt descending
      return notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    } catch (error) {
      console.error('Error fetching mention notifications:', error)
      return []
    }
  }

  // Mark mention notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      const notificationRef = ref(database, `mentionNotifications/${notificationId}`)
      await update(notificationRef, {
        isRead: true
      })
    } catch (error) {
      console.error('Error marking mention notification as read:', error)
      throw error
    }
  }

  // Mark all mention notifications as read for a user
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const notifications = await this.getMentionNotifications(userId)
      const unreadNotifications = notifications.filter(n => !n.isRead)
      
      const updatePromises = unreadNotifications.map(notification =>
        this.markAsRead(notification.id)
      )
      
      await Promise.all(updatePromises)
    } catch (error) {
      console.error('Error marking all mention notifications as read:', error)
      throw error
    }
  }

  // Get unread mention notification count
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const notifications = await this.getMentionNotifications(userId)
      return notifications.filter(n => !n.isRead).length
    } catch (error) {
      console.error('Error getting unread mention notification count:', error)
      return 0
    }
  }

  // Generate action URL based on context
  private generateActionUrl(
    contextType: 'comment' | 'note' | 'task',
    contextId: string,
    taskId?: string,
    projectId?: string
  ): string {
    switch (contextType) {
      case 'comment':
      case 'note':
        return taskId ? `/management?task=${taskId}` : '/management'
      case 'task':
        return `/management?task=${contextId}`
      default:
        return '/management'
    }
  }

  // Process mentions in text and create notifications
  async processMentions(
    text: string,
    mentionedBy: string,
    mentionedByName: string,
    contextType: 'comment' | 'note' | 'task',
    contextId: string,
    contextTitle: string,
    taskId?: string,
    projectId?: string
  ): Promise<void> {
    try {
      // Extract mentioned usernames from text (including multi-word usernames)
      const mentionRegex = /@([^\s\n\r@]+(?:\s+[^\s\n\r@]+)*)/g
      const mentions: string[] = []
      let match

      while ((match = mentionRegex.exec(text)) !== null) {
        mentions.push(match[1])
      }

      if (mentions.length === 0) return

      let usersToNotify = [];
      
      // Get all users to find mentioned user IDs
      const { userService } = await import('./userService')
      const users = await userService.getAllUsers()
      
      // If we have a projectId, filter users based on team membership
      if (projectId) {
        const { teamService } = await import('./teamService')
        const mentionableUsers = await teamService.getMentionableUsers(projectId, mentionedBy)
        usersToNotify = mentionableUsers
      } else {
        // Fallback to all users if no projectId
        usersToNotify = users.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }))
      }
      
      // Create notifications for each mentioned user
      const notificationPromises = mentions.map(async (username) => {
        const user = usersToNotify.find(u => u.name === username)
        if (user && user.id !== mentionedBy) { // Don't notify the person who mentioned
          await this.createMentionNotification(
            user.id,
            mentionedBy,
            mentionedByName,
            contextType,
            contextId,
            contextTitle,
            taskId,
            projectId
          )
        } else if (!user && users.some(u => u.name === username)) {
          // User exists but is not mentionable (not in the same team)
          console.log(`User ${username} cannot be mentioned as they are not in the same team`)
        }
      })

      await Promise.all(notificationPromises)
    } catch (error) {
      console.error('Error processing mentions:', error)
      throw error
    }
  }
}

export const mentionNotificationService = new MentionNotificationService()

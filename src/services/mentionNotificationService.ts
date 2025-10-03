import { MentionNotification } from '../types'
import { database } from '../config/firebase'
import { ref, push, get, query, orderByChild, equalTo, update } from 'firebase/database'

class MentionNotificationService {
  // Create a mention notification
  async createMentionNotification(
    mentionedUserId: string,
    mentionedBy: string,
    mentionedByName: string,
    contextType: 'comment' | 'note' | 'task' | 'message',
    contextId: string,
    contextTitle: string,
    taskId?: string,
    projectId?: string
  ): Promise<void> {
    try {
      const actionUrl = this.generateActionUrl(contextType, contextId, taskId, projectId)
      
      // Create more specific messages based on context
      let message = '';
      switch (contextType) {
        case 'comment':
          message = `${mentionedByName} mentioned you in a comment`;
          break;
        case 'note':
          message = `${mentionedByName} mentioned you in notes`;
          break;
        case 'task':
          message = `${mentionedByName} mentioned you in a task`;
          break;
        case 'message':
          message = `${mentionedByName} mentioned you in a message`;
          break;
        default:
          message = `${mentionedByName} mentioned you`;
      }
      
      const notification: Omit<MentionNotification, 'id'> = {
        type: 'mention',
        title: `${mentionedByName} mentioned you`,
        message,
        mentionedBy,
        mentionedByName,
        contextType,
        contextId,
        contextTitle,
        isRead: false,
        createdAt: new Date(),
        actionUrl
      }

      // Only add optional fields if they have values
      if (taskId) {
        (notification as any).taskId = taskId
      }
      if (projectId) {
        (notification as any).projectId = projectId
      }

      const notificationsRef = ref(database, 'mentionNotifications')
      const newNotificationRef = push(notificationsRef)
      
      // Create a clean object for Firebase update without undefined values
      const notificationToSave: any = {
        ...notification,
        id: newNotificationRef.key,
        mentionedUserId, // Store the user ID for querying
        createdAt: notification.createdAt.toISOString()
      }
      
      await update(newNotificationRef, notificationToSave)
      
      console.log('Mention notification created:', {
        mentionedUserId,
        mentionedBy,
        mentionedByName,
        contextType,
        contextId,
        contextTitle,
        message
      });
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

  // Get unread mention notifications
  async getUnreadMentionNotifications(userId: string): Promise<MentionNotification[]> {
    try {
      const notifications = await this.getMentionNotifications(userId)
      return notifications.filter(n => !n.isRead)
    } catch (error) {
      console.error('Error getting unread mention notifications:', error)
      return []
    }
  }

  // Generate action URL based on context
  private generateActionUrl(
    contextType: 'comment' | 'note' | 'task' | 'message',
    contextId: string,
    taskId?: string,
    projectId?: string
  ): string {
    switch (contextType) {
      case 'comment':
      case 'note':
        return taskId ? `/management?task=${taskId}` : '/management'
      case 'message':
        // For messages, we want to open the chat widget
        // We'll pass the projectId (teamId) as a parameter
        return projectId ? `/chat?team=${projectId}` : '/chat'
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
    contextType: 'comment' | 'note' | 'task' | 'message',
    contextId: string,
    contextTitle: string,
    taskId?: string,
    projectId?: string,
    // Optional explicit mentions parameter
    explicitMentions?: string[]
  ): Promise<void> {
    try {
      console.log('=== processMentions called ===');
      console.log('Text:', text);
      console.log('MentionedBy:', mentionedBy);
      console.log('MentionedByName:', mentionedByName);
      console.log('ContextType:', contextType);
      console.log('ContextId:', contextId);
      console.log('ContextTitle:', contextTitle);
      console.log('TaskId:', taskId);
      console.log('ProjectId:', projectId);
      console.log('Explicit mentions:', explicitMentions);
      
      // Use explicit mentions if provided, otherwise extract from text
      let mentions: string[] = [];
      if (explicitMentions && explicitMentions.length > 0) {
        mentions = explicitMentions;
        console.log('Using explicit mentions:', mentions);
      } else {
        console.log('Extracting mentions from text');
        // Improved regex to match @username with better handling of edge cases
        // Matches @ followed by alphanumeric characters, underscores, hyphens, and spaces
        // Stops at word boundary or specific punctuation
        const mentionRegex = /@([\w\-]+(?:\s+[\w\-]+)*)(?=\s|[.,;:!?()\\[\\]{}<>\"']|$)/g;
        let match;

        while ((match = mentionRegex.exec(text)) !== null) {
          // The captured group is the mention without the @
          const mention = match[1].trim();
          if (mention) {
            mentions.push(mention);
          }
        }
      }
      
      console.log('Final mentions to process:', mentions);

      if (mentions.length === 0) {
        console.log('No mentions found in text');
        return;
      }

      let usersToNotify = [];
      
      // Always use team-based filtering to respect permissions
      if (projectId) {
        console.log('Filtering users based on team membership for projectId:', projectId);
        const { teamService } = await import('./teamService');
        try {
          const mentionableUsers = await teamService.getMentionableUsers(projectId, mentionedBy);
          usersToNotify = mentionableUsers;
          console.log('Mentionable users for notification:', mentionableUsers);
        } catch (teamError) {
          console.error('Error getting mentionable users from team service:', teamError);
          usersToNotify = [];
        }
      } else {
        // If no projectId, try to get team members using teamService
        // This is for cases like chat messages where we might not have a projectId
        console.log('No projectId provided, attempting to get team members');
        try {
          const { teamService } = await import('./teamService');
          // We'll need to get the user's team context differently
          // For now, we'll skip processing if we don't have proper context
          console.log('Skipping mention processing due to missing team context');
          usersToNotify = [];
        } catch (teamError) {
          console.error('Error accessing team service:', teamError);
          usersToNotify = [];
        }
      }
      
      console.log('Users to notify:', usersToNotify);
      
      // Create notifications for each mentioned user
      const notificationPromises = mentions.map(async (username) => {
        console.log(`Processing mention for username: ${username}`);
        const user = usersToNotify.find(u => u.name === username);
        if (user && user.id !== mentionedBy) { // Don't notify the person who mentioned
          console.log(`Creating notification for user: ${user.name} (${user.id})`);
          console.log(`User ${user.name} (${user.id}) was mentioned by ${mentionedByName} (${mentionedBy}) in ${contextType}: ${contextTitle}`);
          await this.createMentionNotification(
            user.id,
            mentionedBy,
            mentionedByName,
            contextType,
            contextId,
            contextTitle,
            taskId,
            projectId
          );
        } else if (!user && usersToNotify.some(u => u.name === username)) {
          // User exists but is not mentionable (not in the same team)
          console.log(`User ${username} cannot be mentioned as they are not in the same team`);
        } else {
          console.log(`User ${username} not found or not mentionable`);
        }
      });

      await Promise.all(notificationPromises);
    } catch (error) {
      console.error('Error processing mentions:', error);
      throw error;
    }
  }
}

export const mentionNotificationService = new MentionNotificationService()

import { ref, set, get, push, query, orderByChild, equalTo, limitToLast, onValue, off, remove, update, DatabaseReference } from 'firebase/database'
import { database } from '../config/firebase'
import { TeamMessage, CreateMessageData, LastReadTimestamp } from '../types'
import { teamService } from './teamService'
import { playMessageReceivedSound } from '../utils/soundUtils'

export const messagingService = {
  // Create a new message
  async createMessage(messageData: CreateMessageData, senderId: string, senderName: string, senderEmail: string): Promise<string> {
    try {
      // Verify that the user is a member of the team before creating a message
      const teamMembers = await teamService.getTeamMembers(messageData.teamId)
      const isMember = teamMembers.some(member => member.userId === senderId && member.isActive)
      
      if (!isMember) {
        throw new Error('User is not a member of this team')
      }
      
      const messageRef = push(ref(database, 'messages'))
      const newMessage: TeamMessage = {
        id: messageRef.key!,
        teamId: messageData.teamId,
        senderId,
        senderName,
        senderEmail,
        content: messageData.content,
        timestamp: new Date(),
        isEdited: false
      }
      
      await set(messageRef, {
        ...newMessage,
        timestamp: newMessage.timestamp.toISOString()
      })
      
      return messageRef.key!
    } catch (error) {
      console.error('Error creating message:', error)
      // Return a more user-friendly error message
      if (error instanceof Error && error.message.includes('User is not a member')) {
        throw new Error('You are not authorized to send messages to this team')
      }
      throw new Error('Failed to send message. Please try again.')
    }
  },

  // Get messages for a specific team
  async getTeamMessages(teamId: string, limit: number = 50): Promise<TeamMessage[]> {
    try {
      // Note: In a production environment, you would also verify the user's team membership here
      // For now, we're relying on the UI to only show teams the user belongs to
      
      const messagesRef = ref(database, 'messages')
      const q = query(
        messagesRef, 
        orderByChild('teamId'), 
        equalTo(teamId),
        limitToLast(limit)
      )
      const snapshot = await get(q)
      
      if (snapshot.exists()) {
        const messages = snapshot.val()
        return Object.values(messages)
          .map((message: any) => ({
            ...message,
            timestamp: new Date(message.timestamp)
          }))
          .sort((a: TeamMessage, b: TeamMessage) => a.timestamp.getTime() - b.timestamp.getTime())
      }
      
      return []
    } catch (error) {
      console.error('Error getting team messages:', error)
      throw error
    }
  },

  // Get the latest message for each team
  async getLatestMessagesForUserTeams(teamIds: string[]): Promise<{[teamId: string]: TeamMessage | null}> {
    try {
      const latestMessages: {[teamId: string]: TeamMessage | null} = {}
      
      // For each team, get the latest message
      for (const teamId of teamIds) {
        const messagesRef = ref(database, 'messages')
        const q = query(
          messagesRef,
          orderByChild('teamId'),
          equalTo(teamId),
          limitToLast(1)
        )
        const snapshot = await get(q)
        
        if (snapshot.exists()) {
          const messages = snapshot.val()
          const message = Object.values(messages)[0] as any
          latestMessages[teamId] = {
            ...message,
            timestamp: new Date(message.timestamp)
          }
        } else {
          latestMessages[teamId] = null
        }
      }
      
      return latestMessages
    } catch (error) {
      console.error('Error getting latest messages for user teams:', error)
      throw error
    }
  },

  // Subscribe to real-time messages
  subscribeToTeamMessages(teamId: string, callback: (messages: TeamMessage[]) => void): () => void {
    const messagesRef = ref(database, 'messages')
    const q = query(
      messagesRef,
      orderByChild('teamId'),
      equalTo(teamId)
    )
    
    const listener = onValue(q, (snapshot) => {
      if (snapshot.exists()) {
        try {
          const messages = snapshot.val()
          const formattedMessages = Object.values(messages)
            .map((message: any) => ({
              ...message,
              timestamp: new Date(message.timestamp)
            }))
            .sort((a: TeamMessage, b: TeamMessage) => a.timestamp.getTime() - b.timestamp.getTime())
          callback(formattedMessages)
        } catch (error) {
          console.error('Error formatting messages:', error)
          callback([])
        }
      } else {
        callback([])
      }
    }, (error) => {
      console.error('Error subscribing to team messages:', error)
      callback([])
    })
    
    // Return unsubscribe function
    return () => off(messagesRef, 'value', listener)
  },

  // Subscribe to real-time messages with sound notifications
  subscribeToTeamMessagesWithSound(teamId: string, currentUserId: string, callback: (messages: TeamMessage[]) => void): () => void {
    const messagesRef = ref(database, 'messages')
    const q = query(
      messagesRef,
      orderByChild('teamId'),
      equalTo(teamId)
    )
    
    // Track the previous messages to detect new ones
    let previousMessages: TeamMessage[] = []
    let isFirstLoad = true
    
    const listener = onValue(q, (snapshot) => {
      if (snapshot.exists()) {
        try {
          const messages = snapshot.val()
          const formattedMessages = Object.values(messages)
            .map((message: any) => ({
              ...message,
              timestamp: new Date(message.timestamp)
            }))
            .sort((a: TeamMessage, b: TeamMessage) => a.timestamp.getTime() - b.timestamp.getTime())
          
          // Check for new messages from other users (but not on first load)
          if (!isFirstLoad && previousMessages.length > 0) {
            const previousMessageIds = new Set(previousMessages.map(msg => msg.id))
            const newMessages = formattedMessages.filter(
              msg => !previousMessageIds.has(msg.id) && msg.senderId !== currentUserId
            )
            
            // Play sound for each new message from other users
            newMessages.forEach(() => {
              playMessageReceivedSound()
            })
          }
          
          // Update previous messages
          previousMessages = formattedMessages
          isFirstLoad = false
          
          callback(formattedMessages)
        } catch (error) {
          console.error('Error formatting messages:', error)
          callback([])
        }
      } else {
        previousMessages = []
        isFirstLoad = false
        callback([])
      }
    }, (error) => {
      console.error('Error subscribing to team messages:', error)
      callback([])
    })
    
    // Return unsubscribe function
    return () => off(messagesRef, 'value', listener)
  },

  // Get unread message count for a specific team
  async getUnreadMessageCount(teamId: string, userId: string): Promise<number> {
    try {
      // Get the last read timestamp for this user and team
      const lastReadRef = ref(database, `userReadTimestamps/${userId}/${teamId}`)
      const lastReadSnapshot = await get(lastReadRef)
      
      let lastReadTimestamp: Date | null = null
      if (lastReadSnapshot.exists()) {
        const lastReadData = lastReadSnapshot.val()
        lastReadTimestamp = new Date(lastReadData.timestamp)
      }
      
      // Get messages for the team
      const messagesRef = ref(database, 'messages')
      const q = query(
        messagesRef,
        orderByChild('teamId'),
        equalTo(teamId)
      )
      const snapshot = await get(q)
      
      if (!snapshot.exists()) {
        return 0
      }
      
      const messages = snapshot.val()
      let unreadCount = 0
      
      // Count messages that are newer than the last read timestamp
      Object.values(messages).forEach((message: any) => {
        const messageTimestamp = new Date(message.timestamp)
        // If there's no last read timestamp, all messages are unread
        // Otherwise, count messages newer than the last read timestamp
        if (!lastReadTimestamp || messageTimestamp > lastReadTimestamp) {
          // Don't count messages sent by the current user
          if (message.senderId !== userId) {
            unreadCount++
          }
        }
      })
      
      return unreadCount
    } catch (error) {
      console.error('Error getting unread message count:', error)
      return 0
    }
  },

  // Mark messages as read for a specific team
  async markMessagesAsRead(teamId: string, userId: string): Promise<void> {
    try {
      const lastReadRef = ref(database, `userReadTimestamps/${userId}/${teamId}`)
      const timestamp = new Date()
      
      await set(lastReadRef, {
        userId,
        teamId,
        timestamp: timestamp.toISOString()
      })
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  },

  // Subscribe to unread message counts for all teams
  subscribeToUnreadCounts(teamIds: string[], userId: string, callback: (unreadCounts: {[teamId: string]: number}) => void): () => void {
    const unsubscribes: (() => void)[] = []
    const unreadCounts: {[teamId: string]: number} = {}
    
    // Initialize counts to 0
    teamIds.forEach(teamId => {
      unreadCounts[teamId] = 0
    })
    
    // Subscribe to each team's messages
    teamIds.forEach(teamId => {
      const messagesRef = ref(database, 'messages')
      const q = query(
        messagesRef,
        orderByChild('teamId'),
        equalTo(teamId)
      )
      
      const unsubscribe = onValue(q, async (snapshot) => {
        if (snapshot.exists()) {
          try {
            // Get the last read timestamp for this user and team
            const lastReadRef = ref(database, `userReadTimestamps/${userId}/${teamId}`)
            const lastReadSnapshot = await get(lastReadRef)
            
            let lastReadTimestamp: Date | null = null
            if (lastReadSnapshot.exists()) {
              const lastReadData = lastReadSnapshot.val()
              lastReadTimestamp = new Date(lastReadData.timestamp)
            }
            
            const messages = snapshot.val()
            let unreadCount = 0
            
            // Count messages that are newer than the last read timestamp
            Object.values(messages).forEach((message: any) => {
              const messageTimestamp = new Date(message.timestamp)
              // If there's no last read timestamp, all messages are unread
              // Otherwise, count messages newer than the last read timestamp
              if (!lastReadTimestamp || messageTimestamp > lastReadTimestamp) {
                // Don't count messages sent by the current user
                if (message.senderId !== userId) {
                  unreadCount++
                }
              }
            })
            
            unreadCounts[teamId] = unreadCount
            callback({...unreadCounts})
          } catch (error) {
            console.error('Error calculating unread count:', error)
            callback({...unreadCounts})
          }
        } else {
          unreadCounts[teamId] = 0
          callback({...unreadCounts})
        }
      }, (error) => {
        console.error('Error subscribing to team messages for unread count:', error)
        callback({...unreadCounts})
      })
      
      unsubscribes.push(unsubscribe)
    })
    
    // Return unsubscribe function that unsubscribes from all listeners
    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe())
    }
  },
  
  // Get all messages for debugging
  async getAllMessages(): Promise<any> {
    try {
      const messagesRef = ref(database, 'messages')
      const snapshot = await get(messagesRef)
      return snapshot.val() || {}
    } catch (error) {
      console.error('Error getting all messages:', error)
      throw error
    }
  },
  
  // Test team query
  async testTeamQuery(teamId: string): Promise<any> {
    try {
      const messagesRef = ref(database, 'messages')
      const q = query(messagesRef, orderByChild('teamId'), equalTo(teamId))
      const snapshot = await get(q)
      return snapshot.val() || {}
    } catch (error) {
      console.error('Error testing team query:', error)
      throw error
    }
  }
}
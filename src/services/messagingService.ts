import { ref, push, get, query, orderByChild, equalTo, limitToLast, onValue, off, update, remove, set } from 'firebase/database'
import { database } from '../config/firebase'
import { Message, CreateMessageData, TeamChat } from '../types'

export const messagingService = {
  // Send a message to a team
  async sendMessage(messageData: CreateMessageData, senderId: string, senderName: string, senderEmail: string): Promise<string> {
    const messageRef = push(ref(database, 'messages'))
    const now = new Date()
    
    const message: Message = {
      id: messageRef.key!,
      teamId: messageData.teamId,
      senderId,
      senderName,
      senderEmail,
      content: messageData.content,
      timestamp: now,
      type: messageData.type || 'text',
      isEdited: false,
      replyTo: messageData.replyTo || undefined,
      attachments: messageData.attachments?.map(att => ({
        ...att,
        id: Date.now().toString(),
        uploadedAt: now
      })),
      reactions: []
    }

    // Create a clean object without undefined values
    const messageToSave: any = {
      id: message.id,
      teamId: message.teamId,
      senderId: message.senderId,
      senderName: message.senderName,
      senderEmail: message.senderEmail,
      content: message.content,
      timestamp: now.toISOString(),
      type: message.type,
      isEdited: message.isEdited,
      reactions: []
    }

    // Only add optional fields if they have values
    if (message.replyTo) {
      messageToSave.replyTo = message.replyTo
    }
    if (message.attachments && message.attachments.length > 0) {
      messageToSave.attachments = message.attachments
    }

    await set(messageRef, messageToSave)

    return messageRef.key!
  },

  // Get messages for a team
  async getTeamMessages(teamId: string, limit: number = 50): Promise<Message[]> {
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
          timestamp: new Date(message.timestamp),
          editedAt: message.editedAt ? new Date(message.editedAt) : undefined,
          attachments: message.attachments?.map((att: any) => ({
            ...att,
            uploadedAt: new Date(att.uploadedAt)
          })) || [],
          reactions: message.reactions?.map((reaction: any) => ({
            ...reaction,
            timestamp: new Date(reaction.timestamp)
          })) || []
        }))
        .sort((a: Message, b: Message) => a.timestamp.getTime() - b.timestamp.getTime())
    }
    
    return []
  },

  // Listen to real-time messages for a team
  subscribeToTeamMessages(teamId: string, callback: (messages: Message[]) => void): () => void {
    const messagesRef = ref(database, 'messages')
    const q = query(
      messagesRef,
      orderByChild('teamId'),
      equalTo(teamId),
      limitToLast(100)
    )

    const unsubscribe = onValue(q, (snapshot) => {
      if (snapshot.exists()) {
        const messages = snapshot.val()
        const formattedMessages = Object.values(messages)
          .map((message: any) => ({
            ...message,
            timestamp: new Date(message.timestamp),
            editedAt: message.editedAt ? new Date(message.editedAt) : undefined,
            attachments: message.attachments?.map((att: any) => ({
              ...att,
              uploadedAt: new Date(att.uploadedAt)
            })) || [],
            reactions: message.reactions?.map((reaction: any) => ({
              ...reaction,
              timestamp: new Date(reaction.timestamp)
            })) || []
          }))
          .sort((a: Message, b: Message) => a.timestamp.getTime() - b.timestamp.getTime())
        
        callback(formattedMessages)
      } else {
        callback([])
      }
    })

    return unsubscribe
  },

  // Edit a message
  async editMessage(messageId: string, newContent: string): Promise<void> {
    const messageRef = ref(database, `messages/${messageId}`)
    await update(messageRef, {
      content: newContent,
      isEdited: true,
      editedAt: new Date().toISOString()
    })
  },

  // Delete a message
  async deleteMessage(messageId: string): Promise<void> {
    const messageRef = ref(database, `messages/${messageId}`)
    await remove(messageRef)
  },

  // Add reaction to a message
  async addReaction(messageId: string, emoji: string, userId: string, userName: string): Promise<void> {
    const messageRef = ref(database, `messages/${messageId}`)
    const snapshot = await get(messageRef)
    
    if (snapshot.exists()) {
      const message = snapshot.val()
      const reactions = message.reactions || []
      
      // Remove existing reaction from this user for this emoji
      const filteredReactions = reactions.filter((r: any) => !(r.userId === userId && r.emoji === emoji))
      
      // Add new reaction
      filteredReactions.push({
        emoji,
        userId,
        userName,
        timestamp: new Date().toISOString()
      })
      
      await update(messageRef, { reactions: filteredReactions })
    }
  },

  // Get team chats for a user
  async getUserTeamChats(userId: string): Promise<TeamChat[]> {
    try {
      // Get all team members for this user
      const membersRef = ref(database, 'teamMembers')
      const q = query(membersRef, orderByChild('userId'), equalTo(userId))
      const membersSnapshot = await get(q)
      
      if (!membersSnapshot.exists()) {
        return []
      }
      
      const userMemberships = membersSnapshot.val()
      const teamIds = Object.values(userMemberships).map((member: any) => member.teamId)
      
      // Get team details for each team the user is a member of
      const teamsRef = ref(database, 'teams')
      const teamsSnapshot = await get(teamsRef)
      
      if (!teamsSnapshot.exists()) {
        return []
      }
      
      const allTeams = teamsSnapshot.val()
      const userTeams = Object.values(allTeams).filter((team: any) => 
        teamIds.includes(team.id) && team.isActive
      )
      
      return userTeams.map((team: any) => ({
        teamId: team.id,
        teamName: team.name,
        unreadCount: 0, // This would be calculated based on read receipts
        isActive: team.isActive,
        members: teamIds // All team IDs this user is part of
      }))
    } catch (error) {
      console.error('Error getting user team chats:', error)
      return []
    }
  },

  // Mark messages as read
  async markMessagesAsRead(teamId: string, userId: string): Promise<void> {
    // This would typically update read receipts
    // For now, we'll just log it
    console.log(`Marking messages as read for team ${teamId} by user ${userId}`)
  }
}

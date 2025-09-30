import { 
  Feedback, 
  FeedbackComment, 
  FeedbackVote, 
  CreateFeedbackData, 
  UpdateFeedbackData, 
  CreateFeedbackCommentData, 
  UpdateFeedbackCommentData, 
  FeedbackFilters, 
  FeedbackStats,
  FeedbackCategory,
  FeedbackPriority,
  FeedbackStatus
} from '../types'
import { database } from '../config/firebase'
import { 
  ref, 
  push, 
  set, 
  update, 
  remove, 
  get, 
  query, 
  orderByChild, 
  orderByKey, 
  equalTo, 
  limitToLast, 
  startAfter as startAfterQuery,
  child,
  serverTimestamp
} from 'firebase/database'

const FEEDBACK_COLLECTION = 'feedbacks'
const FEEDBACK_COMMENTS_COLLECTION = 'feedbackComments'
const FEEDBACK_VOTES_COLLECTION = 'feedbackVotes'

export const feedbackService = {
  // Create a new feedback
  async createFeedback(data: CreateFeedbackData, authorId: string, authorName: string, authorEmail: string, authorRole: string): Promise<Feedback> {
    try {
      const feedbackRef = ref(database, FEEDBACK_COLLECTION)
      const newFeedbackRef = push(feedbackRef)
      
      const feedbackData = {
        ...data,
        authorId,
        authorName,
        authorEmail,
        authorRole,
        status: 'open' as FeedbackStatus,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isAnonymous: data.isAnonymous || false,
        tags: data.tags || [],
        votes: [],
        comments: []
      }

      await set(newFeedbackRef, feedbackData)
      
      return {
        id: newFeedbackRef.key!,
        ...data,
        authorId,
        authorName,
        authorEmail,
        authorRole: authorRole as any,
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
        votes: [],
        comments: [],
        isAnonymous: data.isAnonymous || false,
        tags: data.tags || []
      }
    } catch (error) {
      console.error('Error creating feedback:', error)
      throw new Error('Failed to create feedback')
    }
  },

  // Get all feedbacks with optional filtering
  async getFeedbacks(filters: FeedbackFilters = {}): Promise<Feedback[]> {
    try {
      let feedbacksRef = ref(database, FEEDBACK_COLLECTION)
      let q = query(feedbacksRef)

      // Apply sorting
      const sortBy = filters.sortBy || 'newest'
      switch (sortBy) {
        case 'newest':
          q = query(feedbacksRef, orderByChild('createdAt'))
          break
        case 'oldest':
          q = query(feedbacksRef, orderByChild('createdAt'))
          break
        case 'most-voted':
          q = query(feedbacksRef, orderByChild('votes'))
          break
        case 'least-voted':
          q = query(feedbacksRef, orderByChild('votes'))
          break
        case 'most-commented':
          q = query(feedbacksRef, orderByChild('comments'))
          break
        case 'least-commented':
          q = query(feedbacksRef, orderByChild('comments'))
          break
      }

      const snapshot = await get(q)
      if (!snapshot.exists()) {
        return []
      }

      const feedbacks: Feedback[] = []
      const feedbacksData = snapshot.val()

      for (const feedbackId in feedbacksData) {
        const feedbackData = feedbacksData[feedbackId]
        
        // Get votes for this feedback
        const votesRef = ref(database, `${FEEDBACK_VOTES_COLLECTION}`)
        const votesSnapshot = await get(votesRef)
        const votes: FeedbackVote[] = []
        
        if (votesSnapshot.exists()) {
          const votesData = votesSnapshot.val()
          for (const voteId in votesData) {
            const voteData = votesData[voteId]
            if (voteData.feedbackId === feedbackId) {
              votes.push({
                id: voteId,
                ...voteData,
                createdAt: new Date(voteData.createdAt)
              })
            }
          }
        }

        // Get comments for this feedback
        const commentsRef = ref(database, `${FEEDBACK_COMMENTS_COLLECTION}`)
        const commentsSnapshot = await get(commentsRef)
        const comments: FeedbackComment[] = []
        
        if (commentsSnapshot.exists()) {
          const commentsData = commentsSnapshot.val()
          for (const commentId in commentsData) {
            const commentData = commentsData[commentId]
            if (commentData.feedbackId === feedbackId) {
              comments.push({
                id: commentId,
                ...commentData,
                createdAt: new Date(commentData.createdAt),
                updatedAt: new Date(commentData.updatedAt)
              })
            }
          }
        }

        const feedback: Feedback = {
          id: feedbackId,
          ...feedbackData,
          createdAt: new Date(feedbackData.createdAt),
          updatedAt: new Date(feedbackData.updatedAt),
          votes: votes || [],
          comments: comments || [],
          tags: feedbackData.tags || []
        }

        // Apply filters
        let includeFeedback = true

        if (filters.category && filters.category.length > 0) {
          includeFeedback = includeFeedback && filters.category.includes(feedback.category)
        }
        
        if (filters.priority && filters.priority.length > 0) {
          includeFeedback = includeFeedback && filters.priority.includes(feedback.priority)
        }
        
        if (filters.status && filters.status.length > 0) {
          includeFeedback = includeFeedback && filters.status.includes(feedback.status)
        }
        
        if (filters.authorId) {
          includeFeedback = includeFeedback && feedback.authorId === filters.authorId
        }

        // Apply text search filter if provided
        if (filters.search) {
          const searchTerm = filters.search.toLowerCase()
          includeFeedback = includeFeedback && (
            feedback.title.toLowerCase().includes(searchTerm) ||
            feedback.content.toLowerCase().includes(searchTerm) ||
            (feedback.tags && feedback.tags.length > 0 && feedback.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
          )
        }

        if (includeFeedback) {
          feedbacks.push(feedback)
        }
      }

      // Sort the results
      if (sortBy === 'newest') {
        feedbacks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      } else if (sortBy === 'oldest') {
        feedbacks.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      } else if (sortBy === 'most-voted') {
        feedbacks.sort((a, b) => b.votes.length - a.votes.length)
      } else if (sortBy === 'least-voted') {
        feedbacks.sort((a, b) => a.votes.length - b.votes.length)
      } else if (sortBy === 'most-commented') {
        feedbacks.sort((a, b) => b.comments.length - a.comments.length)
      } else if (sortBy === 'least-commented') {
        feedbacks.sort((a, b) => a.comments.length - b.comments.length)
      }

      return feedbacks
    } catch (error) {
      console.error('Error fetching feedbacks:', error)
      throw new Error('Failed to fetch feedbacks')
    }
  },

  // Get a single feedback by ID
  async getFeedbackById(id: string): Promise<Feedback | null> {
    try {
      const feedbackRef = ref(database, `${FEEDBACK_COLLECTION}/${id}`)
      const snapshot = await get(feedbackRef)

      if (!snapshot.exists()) {
        return null
      }

      const feedbackData = snapshot.val()

      // Get votes
      const votesRef = ref(database, `${FEEDBACK_VOTES_COLLECTION}`)
      const votesSnapshot = await get(votesRef)
      const votes: FeedbackVote[] = []
      
      if (votesSnapshot.exists()) {
        const votesData = votesSnapshot.val()
        for (const voteId in votesData) {
          const voteData = votesData[voteId]
          if (voteData.feedbackId === id) {
            votes.push({
              id: voteId,
              ...voteData,
              createdAt: new Date(voteData.createdAt)
            })
          }
        }
      }

      // Get comments
      const commentsRef = ref(database, `${FEEDBACK_COMMENTS_COLLECTION}`)
      const commentsSnapshot = await get(commentsRef)
      const comments: FeedbackComment[] = []
      
      if (commentsSnapshot.exists()) {
        const commentsData = commentsSnapshot.val()
        for (const commentId in commentsData) {
          const commentData = commentsData[commentId]
          if (commentData.feedbackId === id) {
            comments.push({
              id: commentId,
              ...commentData,
              createdAt: new Date(commentData.createdAt),
              updatedAt: new Date(commentData.updatedAt)
            })
          }
        }
      }

      return {
        id,
        ...feedbackData,
        createdAt: new Date(feedbackData.createdAt),
        updatedAt: new Date(feedbackData.updatedAt),
        votes: votes || [],
        comments: comments || [],
        tags: feedbackData.tags || []
      } as Feedback
    } catch (error) {
      console.error('Error fetching feedback:', error)
      throw new Error('Failed to fetch feedback')
    }
  },

  // Update feedback
  async updateFeedback(id: string, data: UpdateFeedbackData): Promise<void> {
    try {
      const feedbackRef = ref(database, `${FEEDBACK_COLLECTION}/${id}`)
      await update(feedbackRef, {
        ...data,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error updating feedback:', error)
      throw new Error('Failed to update feedback')
    }
  },

  // Delete feedback
  async deleteFeedback(id: string): Promise<void> {
    try {
      // Delete feedback
      const feedbackRef = ref(database, `${FEEDBACK_COLLECTION}/${id}`)
      await remove(feedbackRef)

      // Delete all votes for this feedback
      const votesRef = ref(database, `${FEEDBACK_VOTES_COLLECTION}`)
      const votesSnapshot = await get(votesRef)
      
      if (votesSnapshot.exists()) {
        const votesData = votesSnapshot.val()
        for (const voteId in votesData) {
          const voteData = votesData[voteId]
          if (voteData.feedbackId === id) {
            await remove(ref(database, `${FEEDBACK_VOTES_COLLECTION}/${voteId}`))
          }
        }
      }

      // Delete all comments for this feedback
      const commentsRef = ref(database, `${FEEDBACK_COMMENTS_COLLECTION}`)
      const commentsSnapshot = await get(commentsRef)
      
      if (commentsSnapshot.exists()) {
        const commentsData = commentsSnapshot.val()
        for (const commentId in commentsData) {
          const commentData = commentsData[commentId]
          if (commentData.feedbackId === id) {
            await remove(ref(database, `${FEEDBACK_COMMENTS_COLLECTION}/${commentId}`))
          }
        }
      }
    } catch (error) {
      console.error('Error deleting feedback:', error)
      throw new Error('Failed to delete feedback')
    }
  },

  // Add comment to feedback
  async addComment(feedbackId: string, data: CreateFeedbackCommentData, authorId: string, authorName: string, authorEmail: string, authorRole: string): Promise<FeedbackComment> {
    try {
      const commentsRef = ref(database, FEEDBACK_COMMENTS_COLLECTION)
      const newCommentRef = push(commentsRef)
      
      const commentData = {
        ...data,
        feedbackId,
        authorId,
        authorName,
        authorEmail,
        authorRole,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isEdited: false,
        mentions: data.mentions || []
      }

      await set(newCommentRef, commentData)
      
      return {
        id: newCommentRef.key!,
        ...data,
        feedbackId,
        authorId,
        authorName,
        authorEmail,
        authorRole: authorRole as any,
        createdAt: new Date(),
        updatedAt: new Date(),
        isEdited: false,
        mentions: data.mentions || []
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      throw new Error('Failed to add comment')
    }
  },

  // Update comment
  async updateComment(commentId: string, data: UpdateFeedbackCommentData): Promise<void> {
    try {
      const commentRef = ref(database, `${FEEDBACK_COMMENTS_COLLECTION}/${commentId}`)
      await update(commentRef, {
        ...data,
        updatedAt: serverTimestamp(),
        isEdited: true,
        editedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error updating comment:', error)
      throw new Error('Failed to update comment')
    }
  },

  // Delete comment
  async deleteComment(commentId: string): Promise<void> {
    try {
      const commentRef = ref(database, `${FEEDBACK_COMMENTS_COLLECTION}/${commentId}`)
      await remove(commentRef)
    } catch (error) {
      console.error('Error deleting comment:', error)
      throw new Error('Failed to delete comment')
    }
  },

  // Vote on feedback
  async voteFeedback(feedbackId: string, userId: string, userName: string, voteType: 'upvote' | 'downvote'): Promise<void> {
    try {
      // Check if user already voted
      const votesRef = ref(database, `${FEEDBACK_VOTES_COLLECTION}`)
      const votesSnapshot = await get(votesRef)
      
      let existingVoteId = null
      if (votesSnapshot.exists()) {
        const votesData = votesSnapshot.val()
        for (const voteId in votesData) {
          const voteData = votesData[voteId]
          if (voteData.feedbackId === feedbackId && voteData.userId === userId) {
            existingVoteId = voteId
            break
          }
        }
      }

      if (existingVoteId) {
        // Update existing vote
        const voteRef = ref(database, `${FEEDBACK_VOTES_COLLECTION}/${existingVoteId}`)
        await update(voteRef, {
          voteType,
          createdAt: serverTimestamp()
        })
      } else {
        // Add new vote
        const newVoteRef = push(votesRef)
        await set(newVoteRef, {
          feedbackId,
          userId,
          userName,
          voteType,
          createdAt: serverTimestamp()
        })
      }
    } catch (error) {
      console.error('Error voting on feedback:', error)
      throw new Error('Failed to vote on feedback')
    }
  },

  // Remove vote from feedback
  async removeVote(feedbackId: string, userId: string): Promise<void> {
    try {
      const votesRef = ref(database, `${FEEDBACK_VOTES_COLLECTION}`)
      const votesSnapshot = await get(votesRef)
      
      if (votesSnapshot.exists()) {
        const votesData = votesSnapshot.val()
        for (const voteId in votesData) {
          const voteData = votesData[voteId]
          if (voteData.feedbackId === feedbackId && voteData.userId === userId) {
            await remove(ref(database, `${FEEDBACK_VOTES_COLLECTION}/${voteId}`))
            break
          }
        }
      }
    } catch (error) {
      console.error('Error removing vote:', error)
      throw new Error('Failed to remove vote')
    }
  },

  // Get feedback statistics
  async getFeedbackStats(): Promise<FeedbackStats> {
    try {
      const feedbacksRef = ref(database, FEEDBACK_COLLECTION)
      const snapshot = await get(feedbacksRef)
      
      if (!snapshot.exists()) {
        return {
          total: 0,
          open: 0,
          inProgress: 0,
          resolved: 0,
          closed: 0,
          byCategory: {
            bug: 0,
            'feature-request': 0,
            improvement: 0,
            question: 0,
            complaint: 0,
            compliment: 0,
            other: 0
          },
          byPriority: {
            low: 0,
            medium: 0,
            high: 0,
            urgent: 0
          },
          mostActiveUsers: [],
          recentActivity: []
        }
      }

      const feedbacksData = snapshot.val()
      const feedbacks: Feedback[] = []

      for (const feedbackId in feedbacksData) {
        const feedbackData = feedbacksData[feedbackId]
        feedbacks.push({
          id: feedbackId,
          ...feedbackData,
          createdAt: new Date(feedbackData.createdAt),
          updatedAt: new Date(feedbackData.updatedAt),
          votes: [],
          comments: [],
          tags: feedbackData.tags || []
        } as Feedback)
      }

      const stats: FeedbackStats = {
        total: feedbacks.length,
        open: feedbacks.filter(f => f.status === 'open').length,
        inProgress: feedbacks.filter(f => f.status === 'in-progress').length,
        resolved: feedbacks.filter(f => f.status === 'resolved').length,
        closed: feedbacks.filter(f => f.status === 'closed').length,
        byCategory: {
          bug: feedbacks.filter(f => f.category === 'bug').length,
          'feature-request': feedbacks.filter(f => f.category === 'feature-request').length,
          improvement: feedbacks.filter(f => f.category === 'improvement').length,
          question: feedbacks.filter(f => f.category === 'question').length,
          complaint: feedbacks.filter(f => f.category === 'complaint').length,
          compliment: feedbacks.filter(f => f.category === 'compliment').length,
          other: feedbacks.filter(f => f.category === 'other').length
        },
        byPriority: {
          low: feedbacks.filter(f => f.priority === 'low').length,
          medium: feedbacks.filter(f => f.priority === 'medium').length,
          high: feedbacks.filter(f => f.priority === 'high').length,
          urgent: feedbacks.filter(f => f.priority === 'urgent').length
        },
        mostActiveUsers: [],
        recentActivity: []
      }

      // Calculate most active users
      const userActivity = feedbacks.reduce((acc, feedback) => {
        const userId = feedback.authorId
        if (!acc[userId]) {
          acc[userId] = { userId, userName: feedback.authorName, count: 0 }
        }
        acc[userId].count++
        return acc
      }, {} as Record<string, { userId: string; userName: string; count: number }>)

      stats.mostActiveUsers = Object.values(userActivity)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Get recent activity (last 10 feedbacks)
      stats.recentActivity = feedbacks
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 10)
        .map(feedback => ({
          feedbackId: feedback.id,
          title: feedback.title,
          action: 'created',
          user: feedback.authorName,
          timestamp: feedback.createdAt
        }))

      return stats
    } catch (error) {
      console.error('Error fetching feedback stats:', error)
      throw new Error('Failed to fetch feedback statistics')
    }
  }
}
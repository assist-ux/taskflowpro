import { useState, useEffect } from 'react'
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Filter, 
  ThumbsUp, 
  ThumbsDown, 
  MessageCircle, 
  Eye, 
  Edit, 
  Trash2, 
  X,
  Tag,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  Clock,
  Star,
  Bug,
  Lightbulb,
  HelpCircle,
  AlertTriangle,
  Heart,
  MoreHorizontal,
  XCircle
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { feedbackService } from '../services/feedbackService'
import { 
  Feedback, 
  FeedbackComment, 
  CreateFeedbackData, 
  FeedbackFilters,
  FeedbackCategory,
  FeedbackPriority,
  FeedbackStatus
} from '../types'
import { format } from 'date-fns'

export default function Feedbacks() {
  const { currentUser } = useAuth()
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [filters, setFilters] = useState<FeedbackFilters>({
    sortBy: 'newest'
  })
  const [error, setError] = useState('')

  // Form states
  const [newFeedback, setNewFeedback] = useState<CreateFeedbackData>({
    title: '',
    content: '',
    category: 'other',
    priority: 'medium',
    isAnonymous: false,
    tags: []
  })
  const [newComment, setNewComment] = useState('')
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    loadFeedbacks()
  }, [filters])

  const loadFeedbacks = async () => {
    try {
      setLoading(true)
      const data = await feedbackService.getFeedbacks(filters)
      setFeedbacks(data)
    } catch (error) {
      console.error('Error loading feedbacks:', error)
      setError('Failed to load feedbacks')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFeedback = async () => {
    if (!currentUser || !newFeedback.title.trim() || !newFeedback.content.trim()) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setError('')
      await feedbackService.createFeedback(
        newFeedback,
        currentUser.uid,
        currentUser.name,
        currentUser.email,
        currentUser.role
      )
      
      setNewFeedback({
        title: '',
        content: '',
        category: 'other',
        priority: 'medium',
        isAnonymous: false,
        tags: []
      })
      setShowCreateModal(false)
      loadFeedbacks()
    } catch (error) {
      console.error('Error creating feedback:', error)
      setError('Failed to create feedback')
    }
  }

  const handleAddComment = async (feedbackId: string) => {
    if (!currentUser || !newComment.trim()) return

    try {
      setError('')
      await feedbackService.addComment(
        feedbackId,
        { content: newComment },
        currentUser.uid,
        currentUser.name,
        currentUser.email,
        currentUser.role
      )
      
      setNewComment('')
      loadFeedbacks()
    } catch (error) {
      console.error('Error adding comment:', error)
      setError('Failed to add comment')
    }
  }

  const handleVote = async (feedbackId: string, voteType: 'upvote' | 'downvote') => {
    if (!currentUser) return

    try {
      setError('')
      await feedbackService.voteFeedback(
        feedbackId,
        currentUser.uid,
        currentUser.name,
        voteType
      )
      loadFeedbacks()
    } catch (error) {
      console.error('Error voting:', error)
      setError('Failed to vote on feedback')
    }
  }

  const handleRemoveVote = async (feedbackId: string) => {
    if (!currentUser) return

    try {
      setError('')
      await feedbackService.removeVote(feedbackId, currentUser.uid)
      loadFeedbacks()
    } catch (error) {
      console.error('Error removing vote:', error)
      setError('Failed to remove vote')
    }
  }

  const handleUpdateFeedbackStatus = async (feedbackId: string, status: FeedbackStatus) => {
    if (!currentUser) return

    try {
      setError('')
      await feedbackService.updateFeedback(feedbackId, { status })
      loadFeedbacks()
    } catch (error) {
      console.error(`Error updating feedback status to ${status}:`, error)
      setError(`Failed to update feedback status to ${status}`)
    }
  }

  const getCategoryIcon = (category: FeedbackCategory) => {
    switch (category) {
      case 'bug': return <Bug className="h-4 w-4" />
      case 'feature-request': return <Lightbulb className="h-4 w-4" />
      case 'improvement': return <Star className="h-4 w-4" />
      case 'question': return <HelpCircle className="h-4 w-4" />
      case 'complaint': return <AlertTriangle className="h-4 w-4" />
      case 'compliment': return <Heart className="h-4 w-4" />
      default: return <MessageSquare className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category: FeedbackCategory) => {
    switch (category) {
      case 'bug': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300'
      case 'feature-request': return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300'
      case 'improvement': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
      case 'question': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300'
      case 'complaint': return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-300'
      case 'compliment': return 'bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }
  }

  const getPriorityColor = (priority: FeedbackPriority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300'
      case 'high': return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-300'
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300'
      case 'low': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }
  }

  const getStatusColor = (status: FeedbackStatus) => {
    switch (status) {
      case 'open': return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300'
      case 'in-progress': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300'
      case 'under-review': return 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300'
      case 'resolved': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300'
      case 'closed': return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
      case 'duplicate': return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-300'
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
    }
  }

  const getStatusIcon = (status: FeedbackStatus) => {
    switch (status) {
      case 'open': return <AlertCircle className="h-4 w-4" />
      case 'in-progress': return <Clock className="h-4 w-4" />
      case 'under-review': return <Eye className="h-4 w-4" />
      case 'resolved': return <CheckCircle className="h-4 w-4" />
      case 'closed': return <X className="h-4 w-4" />
      case 'duplicate': return <MoreHorizontal className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !(newFeedback.tags || []).includes(tagInput.trim())) {
      setNewFeedback(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }))
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setNewFeedback(prev => ({
      ...prev,
      tags: (prev.tags || []).filter(tag => tag !== tagToRemove)
    }))
  }

  const filteredFeedbacks = feedbacks.filter(feedback =>
    feedback.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    feedback.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    feedback.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading feedbacks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Feedback & Suggestions
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Share your thoughts, report issues, and suggest improvements
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>New Feedback</span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search feedbacks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn-secondary flex items-center space-x-2"
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
              </button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                    <select
                      value={filters.category?.[0] || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value ? [e.target.value as FeedbackCategory] : undefined }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">All Categories</option>
                      <option value="bug">Bug Report</option>
                      <option value="feature-request">Feature Request</option>
                      <option value="improvement">Improvement</option>
                      <option value="question">Question</option>
                      <option value="complaint">Complaint</option>
                      <option value="compliment">Compliment</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority</label>
                    <select
                      value={filters.priority?.[0] || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value ? [e.target.value as FeedbackPriority] : undefined }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">All Priorities</option>
                      <option value="urgent">Urgent</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                    <select
                      value={filters.status?.[0] || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value ? [e.target.value as FeedbackStatus] : undefined }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">All Statuses</option>
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="under-review">Under Review</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                      <option value="duplicate">Duplicate</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sort By</label>
                  <select
                    value={filters.sortBy || 'newest'}
                    onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                    className="w-full md:w-auto px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="most-voted">Most Voted</option>
                    <option value="least-voted">Least Voted</option>
                    <option value="most-commented">Most Commented</option>
                    <option value="least-commented">Least Commented</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Feedbacks List */}
        <div className="space-y-4">
          {filteredFeedbacks.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
              <MessageSquare className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No feedback found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {searchTerm ? 'Try adjusting your search terms' : 'Be the first to share your feedback!'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary"
                >
                  Create First Feedback
                </button>
              )}
            </div>
          ) : (
            filteredFeedbacks.map((feedback) => {
              const userVote = feedback.votes.find(vote => vote.userId === currentUser?.uid)
              const upvotes = feedback.votes.filter(vote => vote.voteType === 'upvote').length
              const downvotes = feedback.votes.filter(vote => vote.voteType === 'downvote').length
              
              return (
                <div key={feedback.id} className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(feedback.category)}`}>
                            {getCategoryIcon(feedback.category)}
                            <span className="ml-1 capitalize">{feedback.category.replace('-', ' ')}</span>
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(feedback.priority)}`}>
                            {feedback.priority}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(feedback.status)}`}>
                            {getStatusIcon(feedback.status)}
                            <span className="ml-1 capitalize">{feedback.status.replace('-', ' ')}</span>
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                          {feedback.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                          {feedback.content}
                        </p>
                        {feedback.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {feedback.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                              >
                                <Tag className="h-3 w-3 mr-1" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4" />
                          <span>{feedback.isAnonymous ? 'Anonymous' : feedback.authorName}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{format(feedback.createdAt, 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="h-4 w-4" />
                          <span>{feedback.comments.length} comments</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => userVote?.voteType === 'upvote' ? handleRemoveVote(feedback.id) : handleVote(feedback.id, 'upvote')}
                            className={`p-1 rounded ${
                              userVote?.voteType === 'upvote' 
                                ? 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900' 
                                : 'text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-100 dark:hover:bg-green-900'
                            }`}
                          >
                            <ThumbsUp className="h-4 w-4" />
                          </button>
                          <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[20px] text-center">
                            {upvotes}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => userVote?.voteType === 'downvote' ? handleRemoveVote(feedback.id) : handleVote(feedback.id, 'downvote')}
                            className={`p-1 rounded ${
                              userVote?.voteType === 'downvote' 
                                ? 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900' 
                                : 'text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900'
                            }`}
                          >
                            <ThumbsDown className="h-4 w-4" />
                          </button>
                          <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[20px] text-center">
                            {downvotes}
                          </span>
                        </div>
                        {/* Close button for root users */}
                        {currentUser?.role === 'root' && feedback.status !== 'closed' && (
                          <button
                            onClick={() => handleUpdateFeedbackStatus(feedback.id, 'closed')}
                            className="btn-secondary text-sm flex items-center space-x-1"
                          >
                            <XCircle className="h-4 w-4" />
                            <span>Close</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedFeedback(feedback)
                            setShowDetailsModal(true)
                          }}
                          className="btn-secondary text-sm"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Create Feedback Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Create New Feedback</h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={newFeedback.title}
                      onChange={(e) => setNewFeedback(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="Brief description of your feedback"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category *
                    </label>
                    <select
                      value={newFeedback.category}
                      onChange={(e) => setNewFeedback(prev => ({ ...prev, category: e.target.value as FeedbackCategory }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="bug">Bug Report</option>
                      <option value="feature-request">Feature Request</option>
                      <option value="improvement">Improvement</option>
                      <option value="question">Question</option>
                      <option value="complaint">Complaint</option>
                      <option value="compliment">Compliment</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Priority
                    </label>
                    <select
                      value={newFeedback.priority}
                      onChange={(e) => setNewFeedback(prev => ({ ...prev, priority: e.target.value as FeedbackPriority }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description *
                    </label>
                    <textarea
                      value={newFeedback.content}
                      onChange={(e) => setNewFeedback(prev => ({ ...prev, content: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="Detailed description of your feedback..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {(newFeedback.tags || []).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-300"
                        >
                          {tag}
                          <button
                            onClick={() => removeTag(tag)}
                            className="ml-1 text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addTag()}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder="Add a tag..."
                      />
                      <button
                        onClick={addTag}
                        className="btn-secondary"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="anonymous"
                      checked={newFeedback.isAnonymous}
                      onChange={(e) => setNewFeedback(prev => ({ ...prev, isAnonymous: e.target.checked }))}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
                    />
                    <label htmlFor="anonymous" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Submit anonymously
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateFeedback}
                    className="btn-primary"
                  >
                    Submit Feedback
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Details Modal */}
        {showDetailsModal && selectedFeedback && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Feedback Details</h2>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Feedback Header */}
                  <div>
                    <div className="flex items-center space-x-2 mb-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(selectedFeedback.category)}`}>
                        {getCategoryIcon(selectedFeedback.category)}
                        <span className="ml-1 capitalize">{selectedFeedback.category.replace('-', ' ')}</span>
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedFeedback.priority)}`}>
                        {selectedFeedback.priority}
                      </span>
                      {/* Status display or edit for root users */}
                      {currentUser?.role === 'root' ? (
                        <select
                          value={selectedFeedback.status}
                          onChange={(e) => handleUpdateFeedbackStatus(selectedFeedback.id, e.target.value as FeedbackStatus)}
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedFeedback.status as FeedbackStatus)}`}
                        >
                          <option value="open">Open</option>
                          <option value="in-progress">In Progress</option>
                          <option value="under-review">Under Review</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                          <option value="duplicate">Duplicate</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedFeedback.status as FeedbackStatus)}`}>
                          {getStatusIcon(selectedFeedback.status as FeedbackStatus)}
                          <span className="ml-1 capitalize">{selectedFeedback.status.replace('-', ' ')}</span>
                        </span>
                      )}
                      {/* Close button for root users in details modal */}
                      {currentUser?.role === 'root' && selectedFeedback.status !== 'closed' && (
                        <button
                          onClick={() => handleUpdateFeedbackStatus(selectedFeedback.id, 'closed')}
                          className="btn-secondary text-xs flex items-center space-x-1"
                        >
                          <XCircle className="h-3 w-3" />
                          <span>Close Feedback</span>
                        </button>
                      )}
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                      {selectedFeedback.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {selectedFeedback.content}
                    </p>
                    {selectedFeedback.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedFeedback.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                          >
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Comments Section */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                      Comments ({selectedFeedback.comments.length})
                    </h4>
                    
                    {/* Add Comment */}
                    <div className="mb-6">
                      <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder="Add a comment..."
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={() => handleAddComment(selectedFeedback.id)}
                          className="btn-primary"
                        >
                          Add Comment
                        </button>
                      </div>
                    </div>

                    {/* Comments List */}
                    <div className="space-y-4">
                      {selectedFeedback.comments.map((comment) => (
                        <div key={comment.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {comment.authorName}
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {format(comment.createdAt, 'MMM dd, yyyy HH:mm')}
                              </span>
                              {comment.isEdited && (
                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                  (edited)
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300">
                            {comment.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="fixed top-4 right-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg shadow-lg z-50">
            <div className="flex items-center space-x-2">
              <span>{error}</span>
              <button
                onClick={() => setError('')}
                className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

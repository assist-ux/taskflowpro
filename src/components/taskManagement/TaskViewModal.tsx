import { useState, useEffect, useRef } from 'react'
import { X, User, Calendar, Clock, CheckCircle2, MessageSquare, Send, StickyNote, Paperclip, Smile, Trash2, Building2 } from 'lucide-react'
import { Task, TaskStatus, TaskPriority, TaskComment, Team } from '../../types'
import { taskService } from '../../services/taskService'
import { mentionNotificationService } from '../../services/mentionNotificationService'
import { useAuth } from '../../contexts/AuthContext'
import MentionInput from '../common/MentionInput'
import MentionText from '../common/MentionText'
import { canDeleteTask } from '../../utils/permissions'

interface TaskViewModalProps {
  isOpen: boolean
  onClose: () => void
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
  task: Task | null
  statuses: TaskStatus[]
  priorities: TaskPriority[]
  teams?: Team[] // Add teams prop
}

const PRIORITY_ICONS = {
  low: '○',
  medium: '▶',
  high: '⚠',
  urgent: '🚩'
}

const PRIORITY_COLORS = {
  low: 'text-gray-500 dark:text-gray-400',
  medium: 'text-blue-500 dark:text-blue-400',
  high: 'text-orange-500 dark:text-orange-400',
  urgent: 'text-red-500 dark:text-red-400'
}

export default function TaskViewModal({ 
  isOpen, 
  onClose, 
  onEdit, 
  onDelete, 
  task, 
  statuses, 
  priorities,
  teams = [] // Add teams prop with default value
}: TaskViewModalProps) {
  const { currentUser } = useAuth()
  const [description, setDescription] = useState('')
  const [comments, setComments] = useState<TaskComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [newCommentMentions, setNewCommentMentions] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [notesMentions, setNotesMentions] = useState<string[]>([])
  const [isUpdating, setIsUpdating] = useState(false)
  const [activeTab, setActiveTab] = useState<'comments' | 'notes'>('comments')
  const commentsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (task && isOpen) {
      setDescription(task.description || '')
      setComments(task.comments || [])
      setNotes(task.notes || '')
    }
  }, [task, isOpen])

  // Auto-scroll to bottom of comments when new comment is added
  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  const handleDescriptionUpdate = async () => {
    if (!task || !currentUser) return
    
    setIsUpdating(true)
    try {
      await taskService.updateTask(task.id, { description })
    } catch (error) {
      console.error('Error updating description:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleNotesChange = (value: string, mentions: string[]) => {
    setNotes(value)
    setNotesMentions(mentions)
  }

  const handleNotesUpdate = async () => {
    if (!task || !currentUser) return
    
    setIsUpdating(true)
    try {
      await taskService.updateTask(task.id, { notes })

      // Process mentions in notes and create notifications
      await mentionNotificationService.processMentions(
        notes,
        currentUser.uid,
        currentUser.name || 'Unknown User',
        'note',
        task.id,
        `Notes for task: ${task.title}`,
        task.id,
        task.projectId
      )
    } catch (error) {
      console.error('Error updating notes:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCommentChange = (value: string, mentions: string[]) => {
    console.log('Comment change - Value:', value, 'Mentions:', mentions, 'Task:', task, 'CurrentUser:', currentUser);
    setNewComment(value);
    setNewCommentMentions(mentions);
  }

  const handleAddComment = async () => {
    if (!task || !currentUser || !newComment.trim()) return
    
    const comment: TaskComment = {
      id: Date.now().toString(),
      content: newComment.trim(),
      authorId: currentUser.uid,
      authorName: currentUser.name || 'Unknown User',
      authorEmail: currentUser.email || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      mentions: newCommentMentions
    }

    try {
      // Add comment to local state immediately for better UX
      setComments(prev => [...prev, comment])
      setNewComment('')
      setNewCommentMentions([])
      
      // Update task with new comment
      await taskService.updateTask(task.id, { 
        comments: [...comments, comment]
      } as any)

      // Process mentions and create notifications
      await mentionNotificationService.processMentions(
        newComment.trim(),
        currentUser.uid,
        currentUser.name || 'Unknown User',
        'comment',
        comment.id,
        `Comment on task: ${task.title}`,
        task.id,
        task.projectId
      )
    } catch (error) {
      console.error('Error adding comment:', error)
      // Revert on error
      setComments(prev => prev.filter(c => c.id !== comment.id))
    }
  }

  const formatDate = (date: Date | undefined) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPriorityIcon = (priority: TaskPriority) => {
    return PRIORITY_ICONS[priority.name.toLowerCase() as keyof typeof PRIORITY_ICONS] || '○'
  }

  const getPriorityColor = (priority: TaskPriority) => {
    return PRIORITY_COLORS[priority.name.toLowerCase() as keyof typeof PRIORITY_COLORS] || 'text-gray-500'
  }

  if (!isOpen || !task) return null

  const priority = task.priority
  const status = task.status

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: priority.color }}
            />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {task.title}
            </h2>
            <span 
              className="px-2 py-1 text-xs rounded-full text-white"
              style={{ backgroundColor: status.color }}
            >
              {status.name}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEdit(task)}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Edit
            </button>
            {currentUser && canDeleteTask(currentUser.role, task.createdBy, currentUser.uid) && (
              <button
                onClick={() => onDelete(task.id)}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center space-x-1"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Task Details */}
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column - Basic Info */}
              <div className="space-y-4">
                {/* Priority */}
                <div className="flex items-center space-x-2">
                  <span className={`text-lg ${getPriorityColor(priority)}`}>
                    {getPriorityIcon(priority)}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {priority.name} priority
                  </span>
                </div>

                {/* Project */}
                {task.projectName && (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {task.projectName}
                    </span>
                  </div>
                )}

                {/* Creator */}
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Created by {task.createdByName || 'Unknown'}
                  </span>
                </div>

                {/* Assignee */}
                {task.assigneeName && (
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Assigned to {task.assigneeName}
                    </span>
                  </div>
                )}

                {/* Due Date */}
                {task.dueDate && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Due {formatDate(task.dueDate)}
                    </span>
                  </div>
                )}

                {/* Estimated Hours */}
                {task.estimatedHours && (
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {task.estimatedHours}h estimated
                    </span>
                  </div>
                )}

                {/* Actual Hours */}
                {task.actualHours && task.actualHours > 0 && (
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 dark:text-green-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {task.actualHours}h logged
                    </span>
                  </div>
                )}

                {/* Team */}
                {task.teamId && (
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Team: {teams.find(t => t.id === task.teamId)?.name || task.teamId}
                    </span>
                  </div>
                )}
              </div>

              {/* Right Column - Description & Chat */}
              <div className="space-y-4">
                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <div className="space-y-2">
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      onBlur={handleDescriptionUpdate}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      rows={3}
                      placeholder="Add a description..."
                    />
                    {isUpdating && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">Updating...</p>
                    )}
                  </div>
                </div>

                {/* Chat Tabs */}
                <div className="border-b border-gray-200 dark:border-gray-700">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setActiveTab('comments')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                        activeTab === 'comments'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>Comments ({comments.length})</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('notes')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                        activeTab === 'notes'
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      <StickyNote className="h-4 w-4" />
                      <span>Notes</span>
                    </button>
                  </nav>
                </div>

                {/* Chat Content */}
                <div className="h-80 flex flex-col">
                  {activeTab === 'comments' ? (
                    <>
                      {/* Comments List - Chat Style */}
                      <div className="flex-1 overflow-y-auto space-y-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        {comments.length === 0 ? (
                          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No comments yet. Start the conversation!</p>
                          </div>
                        ) : (
                          comments.map((comment) => (
                            <div key={comment.id} className="flex space-x-3">
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                  {comment.authorName.charAt(0).toUpperCase()}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {comment.authorName}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatDateTime(comment.createdAt)}
                                  </span>
                                </div>
                                <div className="bg-white dark:bg-gray-700 rounded-lg px-3 py-2 shadow-sm">
                                  <MentionText
                                    text={comment.content}
                                    className="text-sm text-gray-900 dark:text-gray-100"
                                  />
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                        <div ref={commentsEndRef} />
                      </div>

                      {/* Add Comment - Chat Input with Mentions */}
                      <div className="mt-3 flex space-x-2">
                        <div className="flex-1">
                          <MentionInput
                            value={newComment}
                            onChange={handleCommentChange}
                            projectId={task.projectId}
                            currentUserId={currentUser?.uid}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                            placeholder="Type a message... Use @ to mention someone"
                            className="px-4 py-3 pr-12 rounded-full"
                            rows={1}
                          />
                        </div>
                        <button
                          onClick={handleAddComment}
                          disabled={!newComment.trim()}
                          className="px-4 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Notes Section with Mentions */}
                      <div className="flex-1">
                        <div className="h-full">
                          <MentionInput
                            value={notes}
                            onChange={handleNotesChange}
                            projectId={task.projectId}
                            currentUserId={currentUser?.uid}
                            onBlur={handleNotesUpdate}
                            placeholder="Add collaborative notes here... Use @ to mention team members"
                            className="w-full h-full px-3 py-2"
                            rows={12}
                          />
                        </div>
                        {isUpdating && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Saving notes...</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

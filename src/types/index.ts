export type UserRole = 'employee' | 'admin'
export type TeamRole = 'member' | 'leader'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  teamId?: string | null
  teamRole?: TeamRole | null
  avatar?: string
  timezone: string
  hourlyRate?: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface AuthUser {
  uid: string
  email: string
  role: UserRole
  name: string
  teamId?: string | null
  teamRole?: TeamRole | null
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupCredentials {
  name: string
  email: string
  password: string
  confirmPassword: string
  role: UserRole
}

// Project Management Types
export interface Project {
  id: string
  name: string
  description?: string
  color: string
  status: 'active' | 'on-hold' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  startDate?: Date
  endDate?: Date
  budget?: number
  clientId?: string
  clientName?: string
  isArchived: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  company?: string
  address?: string
  isArchived: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateProjectData {
  name: string
  description?: string
  color: string
  status: 'active' | 'on-hold' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  startDate?: Date
  endDate?: Date
  budget?: number
  clientId?: string
}

export interface CreateClientData {
  name: string
  email?: string
  phone?: string
  company?: string
  address?: string
}

// Time Tracking Types
export interface TimeEntry {
  id: string
  userId: string
  projectId?: string
  projectName?: string
  description?: string
  startTime: Date
  endTime?: Date
  duration: number // in seconds
  isRunning: boolean
  isBillable: boolean
  tags?: string[]
  createdAt: Date
  updatedAt: Date
}

export interface CreateTimeEntryData {
  projectId?: string
  description?: string
  isBillable?: boolean
  tags?: string[]
}

export interface TimerState {
  isRunning: boolean
  startTime?: Date
  currentEntry?: TimeEntry
  elapsedTime: number // in seconds
}

export interface TimeStats {
  daily: number // seconds
  weekly: number // seconds
  monthly: number // seconds
  total: number // seconds
}

export interface TimeSummary {
  today: {
    total: number
    billable: number
    entries: number
  }
  thisWeek: {
    total: number
    billable: number
    entries: number
  }
  thisMonth: {
    total: number
    billable: number
    entries: number
  }
}

// Reports and Analytics Types
export interface TimeAnalytics {
  totalTime: number
  billableTime: number
  nonBillableTime: number
  totalEntries: number
  averageSessionLength: number
  mostProductiveDay: string
  mostProductiveHour: number
  totalEarnings: number
}

export interface ProjectAnalytics {
  projectId: string
  projectName: string
  totalTime: number
  billableTime: number
  entries: number
  percentage: number
  color: string
}

export interface DailyAnalytics {
  date: string
  totalTime: number
  billableTime: number
  entries: number
  projects: { [projectId: string]: number }
}

export interface WeeklyAnalytics {
  week: string
  totalTime: number
  billableTime: number
  entries: number
  dailyBreakdown: DailyAnalytics[]
}

export interface MonthlyAnalytics {
  month: string
  totalTime: number
  billableTime: number
  entries: number
  weeklyBreakdown: WeeklyAnalytics[]
}

export interface ReportFilters {
  startDate: Date
  endDate: Date
  projectIds?: string[]
  billableOnly?: boolean
  userId?: string
}

export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string | string[]
    borderWidth?: number
  }[]
}

// Project Management Types
export interface Task {
  id: string
  title: string
  description?: string
  projectId: string
  projectName: string
  status: TaskStatus
  priority: TaskPriority
  assigneeId?: string
  assigneeName?: string
  assigneeEmail?: string
  dueDate?: Date
  estimatedHours?: number
  actualHours?: number
  tags: string[]
  isCompleted: boolean
  completedAt?: Date
  createdBy: string
  createdByName: string
  createdAt: Date
  updatedAt: Date
  parentTaskId?: string
  subtasks?: Task[]
  attachments: TaskAttachment[]
  comments: TaskComment[]
  timeEntries: string[] // Array of time entry IDs
}

export interface TaskStatus {
  id: string
  name: string
  color: string
  order: number
  isCompleted: boolean
}

export interface TaskPriority {
  id: string
  name: string
  color: string
  level: number
}

export interface TaskAttachment {
  id: string
  name: string
  url: string
  type: string
  size: number
  uploadedBy: string
  uploadedAt: Date
}

export interface TaskComment {
  id: string
  content: string
  authorId: string
  authorName: string
  authorEmail: string
  createdAt: Date
  updatedAt: Date
  mentions: string[] // Array of user IDs mentioned
  parentCommentId?: string
  replies?: TaskComment[]
}

export interface ProjectBoard {
  id: string
  name: string
  description?: string
  projectId: string
  type: BoardType
  columns: BoardColumn[]
  settings: BoardSettings
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface BoardColumn {
  id: string
  name: string
  color: string
  order: number
  taskStatusId: string
  taskLimit?: number
  isCollapsed: boolean
}

export interface BoardSettings {
  showCompletedTasks: boolean
  showAssignee: boolean
  showDueDate: boolean
  showPriority: boolean
  showTags: boolean
  showTimeTracking: boolean
  allowDragDrop: boolean
  groupBy?: 'assignee' | 'priority' | 'dueDate' | 'tags' | 'none'
}

export type BoardType = 'kanban' | 'list' | 'calendar' | 'gantt' | 'timeline'

export interface CreateTaskData {
  title: string
  description?: string
  projectId: string
  status: string
  priority: string
  assigneeId?: string
  dueDate?: Date
  estimatedHours?: number
  tags: string[]
  parentTaskId?: string
}

export interface UpdateTaskData {
  title?: string
  description?: string
  status?: string
  priority?: string
  assigneeId?: string
  dueDate?: Date
  estimatedHours?: number
  actualHours?: number
  tags?: string[]
  isCompleted?: boolean
  parentTaskId?: string
}

export interface CreateBoardData {
  name: string
  description?: string
  projectId: string
  type: BoardType
  columns: Omit<BoardColumn, 'id'>[]
  settings: BoardSettings
}

export interface UpdateBoardData {
  name?: string
  description?: string
  type?: BoardType
  columns?: BoardColumn[]
  settings?: BoardSettings
}

export interface TaskFilter {
  projectId?: string
  status?: string[]
  priority?: string[]
  assigneeId?: string
  tags?: string[]
  dueDateFrom?: Date
  dueDateTo?: Date
  isCompleted?: boolean
  search?: string
}

export interface ProjectStats {
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  overdueTasks: number
  totalEstimatedHours: number
  totalActualHours: number
  completionRate: number
  averageTaskDuration: number
  teamMembers: number
  activeBoards: number
}

export interface TeamMember {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'member' | 'viewer'
  avatar?: string
  isActive: boolean
  joinedAt: Date
  lastActiveAt?: Date
  taskCount: number
  completedTasks: number
}

export interface ProjectTemplate {
  id: string
  name: string
  description: string
  category: string
  icon: string
  color: string
  defaultStatuses: Omit<TaskStatus, 'id'>[]
  defaultPriorities: Omit<TaskPriority, 'id'>[]
  defaultColumns: Omit<BoardColumn, 'id' | 'taskStatusId'>[]
  isPublic: boolean
  createdBy: string
  createdAt: Date
  usageCount: number
}

// Team Management Types
export interface Team {
  id: string
  name: string
  description?: string
  leaderId: string
  leaderName: string
  leaderEmail: string
  color: string
  isActive: boolean
  memberCount: number
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface TeamMember {
  id: string
  teamId: string
  userId: string
  userName: string
  userEmail: string
  teamRole: TeamRole
  joinedAt: Date
  isActive: boolean
}

export interface CreateTeamData {
  name: string
  description?: string
  leaderId: string
  color: string
}

export interface UpdateTeamData {
  name?: string
  description?: string
  leaderId?: string
  color?: string
  isActive?: boolean
}

export interface AddTeamMemberData {
  userId: string
  role: TeamRole
}

export interface TeamStats {
  totalMembers: number
  activeMembers: number
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  overdueTasks: number
  totalTimeLogged: number
  averageTaskCompletion: number
}

// Messaging Types
export interface Message {
  id: string
  teamId: string
  senderId: string
  senderName: string
  senderEmail: string
  content: string
  timestamp: Date
  type: 'text' | 'system' | 'file'
  isEdited: boolean
  editedAt?: Date
  replyTo?: string
  attachments?: MessageAttachment[]
  reactions?: MessageReaction[]
}

export interface MessageAttachment {
  id: string
  name: string
  url: string
  type: string
  size: number
  uploadedAt: Date
}

export interface MessageReaction {
  emoji: string
  userId: string
  userName: string
  timestamp: Date
}

export interface TeamChat {
  teamId: string
  teamName: string
  lastMessage?: Message
  unreadCount: number
  isActive: boolean
  members: string[]
}

export interface CreateMessageData {
  teamId: string
  content: string
  type?: 'text' | 'system' | 'file'
  replyTo?: string
  attachments?: Omit<MessageAttachment, 'id' | 'uploadedAt'>[]
}
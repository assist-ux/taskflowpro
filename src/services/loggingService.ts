import { ref, push, get, orderByChild, limitToLast, query } from 'firebase/database'
import { database } from '../config/firebase'
import { isValid } from 'date-fns'

export interface SystemLog {
  id: string
  timestamp: Date
  level: 'info' | 'warning' | 'error' | 'success'
  message: string
  userId?: string
  userName?: string
  action: string
  details?: any
  ipAddress?: string
  userAgent?: string
}

class LoggingService {
  private logsRef = ref(database, 'systemLogs')

  // Create a new log entry
  async log(level: SystemLog['level'], message: string, action: string, details?: any, userId?: string, userName?: string): Promise<void> {
    try {
      const logEntry: Omit<SystemLog, 'id'> = {
        timestamp: new Date(),
        level,
        message,
        action,
        details: details || null,
        userId: userId || null,
        userName: userName || null,
        ipAddress: this.getClientIP(),
        userAgent: navigator.userAgent
      }

      await push(this.logsRef, logEntry)
    } catch (error) {
      console.error('Failed to log system event:', error)
    }
  }

  // Log info events
  async logInfo(message: string, action: string, details?: any, userId?: string, userName?: string): Promise<void> {
    await this.log('info', message, action, details, userId, userName)
  }

  // Log warning events
  async logWarning(message: string, action: string, details?: any, userId?: string, userName?: string): Promise<void> {
    await this.log('warning', message, action, details, userId, userName)
  }

  // Log error events
  async logError(message: string, action: string, details?: any, userId?: string, userName?: string): Promise<void> {
    await this.log('error', message, action, details, userId, userName)
  }

  // Log success events
  async logSuccess(message: string, action: string, details?: any, userId?: string, userName?: string): Promise<void> {
    await this.log('success', message, action, details, userId, userName)
  }

  // Get recent logs
  async getRecentLogs(limit: number = 100): Promise<SystemLog[]> {
    try {
      const logsQuery = query(this.logsRef, orderByChild('timestamp'), limitToLast(limit))
      const snapshot = await get(logsQuery)
      
      if (snapshot.exists()) {
        const logs = snapshot.val()
        return Object.entries(logs)
          .map(([id, log]: [string, any]) => {
            const timestamp = new Date(log.timestamp)
            return {
              ...log,
              id,
              timestamp: isValid(timestamp) ? timestamp : new Date()
            }
          })
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      }
      
      return []
    } catch (error) {
      console.error('Failed to fetch logs:', error)
      // Return empty array instead of throwing error to prevent UI crashes
      return []
    }
  }

  // Get logs by level
  async getLogsByLevel(level: SystemLog['level'], limit: number = 100): Promise<SystemLog[]> {
    try {
      const logsQuery = query(this.logsRef, orderByChild('level'), limitToLast(limit))
      const snapshot = await get(logsQuery)
      
      if (snapshot.exists()) {
        const logs = snapshot.val()
        return Object.entries(logs)
          .map(([id, log]: [string, any]) => {
            const timestamp = new Date(log.timestamp)
            return {
              ...log,
              id,
              timestamp: isValid(timestamp) ? timestamp : new Date()
            }
          })
          .filter(log => log.level === level)
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      }
      
      return []
    } catch (error) {
      console.error('Failed to fetch logs by level:', error)
      return []
    }
  }

  // Get logs by user
  async getLogsByUser(userId: string, limit: number = 100): Promise<SystemLog[]> {
    try {
      const logsQuery = query(this.logsRef, orderByChild('userId'), limitToLast(limit))
      const snapshot = await get(logsQuery)
      
      if (snapshot.exists()) {
        const logs = snapshot.val()
        return Object.entries(logs)
          .map(([id, log]: [string, any]) => {
            const timestamp = new Date(log.timestamp)
            return {
              ...log,
              id,
              timestamp: isValid(timestamp) ? timestamp : new Date()
            }
          })
          .filter(log => log.userId === userId)
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      }
      
      return []
    } catch (error) {
      console.error('Failed to fetch logs by user:', error)
      return []
    }
  }

  // Clear all logs
  async clearAllLogs(): Promise<void> {
    try {
      await push(this.logsRef, {
        timestamp: new Date(),
        level: 'info',
        message: 'All logs cleared by admin',
        action: 'CLEAR_LOGS',
        userId: null,
        userName: 'System'
      })
    } catch (error) {
      console.error('Failed to clear logs:', error)
      throw error
    }
  }

  // Get client IP (simplified - in production you'd get this from server)
  private getClientIP(): string {
    // This is a simplified version - in production you'd get the real IP
    return '127.0.0.1'
  }

  // Log user authentication events
  async logAuthEvent(event: 'login' | 'logout' | 'signup' | 'password_reset', userId: string, userName: string, success: boolean, details?: any): Promise<void> {
    const level = success ? 'success' : 'error'
    const message = success 
      ? `User ${event} successful` 
      : `User ${event} failed`
    
    await this.log(level, message, `AUTH_${event.toUpperCase()}`, details, userId, userName)
  }

  // Log database operations
  async logDatabaseEvent(operation: 'create' | 'read' | 'update' | 'delete', collection: string, recordId: string, userId: string, userName: string, success: boolean, details?: any): Promise<void> {
    const level = success ? 'info' : 'error'
    const message = success 
      ? `${operation} operation on ${collection} successful` 
      : `${operation} operation on ${collection} failed`
    
    await this.log(level, message, `DB_${operation.toUpperCase()}`, { collection, recordId, ...details }, userId, userName)
  }

  // Log system events
  async logSystemEvent(event: 'backup' | 'restore' | 'maintenance' | 'error', message: string, details?: any, userId?: string, userName?: string): Promise<void> {
    const level = event === 'error' ? 'error' : 'info'
    await this.log(level, message, `SYSTEM_${event.toUpperCase()}`, details, userId, userName)
  }

  // Log user actions
  async logUserAction(action: string, message: string, userId: string, userName: string, details?: any): Promise<void> {
    await this.log('info', message, `USER_${action.toUpperCase()}`, details, userId, userName)
  }
}

export const loggingService = new LoggingService()

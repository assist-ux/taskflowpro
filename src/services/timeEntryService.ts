import { ref, set, get, push, remove, update, query, orderByChild, equalTo } from 'firebase/database'
import { database } from '../config/firebase'
import { TimeEntry, CreateTimeEntryData, TimeSummary } from '../types'

export const timeEntryService = {
  // Create a new time entry
  async createTimeEntry(entryData: CreateTimeEntryData, userId: string, projectName?: string): Promise<string> {
    const entryRef = push(ref(database, 'timeEntries'))
    const now = new Date()
    const newEntry: TimeEntry = {
      ...entryData,
      id: entryRef.key!,
      userId,
      projectName: projectName,
      startTime: now,
      duration: 0,
      isRunning: true,
      isBillable: entryData.isBillable || false,
      createdAt: now,
      updatedAt: now
    }
    
    await set(entryRef, {
      ...newEntry,
      startTime: now.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    })
    return entryRef.key!
  },

  // Get all time entries for a user
  async getTimeEntries(userId: string): Promise<TimeEntry[]> {
    const entriesRef = ref(database, 'timeEntries')
    const q = query(entriesRef, orderByChild('userId'), equalTo(userId))
    const snapshot = await get(q)
    
    if (snapshot.exists()) {
      const entries = snapshot.val()
      return Object.values(entries)
        .map((entry: any) => ({
          ...entry,
          startTime: new Date(entry.startTime),
          endTime: entry.endTime ? new Date(entry.endTime) : undefined,
          createdAt: new Date(entry.createdAt),
          updatedAt: new Date(entry.updatedAt)
        }))
        .sort((a: TimeEntry, b: TimeEntry) => b.createdAt.getTime() - a.createdAt.getTime())
    }
    
    return []
  },

  // Get all time entries (for admin use)
  async getAllTimeEntries(): Promise<TimeEntry[]> {
    const entriesRef = ref(database, 'timeEntries')
    const snapshot = await get(entriesRef)
    
    if (snapshot.exists()) {
      const entries = snapshot.val()
      return Object.values(entries)
        .map((entry: any) => ({
          ...entry,
          startTime: new Date(entry.startTime),
          endTime: entry.endTime ? new Date(entry.endTime) : undefined,
          createdAt: new Date(entry.createdAt),
          updatedAt: new Date(entry.updatedAt)
        }))
        .sort((a: TimeEntry, b: TimeEntry) => b.createdAt.getTime() - a.createdAt.getTime())
    }
    
    return []
  },

  // Get time entries for a specific date range
  async getTimeEntriesByDateRange(userId: string, startDate: Date, endDate: Date): Promise<TimeEntry[]> {
    const entriesRef = ref(database, 'timeEntries')
    const q = query(
      entriesRef, 
      orderByChild('userId'), 
      equalTo(userId)
    )
    const snapshot = await get(q)
    
    if (snapshot.exists()) {
      const entries = snapshot.val()
      return Object.values(entries)
        .map((entry: any) => ({
          ...entry,
          startTime: new Date(entry.startTime),
          endTime: entry.endTime ? new Date(entry.endTime) : undefined,
          createdAt: new Date(entry.createdAt),
          updatedAt: new Date(entry.updatedAt)
        }))
        .filter((entry: TimeEntry) => {
          const entryDate = new Date(entry.startTime)
          return entryDate >= startDate && entryDate <= endDate
        })
        .sort((a: TimeEntry, b: TimeEntry) => b.createdAt.getTime() - a.createdAt.getTime())
    }
    
    return []
  },

  // Get currently running time entry
  async getRunningTimeEntry(userId: string): Promise<TimeEntry | null> {
    const entriesRef = ref(database, 'timeEntries')
    const q = query(entriesRef, orderByChild('userId'), equalTo(userId))
    const snapshot = await get(q)
    
    if (snapshot.exists()) {
      const entries = snapshot.val()
      const runningEntry = Object.values(entries)
        .map((entry: any) => ({
          ...entry,
          startTime: new Date(entry.startTime),
          endTime: entry.endTime ? new Date(entry.endTime) : undefined,
          createdAt: new Date(entry.createdAt),
          updatedAt: new Date(entry.updatedAt)
        }))
        .find((entry: TimeEntry) => entry.isRunning && entry.userId === userId)
      
      return runningEntry || null
    }
    
    return null
  },

  // Stop a running time entry
  async stopTimeEntry(entryId: string): Promise<void> {
    const entryRef = ref(database, `timeEntries/${entryId}`)
    const snapshot = await get(entryRef)
    
    if (snapshot.exists()) {
      const entry = snapshot.val()
      const endTime = new Date()
      const duration = Math.floor((endTime.getTime() - new Date(entry.startTime).getTime()) / 1000)
      
      await update(entryRef, {
        endTime: endTime.toISOString(),
        duration,
        isRunning: false,
        updatedAt: new Date().toISOString()
      })
    }
  },

  // Update a time entry
  async updateTimeEntry(entryId: string, updates: Partial<CreateTimeEntryData>): Promise<void> {
    const entryRef = ref(database, `timeEntries/${entryId}`)
    await update(entryRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
  },

  // Delete a time entry
  async deleteTimeEntry(entryId: string): Promise<void> {
    const entryRef = ref(database, `timeEntries/${entryId}`)
    await remove(entryRef)
  },

  // Get time summary for dashboard
  async getTimeSummary(userId: string): Promise<TimeSummary> {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(startOfDay)
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [todayEntries, weekEntries, monthEntries] = await Promise.all([
      this.getTimeEntriesByDateRange(userId, startOfDay, now),
      this.getTimeEntriesByDateRange(userId, startOfWeek, now),
      this.getTimeEntriesByDateRange(userId, startOfMonth, now)
    ])

    const calculateStats = (entries: TimeEntry[]) => {
      const total = entries.reduce((sum, entry) => sum + entry.duration, 0)
      const billable = entries
        .filter(entry => entry.isBillable)
        .reduce((sum, entry) => sum + entry.duration, 0)
      return { total, billable, entries: entries.length }
    }

    return {
      today: calculateStats(todayEntries),
      thisWeek: calculateStats(weekEntries),
      thisMonth: calculateStats(monthEntries)
    }
  },

  // Get time entries for a specific project
  async getTimeEntriesByProject(userId: string, projectId: string): Promise<TimeEntry[]> {
    const entries = await this.getTimeEntries(userId)
    return entries.filter(entry => entry.projectId === projectId)
  }
}

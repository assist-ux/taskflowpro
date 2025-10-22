import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Team } from '../types'
import { teamService } from '../services/teamService'
import { messagingService } from '../services/messagingService'
import { useAuth } from './AuthContext'

interface MessagingContextType {
  teams: Team[]
  activeTeam: Team | null
  setActiveTeam: (team: Team | null) => void
  loading: boolean
  unreadCounts: { [teamId: string]: number }
  markMessagesAsRead: (teamId: string) => Promise<void>
  refreshUnreadCounts: () => Promise<void>
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined)

export function useMessaging() {
  const context = useContext(MessagingContext)
  if (context === undefined) {
    throw new Error('useMessaging must be used within a MessagingProvider')
  }
  return context
}

interface MessagingProviderProps {
  children: ReactNode
}

export function MessagingProvider({ children }: MessagingProviderProps) {
  const [teams, setTeams] = useState<Team[]>([])
  const [activeTeam, setActiveTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [unreadCounts, setUnreadCounts] = useState<{ [teamId: string]: number }>({})
  const { currentUser } = useAuth()

  useEffect(() => {
    const loadTeams = async () => {
      if (!currentUser) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        // Get only teams that the current user belongs to
        const userTeams = await teamService.getUserTeams(currentUser.uid)
        setTeams(userTeams)
        
        // Set the first team as active if none is selected
        if (userTeams.length > 0 && !activeTeam) {
          setActiveTeam(userTeams[0])
        }
      } catch (error) {
        console.error('Error loading teams:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTeams()
  }, [currentUser])

  // Subscribe to unread message counts
  useEffect(() => {
    if (!currentUser || teams.length === 0) return

    const teamIds = teams.map(team => team.id)
    
    const unsubscribe = messagingService.subscribeToUnreadCounts(
      teamIds,
      currentUser.uid,
      (newUnreadCounts) => {
        setUnreadCounts(newUnreadCounts)
      }
    )

    return () => unsubscribe()
  }, [currentUser, teams])

  const markMessagesAsRead = async (teamId: string) => {
    if (!currentUser) return
    
    try {
      await messagingService.markMessagesAsRead(teamId, currentUser.uid)
      // Refresh unread counts after marking messages as read
      await refreshUnreadCounts()
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  const refreshUnreadCounts = async () => {
    if (!currentUser || teams.length === 0) return
    
    try {
      const teamIds = teams.map(team => team.id)
      const newUnreadCounts: { [teamId: string]: number } = {}
      
      // Get unread count for each team
      for (const teamId of teamIds) {
        const count = await messagingService.getUnreadMessageCount(teamId, currentUser.uid)
        newUnreadCounts[teamId] = count
      }
      
      setUnreadCounts(newUnreadCounts)
    } catch (error) {
      console.error('Error refreshing unread counts:', error)
    }
  }

  const value = {
    teams,
    activeTeam,
    setActiveTeam,
    loading,
    unreadCounts,
    markMessagesAsRead,
    refreshUnreadCounts
  }

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  )
}
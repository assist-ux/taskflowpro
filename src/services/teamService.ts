import { ref, set, get, push, remove, update, query, orderByChild, equalTo } from 'firebase/database'
import { database } from '../config/firebase'
import { 
  Team, 
  TeamMember, 
  CreateTeamData, 
  UpdateTeamData, 
  AddTeamMemberData, 
  TeamStats,
  TeamRole 
} from '../types'

export const teamService = {
  // Teams
  async createTeam(teamData: CreateTeamData, createdBy: string, leaderName: string, leaderEmail: string): Promise<string> {
    const teamRef = push(ref(database, 'teams'))
    const newTeam: Team = {
      ...teamData,
      id: teamRef.key!,
      leaderName,
      leaderEmail,
      isActive: true,
      memberCount: 1, // Leader is automatically a member
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    await set(teamRef, {
      ...newTeam,
      createdAt: newTeam.createdAt.toISOString(),
      updatedAt: newTeam.updatedAt.toISOString()
    })
    
    // Add the leader as a team member
    await this.addTeamMember(teamRef.key!, {
      userId: teamData.leaderId,
      role: 'leader'
    }, leaderName, leaderEmail)
    
    return teamRef.key!
  },

  async getTeams(): Promise<Team[]> {
    const teamsRef = ref(database, 'teams')
    const snapshot = await get(teamsRef)
    
    if (snapshot.exists()) {
      const teams = snapshot.val()
      return Object.values(teams)
        .map((team: any) => ({
          ...team,
          createdAt: new Date(team.createdAt),
          updatedAt: new Date(team.updatedAt)
        }))
        .filter((team: Team) => team.isActive)
        .sort((a: Team, b: Team) => b.createdAt.getTime() - a.createdAt.getTime())
    }
    
    return []
  },

  async getTeamById(teamId: string): Promise<Team | null> {
    const teamRef = ref(database, `teams/${teamId}`)
    const snapshot = await get(teamRef)
    
    if (snapshot.exists()) {
      const team = snapshot.val()
      return {
        ...team,
        createdAt: new Date(team.createdAt),
        updatedAt: new Date(team.updatedAt)
      }
    }
    
    return null
  },

  async updateTeam(teamId: string, updates: UpdateTeamData): Promise<void> {
    const teamRef = ref(database, `teams/${teamId}`)
    await update(teamRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
  },

  async deleteTeam(teamId: string): Promise<void> {
    const teamRef = ref(database, `teams/${teamId}`)
    await update(teamRef, {
      isActive: false,
      updatedAt: new Date().toISOString()
    })
  },

  // Team Members
  async addTeamMember(teamId: string, memberData: AddTeamMemberData, userName: string, userEmail: string): Promise<string> {
    const memberRef = push(ref(database, 'teamMembers'))
    const newMember: TeamMember = {
      ...memberData,
      id: memberRef.key!,
      teamId,
      userName,
      userEmail,
      teamRole: memberData.role,
      joinedAt: new Date(),
      isActive: true
    }
    
    await set(memberRef, {
      ...newMember,
      joinedAt: newMember.joinedAt.toISOString()
    })
    
    // Update user's team information
    const { userService } = await import('./userService')
    await userService.updateUserTeam(memberData.userId, teamId, memberData.role)
    
    // Update team member count
    await this.updateTeamMemberCount(teamId)
    
    return memberRef.key!
  },

  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    const membersRef = ref(database, 'teamMembers')
    const q = query(membersRef, orderByChild('teamId'), equalTo(teamId))
    const snapshot = await get(q)
    
    if (snapshot.exists()) {
      const members = snapshot.val()
      return Object.values(members)
        .map((member: any) => ({
          ...member,
          joinedAt: new Date(member.joinedAt)
        }))
        .filter((member: TeamMember) => member.isActive)
        .sort((a: TeamMember, b: TeamMember) => {
          // Leaders first, then by join date
          if (a.teamRole === 'leader' && b.teamRole !== 'leader') return -1
          if (b.teamRole === 'leader' && a.teamRole !== 'leader') return 1
          return a.joinedAt.getTime() - b.joinedAt.getTime()
        })
    }
    
    return []
  },

  async getUserTeams(userId: string): Promise<Team[]> {
    const membersRef = ref(database, 'teamMembers')
    const q = query(membersRef, orderByChild('userId'), equalTo(userId))
    const snapshot = await get(q)
    
    if (snapshot.exists()) {
      const members = snapshot.val()
      const teamIds = Object.values(members)
        .filter((member: any) => member.isActive)
        .map((member: any) => member.teamId)
      
      const teams = await Promise.all(
        teamIds.map(teamId => this.getTeamById(teamId))
      )
      
      return teams.filter(team => team !== null) as Team[]
    }
    
    return []
  },

  async removeTeamMember(teamId: string, userId: string): Promise<void> {
    const membersRef = ref(database, 'teamMembers')
    const q = query(membersRef, orderByChild('teamId'), equalTo(teamId))
    const snapshot = await get(q)
    
    if (snapshot.exists()) {
      const members = snapshot.val()
      const memberEntry = Object.entries(members).find(
        ([_, member]: [string, any]) => member.userId === userId && member.teamId === teamId
      )
      
      if (memberEntry) {
        const [memberId] = memberEntry
        const memberRef = ref(database, `teamMembers/${memberId}`)
        await update(memberRef, {
          isActive: false,
          leftAt: new Date().toISOString()
        })
        
        // Clear user's team information
        const { userService } = await import('./userService')
        await userService.updateUserTeam(userId, null, null)
        
        // Update team member count
        await this.updateTeamMemberCount(teamId)
      }
    }
  },

  async updateTeamMemberRole(teamId: string, userId: string, newRole: TeamRole): Promise<void> {
    const membersRef = ref(database, 'teamMembers')
    const q = query(membersRef, orderByChild('teamId'), equalTo(teamId))
    const snapshot = await get(q)
    
    if (snapshot.exists()) {
      const members = snapshot.val()
      const memberEntry = Object.entries(members).find(
        ([_, member]: [string, any]) => member.userId === userId && member.teamId === teamId
      )
      
      if (memberEntry) {
        const [memberId] = memberEntry
        const memberRef = ref(database, `teamMembers/${memberId}`)
        await update(memberRef, {
          teamRole: newRole
        })
        
        // Update user's team role
        const { userService } = await import('./userService')
        await userService.updateUserTeam(userId, teamId, newRole)
        
        // If promoting to leader, update team leader info
        if (newRole === 'leader') {
          const member = memberEntry[1] as any
          await this.updateTeam(teamId, {
            leaderId: userId,
            leaderName: member.userName,
            leaderEmail: member.userEmail
          })
        }
      }
    }
  },

  async updateTeamMemberCount(teamId: string): Promise<void> {
    const members = await this.getTeamMembers(teamId)
    const teamRef = ref(database, `teams/${teamId}`)
    await update(teamRef, {
      memberCount: members.length,
      updatedAt: new Date().toISOString()
    })
  },

  // Team Stats
  async getTeamStats(teamId: string): Promise<TeamStats> {
    const members = await this.getTeamMembers(teamId)
    const activeMembers = members.filter(member => member.isActive).length
    
    // Get tasks for all team members
    const { taskService } = await import('./taskService')
    const allTasks = await taskService.getTasks()
    const teamMemberIds = members.map(member => member.userId)
    const teamTasks = allTasks.filter(task => teamMemberIds.includes(task.createdBy))
    
    const totalTasks = teamTasks.length
    const completedTasks = teamTasks.filter(task => task.isCompleted).length
    const inProgressTasks = teamTasks.filter(task => 
      task.status && typeof task.status === 'object' && task.status.name === 'In Progress'
    ).length
    const overdueTasks = teamTasks.filter(task => 
      task.dueDate && new Date(task.dueDate) < new Date() && !task.isCompleted
    ).length
    
    // Calculate total time logged (this would need integration with time tracking)
    const totalTimeLogged = 0 // Placeholder - would need to integrate with timeEntryService
    
    const averageTaskCompletion = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
    
    return {
      totalMembers: members.length,
      activeMembers,
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      totalTimeLogged,
      averageTaskCompletion
    }
  },

  // Utility functions
  async isUserTeamLeader(userId: string, teamId: string): Promise<boolean> {
    const team = await this.getTeamById(teamId)
    return team?.leaderId === userId
  },

  async getUserTeamRole(userId: string, teamId: string): Promise<TeamRole | null> {
    const members = await this.getTeamMembers(teamId)
    const member = members.find(m => m.userId === userId)
    return member?.teamRole || null
  }
}

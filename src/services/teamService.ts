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

// Use the second TeamMember interface (the one with teamId, userId, etc.)
type TeamMemberData = {
  id: string
  teamId: string
  userId: string
  userName: string
  userEmail: string
  teamRole: TeamRole
  joinedAt: Date
  isActive: boolean
}

export const teamService = {
  // Teams
  async createTeam(teamData: CreateTeamData, createdBy: string, leaderName: string, leaderEmail: string, companyId?: string | null): Promise<string> {
    const teamRef = push(ref(database, 'teams'))
    const newTeam: Team = {
      ...teamData,
      id: teamRef.key!,
      leaderName,
      leaderEmail,
      companyId: companyId ?? null,
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

  // Get teams for specific company (multi-tenant safe)
  async getTeamsForCompany(companyId: string | null): Promise<Team[]> {
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
        .filter((team: Team) => {
          // Filter by company and active status
          return team.isActive && (team as any).companyId === companyId
        })
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
    const newMember: TeamMemberData = {
      id: memberRef.key!,
      teamId,
      userId: memberData.userId,
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
    try {
      const membersRef = ref(database, 'teamMembers')
      const q = query(membersRef, orderByChild('teamId'), equalTo(teamId))
      const snapshot = await get(q)
      
      if (snapshot.exists()) {
        const members = snapshot.val()
        console.log('Team members raw data:', members)
        const result = Object.values(members)
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
        console.log('Team members result:', result)
        return result
      }
      
      console.log('No team members found for teamId:', teamId)
      return []
    } catch (error) {
      console.error('Error getting team members:', error)
      return []
    }
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
            leaderId: userId
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
  async getTeamStats(teamId: string, startDate?: Date, endDate?: Date): Promise<TeamStats> {
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
    
    // Get time entries for all team members
    const { timeEntryService } = await import('./timeEntryService')
    const { projectService } = await import('./projectService')
    
    let timeEntries = []
    if (startDate && endDate) {
      timeEntries = await timeEntryService.getAllTimeEntriesByDateRange(startDate, endDate)
    } else {
      timeEntries = await timeEntryService.getAllTimeEntries()
    }
    
    // Filter time entries for team members only
    const teamTimeEntries = timeEntries.filter(entry => teamMemberIds.includes(entry.userId))
    
    // Calculate time statistics with proportional billable allocation
    const totalSeconds = teamTimeEntries.reduce((sum, entry) => sum + entry.duration, 0)
    const totalHours = totalSeconds / 3600
    
    // Calculate billable hours proportionally for each team member
    let totalBillableSeconds = 0
    
    // For each team member, calculate their proportional billable contribution
    for (const memberId of teamMemberIds) {
      // Get all time entries for this member (across all teams)
      const memberAllEntries = timeEntries.filter(entry => entry.userId === memberId)
      const memberTeamEntries = teamTimeEntries.filter(entry => entry.userId === memberId)
      
      if (memberAllEntries.length > 0 && memberTeamEntries.length > 0) {
        // Calculate member's total billable time across all teams
        const memberTotalBillableSeconds = memberAllEntries
          .filter(entry => entry.isBillable)
          .reduce((sum, entry) => sum + entry.duration, 0)
        
        // Calculate member's total time across all teams
        const memberTotalSeconds = memberAllEntries.reduce((sum, entry) => sum + entry.duration, 0)
        
        // Calculate member's time for this specific team
        const memberTeamSeconds = memberTeamEntries.reduce((sum, entry) => sum + entry.duration, 0)
        
        // Calculate proportional billable time for this team
        // Formula: (member's team hours / member's total hours) * member's total billable hours
        if (memberTotalSeconds > 0) {
          const proportionalBillableSeconds = (memberTeamSeconds / memberTotalSeconds) * memberTotalBillableSeconds
          totalBillableSeconds += proportionalBillableSeconds
        }
      }
    }
    
    const billableHours = totalBillableSeconds / 3600
    const nonBillableHours = totalHours - billableHours
    const totalTimeEntries = teamTimeEntries.length
    
    // Debug logging to identify billable hours calculation issue
    console.log('Debug Team Stats Calculation (Fixed):', {
      teamId,
      teamMemberIds,
      totalTimeEntries: teamTimeEntries.length,
      allTimeEntries: timeEntries.length,
      totalSeconds,
      totalHours,
      totalBillableSeconds,
      billableHours,
      nonBillableHours,
      memberBreakdown: teamMemberIds.map(memberId => {
        const memberAllEntries = timeEntries.filter(entry => entry.userId === memberId)
        const memberTeamEntries = teamTimeEntries.filter(entry => entry.userId === memberId)
        const memberTotalBillableSeconds = memberAllEntries.filter(entry => entry.isBillable).reduce((sum, entry) => sum + entry.duration, 0)
        const memberTotalSeconds = memberAllEntries.reduce((sum, entry) => sum + entry.duration, 0)
        const memberTeamSeconds = memberTeamEntries.reduce((sum, entry) => sum + entry.duration, 0)
        const proportionalBillableSeconds = memberTotalSeconds > 0 ? (memberTeamSeconds / memberTotalSeconds) * memberTotalBillableSeconds : 0
        
        return {
          memberId,
          memberTotalHours: memberTotalSeconds / 3600,
          memberTeamHours: memberTeamSeconds / 3600,
          memberTotalBillableHours: memberTotalBillableSeconds / 3600,
          proportionalBillableHours: proportionalBillableSeconds / 3600
        }
      })
    })
    
    // Calculate average hours per member
    const averageHoursPerMember = activeMembers > 0 ? totalHours / activeMembers : 0
    
    // Find most active member
    const memberHours: { [userId: string]: { userName: string; hours: number } } = {}
    teamTimeEntries.forEach(entry => {
      const member = members.find(m => m.userId === entry.userId)
      if (member) {
        if (!memberHours[entry.userId]) {
          memberHours[entry.userId] = { userName: member.userName, hours: 0 }
        }
        memberHours[entry.userId].hours += entry.duration / 3600
      }
    })
    
    const mostActiveMember = Object.entries(memberHours)
      .sort(([,a], [,b]) => b.hours - a.hours)[0]
    
    // Get time by project
    const projectTime: { [projectId: string]: { projectName: string; hours: number } } = {}
    teamTimeEntries.forEach(entry => {
      if (entry.projectId) {
        if (!projectTime[entry.projectId]) {
          projectTime[entry.projectId] = { projectName: entry.projectName || 'Unknown Project', hours: 0 }
        }
        projectTime[entry.projectId].hours += entry.duration / 3600
      }
    })
    
    const timeByProject = Object.entries(projectTime)
      .map(([projectId, data]) => ({
        projectId,
        projectName: data.projectName,
        hours: data.hours,
        percentage: totalHours > 0 ? (data.hours / totalHours) * 100 : 0
      }))
      .sort((a, b) => b.hours - a.hours)
    
    const averageTaskCompletion = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
    
    return {
      totalMembers: members.length,
      activeMembers,
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      totalTimeLogged: totalSeconds, // Keep for backward compatibility
      averageTaskCompletion,
      // New time tracking data
      totalHours,
      billableHours,
      nonBillableHours,
      totalTimeEntries,
      averageHoursPerMember,
      mostActiveMember: mostActiveMember ? {
        userId: mostActiveMember[0],
        userName: mostActiveMember[1].userName,
        hours: mostActiveMember[1].hours
      } : undefined,
      timeByProject
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
  },

  // Test function to debug team-based mentioning
  async testMentioningFunctionality(projectId: string, currentUserId: string): Promise<void> {
    console.log('=== Testing Mentioning Functionality ===')
    console.log('Project ID:', projectId)
    console.log('Current User ID:', currentUserId)
    
    try {
      // Get project
      const { projectService } = await import('./projectService')
      const project = await projectService.getProjectById(projectId)
      console.log('Project:', project)
      
      // Get current user
      const { userService } = await import('./userService')
      const currentUser = await userService.getUserById(currentUserId)
      console.log('Current User:', currentUser)
      
      // Get mentionable users
      const mentionableUsers = await this.getMentionableUsers(projectId, currentUserId)
      console.log('Mentionable Users:', mentionableUsers)
      
      console.log('=== End Testing Mentioning Functionality ===')
    } catch (error) {
      console.error('Error in testMentioningFunctionality:', error)
    }
  },

  // Get users who can be mentioned in a specific project context
  async getMentionableUsers(projectId: string, currentUserId: string): Promise<any[]> {
    try {
      // Get all users first
      const { userService } = await import('./userService');
      const allUsers = await userService.getAllUsers();
      
      // Get the project to determine which company it belongs to
      const { projectService } = await import('./projectService');
      const project = await projectService.getProjectById(projectId);
      
      // If no project found, return empty array
      if (!project) {
        console.log('No project found for ID:', projectId);
        return [];
      }
      
      // Get the current user to determine their team
      const currentUser = await userService.getUserById(currentUserId);
      if (!currentUser) {
        console.log('No current user found for ID:', currentUserId);
        return [];
      }
      
      console.log('Current user:', currentUser);
      
      // If user has a team, get team members
      let mentionableUsers = [];
      if (currentUser.teamId) {
        console.log('User has team ID:', currentUser.teamId);
        // Get all members of the current user's team
        const teamMembers = await this.getTeamMembers(currentUser.teamId);
        console.log('Team members:', teamMembers);
        
        // Filter users to only include team members (excluding the current user)
        mentionableUsers = allUsers
          .filter(user => {
            const isNotCurrentUser = user.id !== currentUserId;
            const isActive = user.isActive;
            const isTeamMember = teamMembers.some(member => member.userId === user.id);
            console.log(`User ${user.name}: notCurrent=${isNotCurrentUser}, active=${isActive}, teamMember=${isTeamMember}`);
            return isNotCurrentUser && isActive && isTeamMember;
          })
          .map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          }));
        console.log('Mentionable users (team-based):', mentionableUsers);
      } else {
        console.log('User has no team, falling back to company-based filtering');
        // If user has no team, fall back to company-based filtering
        const projectCompanyId = (project as any).companyId;
        mentionableUsers = allUsers
          .filter(user => 
            user.id !== currentUserId &&
            user.isActive &&
            user.companyId === projectCompanyId
          )
          .map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          }));
        console.log('Mentionable users (company-based):', mentionableUsers);
      }
      
      return mentionableUsers;
    } catch (error) {
      console.error('Error getting mentionable users:', error);
      return [];
    }
  }
}

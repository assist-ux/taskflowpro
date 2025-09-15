import { ref, get, query, orderByChild, equalTo, update } from 'firebase/database'
import { database } from '../config/firebase'
import { User } from '../types'

export const userService = {
  // Get all users (for admin/team leader use)
  async getAllUsers(): Promise<User[]> {
    const usersRef = ref(database, 'users')
    const snapshot = await get(usersRef)
    
    if (snapshot.exists()) {
      const users = snapshot.val()
      return Object.entries(users)
        .map(([id, user]: [string, any]) => ({
          ...user,
          id: user.uid || id, // Use uid if available, otherwise use the key
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt)
        }))
        .filter((user: User) => user.isActive)
        .sort((a: User, b: User) => a.name.localeCompare(b.name))
    }
    
    return []
  },

  // Get users not in a specific team
  async getUsersNotInTeam(teamId: string): Promise<User[]> {
    const { teamService } = await import('./teamService')
    const allUsers = await this.getAllUsers()
    const teamMembers = await teamService.getTeamMembers(teamId)
    const teamMemberIds = teamMembers.map(member => member.userId)
    
    
    return allUsers.filter(user => !teamMemberIds.includes(user.id))
  },

  // Get user by ID
  async getUserById(userId: string): Promise<User | null> {
    const userRef = ref(database, `users/${userId}`)
    const snapshot = await get(userRef)
    
    if (snapshot.exists()) {
      const user = snapshot.val()
      return {
        ...user,
        id: user.uid || userId, // Use uid if available, otherwise use the userId parameter
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt)
      }
    }
    
    return null
  },

  // Get users by role
  async getUsersByRole(role: 'employee' | 'admin'): Promise<User[]> {
    const usersRef = ref(database, 'users')
    const q = query(usersRef, orderByChild('role'), equalTo(role))
    const snapshot = await get(q)
    
    if (snapshot.exists()) {
      const users = snapshot.val()
      return Object.entries(users)
        .map(([id, user]: [string, any]) => ({
          ...user,
          id: user.uid || id, // Use uid if available, otherwise use the key
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt)
        }))
        .filter((user: User) => user.isActive)
        .sort((a: User, b: User) => a.name.localeCompare(b.name))
    }
    
    return []
  },

  // Update user team information
  async updateUserTeam(userId: string, teamId: string | null, teamRole: 'member' | 'leader' | null): Promise<void> {
    const userRef = ref(database, `users/${userId}`)
    await update(userRef, {
      teamId,
      teamRole,
      updatedAt: new Date().toISOString()
    })
  },

  // Update user information
  async updateUser(userId: string, updates: Partial<Pick<User, 'name' | 'email' | 'role' | 'isActive'>>): Promise<void> {
    const userRef = ref(database, `users/${userId}`)
    await update(userRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
  }
}

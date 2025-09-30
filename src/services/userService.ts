import { createUserWithEmailAndPassword, signInWithEmailAndPassword, User as FirebaseUser } from 'firebase/auth'
import { ref, get, update, set, query, orderByChild, equalTo, onValue, push } from 'firebase/database'
import { database, auth } from '../config/firebase'
import { User, UserRole } from '../types'

export const userService = {
  // Get all users (for admin/team leader use) - with multi-tenant filtering
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

  // Get users for current company (multi-tenant safe)
  async getUsersForCompany(companyId: string | null): Promise<User[]> {
    const usersRef = ref(database, 'users')
    const snapshot = await get(usersRef)
    
    if (snapshot.exists()) {
      const users = snapshot.val()
      return Object.entries(users)
        .map(([id, user]: [string, any]) => ({
          ...user,
          id: user.uid || id,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt)
        }))
        .filter((user: User) => {
          // Filter by company and active status
          return user.isActive && user.companyId === companyId
        })
        .sort((a: User, b: User) => a.name.localeCompare(b.name))
    }
    
    return []
  },

  // Get users not in a specific team (company-scoped)
  async getUsersNotInTeam(teamId: string, companyId?: string | null): Promise<User[]> {
    const { teamService } = await import('./teamService')
    
    // Use company-scoped users if companyId is provided, otherwise fall back to all users
    const allUsers = companyId !== undefined 
      ? await this.getUsersForCompany(companyId)
      : await this.getAllUsers()
      
    const teamMembers = await teamService.getTeamMembers(teamId)
    const teamMemberIds = teamMembers.map(member => member.userId)
    
    return allUsers.filter(user => !teamMemberIds.includes(user.id))
  },

  // Get user by ID
  async getUserById(userId: string): Promise<User | null> {
    try {
      const userRef = ref(database, `users/${userId}`)
      const snapshot = await get(userRef)
      
      if (snapshot.exists()) {
        const user = snapshot.val()
        console.log('User data for ID', userId, ':', user)
        return {
          ...user,
          id: user.uid || userId, // Use uid if available, otherwise use the userId parameter
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt)
        }
      }
      
      console.log('No user found for ID:', userId)
      return null
    } catch (error) {
      console.error('Error getting user by ID:', error)
      return null
    }
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
  },

  // Create user (for admin/HR use) - with session preservation
  async createUser(userData: {
    name: string
    email: string
    password: string
    role: UserRole
    hourlyRate?: number
    timezone: string
    companyId?: string | null
  }): Promise<User> {
    try {
      // Store current admin session data
      const currentUser = auth.currentUser
      if (!currentUser) {
        throw new Error('Admin must be logged in to create users')
      }

      // Store admin info to restore session
      const adminUID = currentUser.uid
      const adminEmail = currentUser.email
      
      // Generate unique app name for this operation to prevent conflicts
      const operationId = `secondary-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Create a secondary Firebase app instance for user creation
      // This prevents the main auth instance from being affected
      const { initializeApp, getApps, deleteApp } = await import('firebase/app')
      const { getAuth, createUserWithEmailAndPassword: createUserSecondary, signOut: signOutSecondary } = await import('firebase/auth')
      
      // Firebase config for secondary app
      const firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
        measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
      }
      
      // Create unique secondary app for this operation
      const secondaryApp = initializeApp(firebaseConfig, operationId)
      const secondaryAuth = getAuth(secondaryApp)
      
      let firebaseUser: any
      
      try {
        // Create user with secondary auth instance
        const userCredential = await createUserSecondary(secondaryAuth, userData.email, userData.password)
        firebaseUser = userCredential.user

        // Immediately sign out from secondary auth to prevent session interference
        await signOutSecondary(secondaryAuth)
      } finally {
        // Always clean up the secondary app to prevent memory leaks
        try {
          await deleteApp(secondaryApp)
        } catch (cleanupError) {
          console.warn('Failed to cleanup secondary app:', cleanupError)
        }
      }

      // Create user profile in database using the main database instance
      const userRef = ref(database, `users/${firebaseUser.uid}`)
      const newUser: User = {
        id: firebaseUser.uid,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        companyId: userData.companyId ?? null,
        teamId: null,
        teamRole: null,
        avatar: null,
        timezone: userData.timezone,
        hourlyRate: userData.hourlyRate || 25,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Remove undefined values before saving to Firebase
      const userDataToSave: any = {
        ...newUser,
        createdAt: newUser.createdAt.toISOString(),
        updatedAt: newUser.updatedAt.toISOString()
      }
      
      // Remove any undefined properties
      Object.keys(userDataToSave).forEach(key => {
        if (userDataToSave[key] === undefined) {
          delete userDataToSave[key]
        }
      })

      await set(userRef, userDataToSave)

      // Verify admin session is still intact
      if (auth.currentUser?.uid !== adminUID) {
        console.warn('Admin session was affected during user creation')
        // Force refresh the auth state to restore the session
        await auth.currentUser?.reload()
      }

      console.log('User created successfully. Admin session preserved.', {
        adminUID,
        newUserUID: firebaseUser.uid,
        currentSessionUID: auth.currentUser?.uid
      })
      return newUser
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  }
}

// Add real-time listener for users
Object.assign(userService, {
  // Subscribe to all users (for admin use)
  subscribeToAllUsers(callback: (users: User[]) => void): () => void {
    const usersRef = ref(database, 'users')
    
    const unsubscribe = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const users = snapshot.val()
        const formattedUsers = Object.entries(users)
          .map(([id, user]: [string, any]) => ({
            ...user,
            id: user.uid || id,
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt)
          }))
          .filter((user: User) => user.isActive)
          .sort((a: User, b: User) => a.name.localeCompare(b.name))
        
        callback(formattedUsers)
      } else {
        callback([])
      }
    })
    
    return unsubscribe
  }
})

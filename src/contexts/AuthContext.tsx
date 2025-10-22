import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import { ref, set, get } from 'firebase/database'
import { auth, database } from '../config/firebase'
import { AuthUser, LoginCredentials, SignupCredentials } from '../types'
import { loggingService } from '../services/loggingService'

interface AuthContextType {
  currentUser: AuthUser | null
  loading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  signup: (credentials: SignupCredentials) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  async function signup(credentials: SignupCredentials) {
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      )

      const user = userCredential.user

      // Create user profile in Realtime Database
      const userProfile = {
        uid: user.uid,
        name: credentials.name,
        email: credentials.email,
        role: credentials.role,
        companyId: credentials.role === 'root' ? null : undefined, // Root doesn't belong to any company
        teamId: null,
        teamRole: null,
        timezone: 'GMT+0 (Greenwich Mean Time)',
        hourlyRate: credentials.role === 'admin' || credentials.role === 'root' ? 0 : 25, // Default rates
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await set(ref(database, `users/${user.uid}`), userProfile)

      // Set current user
      setCurrentUser({
        uid: user.uid,
        email: credentials.email,
        role: credentials.role,
        name: credentials.name,
        companyId: credentials.role === 'root' ? null : undefined,
        teamId: null,
        teamRole: null
      })
      
      // Log successful signup
      await loggingService.logAuthEvent('signup', user.uid, credentials.name, true)
    } catch (error) {
      console.error('Error during signup:', error)
      // Log failed signup attempt
      await loggingService.logAuthEvent('signup', credentials.email, 'Unknown', false, { error: (error as Error).message })
      throw error
    }
  }

  async function login(credentials: LoginCredentials) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      )

      const user = userCredential.user

      // Get user profile from database
      const userRef = ref(database, `users/${user.uid}`)
      const snapshot = await get(userRef)

      if (snapshot.exists()) {
        const userData = snapshot.val()
        setCurrentUser({
          uid: user.uid,
          email: userData.email,
          role: userData.role,
          name: userData.name,
          companyId: userData.companyId || null,
          teamId: userData.teamId || null,
          teamRole: userData.teamRole || null
        })
        
        // Log successful login
        await loggingService.logAuthEvent('login', user.uid, userData.name, true)
      } else {
        throw new Error('User profile not found')
      }
    } catch (error) {
      console.error('Error during login:', error)
      // Log failed login attempt
      await loggingService.logAuthEvent('login', credentials.email, 'Unknown', false, { error: (error as Error).message })
      throw error
    }
  }

  async function logout() {
    try {
      const userId = currentUser?.uid
      const userName = currentUser?.name
      
      await signOut(auth)
      setCurrentUser(null)
      
      // Log successful logout
      if (userId && userName) {
        await loggingService.logAuthEvent('logout', userId, userName, true)
      }
    } catch (error) {
      console.error('Error during logout:', error)
      throw error
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      if (user) {
        try {
          // Get user profile from database
          const userRef = ref(database, `users/${user.uid}`)
          const snapshot = await get(userRef)

          if (snapshot.exists()) {
            const userData = snapshot.val()
            setCurrentUser({
              uid: user.uid,
              email: userData.email,
              role: userData.role,
              name: userData.name,
              companyId: userData.companyId || null,
              teamId: userData.teamId || null,
              teamRole: userData.teamRole || null
            })
          }
        } catch (error) {
          console.error('Error fetching user profile:', error)
        }
      } else {
        setCurrentUser(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    currentUser,
    loading,
    login,
    signup,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

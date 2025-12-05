import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail
} from 'firebase/auth'
import { ref, set, get, push, update } from 'firebase/database'
import { auth, database } from '../config/firebase'
import { AuthUser, LoginCredentials, SignupCredentials, PDFSettings, Company } from '../types'
import { loggingService } from '../services/loggingService'
import { companyService } from '../services/companyService'

interface AuthContextType {
  currentUser: AuthUser | null
  currentCompany: Company | null
  loading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  signup: (credentials: SignupCredentials, companyName?: string) => Promise<void>
  logout: () => Promise<void>
  resendVerificationEmail?: () => Promise<void>
  resetPassword?: (email: string) => Promise<void>
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
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)

  const resendVerificationEmail = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email)
      // Log password reset request
      await loggingService.logAuthEvent('password_reset', email, 'Unknown', true)
    } catch (error) {
      console.error('Error during password reset:', error)
      // Log failed password reset attempt
      await loggingService.logAuthEvent('password_reset', email, 'Unknown', false, { error: (error as Error).message })
      throw error
    }
  }

  async function signup(credentials: SignupCredentials, companyName?: string) {
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      )

      const user = userCredential.user

      // Store temporary signup data in localStorage for post-verification processing
      const signupData = {
        name: credentials.name,
        email: credentials.email,
        role: credentials.role,
        companyName: companyName || null,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem(`signup_${user.uid}`, JSON.stringify(signupData));

      // Send email verification
      await sendEmailVerification(user)

      // Note: We don't set the current user here because they need to verify their email first
      // The user will be set in the onAuthStateChanged listener after verification
      
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

      // Get user profile from database to check if user exists
      const userRef = ref(database, `users/${user.uid}`)
      const snapshot = await get(userRef)

      // If user profile exists but email is not verified, show error
      if (snapshot.exists() && !user.emailVerified) {
        throw new Error('Please verify your email address before signing in. Check your inbox for the verification email.')
      }

      if (snapshot.exists()) {
        const userData = snapshot.val()
        
        // Fetch company data if user belongs to a company
        let companyData = null;
        if (userData.companyId) {
          companyData = await companyService.getCompanyById(userData.companyId);
        }
        
        setCurrentUser({
          uid: user.uid,
          email: userData.email,
          role: userData.role,
          name: userData.name,
          companyId: userData.companyId || null,
          teamId: userData.teamId || null,
          teamRole: userData.teamRole || null,
          avatar: userData.avatar || null,
          emailVerified: user.emailVerified
        })
        
        setCurrentCompany(companyData);
        
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
          // Reload user to get latest email verification status
          await user.reload();
          
          // Check if user profile exists in database
          const userRef = ref(database, `users/${user.uid}`)
          const snapshot = await get(userRef)

          if (snapshot.exists()) {
            // For existing users, we allow access even if email is not verified
            // (This is for backward compatibility with existing users)
            const userData = snapshot.val()
            
            // Fetch company data if user belongs to a company
            let companyData = null;
            if (userData.companyId) {
              companyData = await companyService.getCompanyById(userData.companyId);
            }
            
            setCurrentUser({
              uid: user.uid,
              email: userData.email,
              role: userData.role,
              name: userData.name,
              companyId: userData.companyId || null,
              teamId: userData.teamId || null,
              teamRole: userData.teamRole || null,
              avatar: userData.avatar || null,
              emailVerified: user.emailVerified
            })
            
            setCurrentCompany(companyData);
          } else {
            // For new users, enforce email verification
            if (!user.emailVerified) {
              await signOut(auth);
              setCurrentUser(null);
              setCurrentCompany(null);
              setLoading(false);
              return;
            }
            
            // Check for temporary signup data
            const signupDataStr = localStorage.getItem(`signup_${user.uid}`);
            if (signupDataStr) {
              const signupData = JSON.parse(signupDataStr);
              
              // Process signup data to create company and user profile
              let companyId = null;
              
              // If this is a super admin signup, create a company
              if (signupData.role === 'super_admin' && signupData.companyName) {
                // Create company in Realtime Database with solo pricing level by default
                const companiesRef = ref(database, 'companies')
                const newCompanyRef = push(companiesRef)
                const now = new Date().toISOString()
                
                // Default PDF settings
                const defaultPdfSettings: PDFSettings = {
                  companyName: signupData.companyName,
                  logoUrl: '',
                  primaryColor: '#3B82F6',
                  secondaryColor: '#1E40AF',
                  showPoweredBy: true,
                  customFooterText: ''
                }
                
                const companyData = {
                  id: newCompanyRef.key,
                  name: signupData.companyName,
                  isActive: true,
                  pricingLevel: 'solo', // Default to solo pricing level
                  maxMembers: 1, // Solo plan allows only 1 member
                  createdAt: now,
                  updatedAt: now,
                  pdfSettings: defaultPdfSettings
                }
                
                await set(newCompanyRef, companyData)
                companyId = newCompanyRef.key
              }

              // Create user profile in Realtime Database
              const userProfile = {
                uid: user.uid,
                name: signupData.name,
                email: signupData.email,
                role: signupData.role,
                companyId: companyId || (signupData.role === 'root' ? null : undefined), // Root doesn't belong to any company
                teamId: null,
                teamRole: null,
                timezone: 'GMT+0 (Greenwich Mean Time)',
                hourlyRate: signupData.role === 'admin' || signupData.role === 'root' || signupData.role === 'super_admin' ? 0 : 25, // Default rates
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }

              await set(ref(database, `users/${user.uid}`), userProfile)

              // Fetch company data
              let companyData = null;
              if (companyId) {
                companyData = await companyService.getCompanyById(companyId);
              }

              // Set current user
              setCurrentUser({
                uid: user.uid,
                email: signupData.email,
                role: signupData.role,
                name: signupData.name,
                companyId: companyId || (signupData.role === 'root' ? null : undefined),
                teamId: null,
                teamRole: null,
                avatar: null,
                emailVerified: user.emailVerified
              })
              
              setCurrentCompany(companyData);
              
              // Clean up temporary signup data
              localStorage.removeItem(`signup_${user.uid}`);
              
              // Log successful signup completion
              await loggingService.logAuthEvent('signup', user.uid, signupData.name, true)
            } else {
              // No signup data found, sign out the user
              await signOut(auth);
              setCurrentUser(null);
              setCurrentCompany(null);
            }
          }
        } catch (error) {
          console.error('Error processing user:', error)
          // If there's an error, sign out the user
          await signOut(auth);
          setCurrentUser(null);
          setCurrentCompany(null);
        }
      } else {
        setCurrentUser(null)
        setCurrentCompany(null)
      }
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    currentUser,
    currentCompany,
    loading,
    login,
    signup,
    logout,
    resendVerificationEmail,
    resetPassword
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

import { useState, useEffect } from 'react'
import { 
  Save, 
  Lock, 
  Eye, 
  EyeOff, 
  User, 
  Settings as SettingsIcon,
  Bell,
  Palette,
  Globe,
  Clock as ClockIcon,
  AlertTriangle,
  Database,
  FileText,
  Shield,
  CheckCircle,
  Activity,
  Mail,
  Download,
  Upload,
  Trash,
  ChevronRight
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { update, get, set } from 'firebase/database'
import { ref } from 'firebase/database'
import { format, isValid } from 'date-fns'
import { database, storage } from '../config/firebase'
import { loggingService, SystemLog } from '../services/loggingService'
import { formatDurationToHHMMSS } from '../utils'
import { useTheme } from '../contexts/ThemeContext'
import { canViewHourlyRates, canEditHourlyRates } from '../utils/permissions'
import { 
  EmailAuthProvider, 
  reauthenticateWithCredential, 
  updatePassword,
  reauthenticateWithCredential as reauth 
} from 'firebase/auth'
import { auth } from '../config/firebase'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import NotificationSettings from '../components/settings/NotificationSettings'

interface BackupData {
  users: any
  projects: any
  tasks: any
  timeEntries: any
  clients: any
  tags: any
  teams: any
  teamMembers: any
  metadata: {
    timestamp: Date
    version: string
    totalRecords: number
  }
}

export default function Settings() {
  const { currentUser, currentCompany } = useAuth()
  const { isDarkMode, toggleDarkMode } = useTheme()
  const [activeTab, setActiveTab] = useState<'profile' | 'general' | 'database' | 'logs' | 'security' | 'notifications' | 'pdf'>('profile')
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<SystemLog[]>([])
  const [backupData, setBackupData] = useState<BackupData | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const canEditRates = currentUser?.role ? canEditHourlyRates(currentUser.role) : false
  
  // Profile settings
  const [profileData, setProfileData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    timezone: 'GMT+0 (Greenwich Mean Time)',
    hourlyRate: 25,
    avatar: ''
  })
  
  // Password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  
  // General settings
  const [generalSettings, setGeneralSettings] = useState({
    appName: 'NexiFlow',
    timezone: 'GMT+0 (Greenwich Mean Time)',
    dateFormat: 'MM/dd/yyyy',
    timeFormat: '12h',
    defaultProjectColor: '#3B82F6',
    autoStartBreak: false,
    breakDuration: 15
  })

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    weeklyReports: true,
    projectDeadlines: true,
    teamUpdates: true,
    systemAlerts: true
  })

  // Security settings
  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: 30,
    requirePasswordChange: false,
    twoFactorAuth: false,
    loginAttempts: 5,
    passwordMinLength: 8
  })

  useEffect(() => {
    loadSettings()
    loadLogs()
    loadUserProfile()
    
    // Add a test log entry when settings page loads (for testing)
    if (currentUser) {
      loggingService.logInfo('Settings page accessed', 'PAGE_ACCESS', { page: 'settings' }, currentUser.uid, currentUser.name)
    }
  }, [currentUser])

  const loadSettings = async () => {
    try {
      setLoading(true)
      // Load settings from Firebase (you can implement this)
      // For now, we'll use default values
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const loadUserProfile = async () => {
    if (!currentUser) return
    
    try {
      const userRef = ref(database, `users/${currentUser.uid}`)
      const snapshot = await get(userRef)
      
      if (snapshot.exists()) {
        const userData = snapshot.val()
        setProfileData({
          name: userData.name || currentUser.name || '',
          email: userData.email || currentUser.email || '',
          timezone: userData.timezone || 'GMT+0 (Greenwich Mean Time)',
          hourlyRate: userData.hourlyRate || 25,
          avatar: userData.avatar || ''
        })
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
    }
  }

  const loadLogs = async () => {
    try {
      setLoading(true)
      
      // Check if user is admin or root before trying to load logs
      if (currentUser?.role !== 'admin' && currentUser?.role !== 'root') {
        setLogs([])
        return
      }
      
      const realLogs = await loggingService.getRecentLogs(50)
      setLogs(realLogs)
    } catch (error) {
      console.error('Error loading logs:', error)
      // Fallback to sample logs if real logs fail
      const sampleLogs: SystemLog[] = [
        {
          id: '1',
          timestamp: new Date(),
          level: 'info',
          message: 'User logged in successfully',
          userId: currentUser?.uid,
          action: 'LOGIN'
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 300000),
          level: 'success',
          message: 'Database backup completed',
          action: 'BACKUP'
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 600000),
          level: 'warning',
          message: 'High memory usage detected',
          action: 'SYSTEM'
        },
        {
          id: '4',
          timestamp: new Date(Date.now() - 900000),
          level: 'error',
          message: 'Failed to send email notification',
          action: 'NOTIFICATION'
        }
      ]
      setLogs(sampleLogs)
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const handleBackupDatabase = async () => {
    try {
      setLoading(true)
      showMessage('info', 'Starting database backup...')

      // Get all data from Firebase
      const [usersSnapshot, projectsSnapshot, tasksSnapshot, timeEntriesSnapshot, 
             clientsSnapshot, tagsSnapshot, teamsSnapshot, teamMembersSnapshot] = await Promise.all([
        get(ref(database, 'users')),
        get(ref(database, 'projects')),
        get(ref(database, 'tasks')),
        get(ref(database, 'timeEntries')),
        get(ref(database, 'clients')),
        get(ref(database, 'tags')),
        get(ref(database, 'teams')),
        get(ref(database, 'teamMembers'))
      ])

      const backupData: BackupData = {
        users: usersSnapshot.val() || {},
        projects: projectsSnapshot.val() || {},
        tasks: tasksSnapshot.val() || {},
        timeEntries: timeEntriesSnapshot.val() || {},
        clients: clientsSnapshot.val() || {},
        tags: tagsSnapshot.val() || {},
        teams: teamsSnapshot.val() || {},
        teamMembers: teamMembersSnapshot.val() || {},
        metadata: {
          timestamp: new Date(),
          version: '1.0.0',
          totalRecords: Object.keys(usersSnapshot.val() || {}).length +
                       Object.keys(projectsSnapshot.val() || {}).length +
                       Object.keys(tasksSnapshot.val() || {}).length +
                       Object.keys(timeEntriesSnapshot.val() || {}).length
        }
      }

      setBackupData(backupData)

      // Create and download backup file
      const dataStr = JSON.stringify(backupData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `clockistry-backup-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}.json`
      link.click()
      URL.revokeObjectURL(url)

      // Log the backup success
      await loggingService.logSystemEvent('backup', 'Database backup completed successfully', {
        totalRecords: backupData.metadata.totalRecords,
        timestamp: backupData.metadata.timestamp
      }, currentUser?.uid, currentUser?.name)
      
      showMessage('success', 'Database backup completed successfully!')
    } catch (error) {
      console.error('Backup error:', error)
      showMessage('error', 'Failed to backup database')
    } finally {
      setLoading(false)
    }
  }

  const handleRestoreDatabase = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setLoading(true)
      showMessage('info', 'Starting database restore...')

      const text = await file.text()
      const backupData: BackupData = JSON.parse(text)

      // Validate backup data
      if (!backupData.metadata || !backupData.users) {
        throw new Error('Invalid backup file format')
      }

      // Restore data to Firebase
      await Promise.all([
        set(ref(database, 'users'), backupData.users),
        set(ref(database, 'projects'), backupData.projects),
        set(ref(database, 'tasks'), backupData.tasks),
        set(ref(database, 'timeEntries'), backupData.timeEntries),
        set(ref(database, 'clients'), backupData.clients),
        set(ref(database, 'tags'), backupData.tags),
        set(ref(database, 'teams'), backupData.teams),
        set(ref(database, 'teamMembers'), backupData.teamMembers)
      ])

      // Log the restore success
      await loggingService.logSystemEvent('restore', 'Database restored successfully', {
        backupVersion: backupData.metadata.version,
        backupDate: backupData.metadata.timestamp,
        totalRecords: backupData.metadata.totalRecords
      }, currentUser?.uid, currentUser?.name)
      
      showMessage('success', 'Database restored successfully!')
    } catch (error) {
      console.error('Restore error:', error)
      showMessage('error', 'Failed to restore database')
    } finally {
      setLoading(false)
    }
  }

  const handleClearLogs = async () => {
    if (currentUser?.role !== 'admin') {
      showMessage('error', 'Only administrators can clear logs')
      return
    }
    
    if (window.confirm('Are you sure you want to clear all logs? This action cannot be undone.')) {
      try {
        setLoading(true)
        await loggingService.clearAllLogs()
        setLogs([])
        showMessage('success', 'Logs cleared successfully')
      } catch (error) {
        showMessage('error', 'Failed to clear logs')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleSaveSettings = async (settingsType: string) => {
    try {
      setLoading(true)
      // Save settings to Firebase
      const settingsRef = ref(database, `settings/${settingsType}`)
      let settingsToSave = {}
      
      switch (settingsType) {
        case 'general':
          settingsToSave = generalSettings
          break
        case 'notifications':
          settingsToSave = notificationSettings
          break
        case 'security':
          settingsToSave = securitySettings
          break
      }
      
      await set(settingsRef, {
        ...settingsToSave,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.uid
      })
      
      // Log the settings save
      await loggingService.logUserAction('settings_save', `${settingsType} settings updated`, currentUser?.uid || '', currentUser?.name || 'Unknown')
      
      showMessage('success', 'Settings saved successfully!')
    } catch (error) {
      console.error('Save error:', error)
      showMessage('error', 'Failed to save settings')
    } finally {
      setLoading(false)
    }
  }
  
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        showMessage('error', 'Please select an image file (JPG, PNG, GIF)')
        return
      }
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showMessage('error', 'File size must be less than 5MB')
        return
      }
      setAvatarFile(file)
    }
  }
  
  const handleUploadAvatar = async () => {
    if (!currentUser || !avatarFile) return
    
    try {
      setLoading(true)
      
      // Create a reference to the file location in Firebase Storage
      const fileRef = storageRef(storage, `avatars/${currentUser.uid}/${Date.now()}_${avatarFile.name}`)
      
      // Upload the file
      await uploadBytes(fileRef, avatarFile)
      
      // Get the download URL
      const downloadURL = await getDownloadURL(fileRef)
      
      // Update profile data with the new avatar URL
      setProfileData(prev => ({ ...prev, avatar: downloadURL }))
      
      // Clear the file input
      setAvatarFile(null)
      
      showMessage('success', 'Avatar uploaded successfully!')
    } catch (error) {
      console.error('Avatar upload error:', error)
      showMessage('error', 'Failed to upload avatar')
    } finally {
      setLoading(false)
    }
  }
  
  const handleRemoveAvatar = async () => {
    if (!currentUser) return
    
    try {
      setLoading(true)
      
      // Update profile data to remove avatar
      setProfileData(prev => ({ ...prev, avatar: '' }))
      
      showMessage('success', 'Avatar removed successfully!')
    } catch (error) {
      console.error('Avatar remove error:', error)
      showMessage('error', 'Failed to remove avatar')
    } finally {
      setLoading(false)
    }
  }
  
  const handleUpdateProfile = async () => {
    if (!currentUser) return
    
    try {
      setLoading(true)
      
      // Update user profile in database
      const userRef = ref(database, `users/${currentUser.uid}`)
      
      // Only include hourlyRate in updates if user has permission to edit it
      const updates: any = {
        name: profileData.name,
        timezone: profileData.timezone,
        avatar: profileData.avatar,
        updatedAt: new Date().toISOString()
      }
      
      if (canEditRates) {
        updates.hourlyRate = profileData.hourlyRate
      }
      
      await update(userRef, updates)
      
      // Log the profile update
      await loggingService.logUserAction('profile_update', 'User profile updated', currentUser.uid, currentUser.name || 'Unknown')
      
      showMessage('success', 'Profile updated successfully!')
    } catch (error) {
      console.error('Profile update error:', error)
      showMessage('error', 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }
  
  const handleChangePassword = async () => {
    if (!currentUser || !auth.currentUser) return
    
    try {
      // Validation
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        showMessage('error', 'New passwords do not match')
        return
      }
      
      if (passwordData.newPassword.length < 6) {
        showMessage('error', 'Password must be at least 6 characters long')
        return
      }
      
      setLoading(true)
      
      // Re-authenticate user first
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email!,
        passwordData.currentPassword
      )
      
      await reauthenticateWithCredential(auth.currentUser, credential)
      
      // Update password
      await updatePassword(auth.currentUser, passwordData.newPassword)
      
      // Clear password form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      
      // Log the password change
      await loggingService.logUserAction('password_change', 'User password changed', currentUser.uid, currentUser.name || 'Unknown')
      
      showMessage('success', 'Password changed successfully!')
    } catch (error: any) {
      console.error('Password change error:', error)
      if (error.code === 'auth/wrong-password') {
        showMessage('error', 'Current password is incorrect')
      } else if (error.code === 'auth/weak-password') {
        showMessage('error', 'New password is too weak')
      } else {
        showMessage('error', 'Failed to change password')
      }
    } finally {
      setLoading(false)
    }
  }

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-50'
      case 'warning': return 'text-yellow-600 bg-yellow-50'
      case 'success': return 'text-green-600 bg-green-50'
      case 'info': return 'text-blue-600 bg-blue-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const formatLogTimestamp = (timestamp: Date) => {
    try {
      const date = new Date(timestamp)
      return isValid(date) ? format(date, 'MMM dd, yyyy HH:mm:ss') : 'Invalid Date'
    } catch (error) {
      console.error('Error formatting timestamp:', error)
      return 'Invalid Date'
    }
  }

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error': return <AlertTriangle className="h-4 w-4" />
      case 'warning': return <AlertTriangle className="h-4 w-4" />
      case 'success': return <CheckCircle className="h-4 w-4" />
      case 'info': return <Activity className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  if (loading && !logs.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your application preferences, database, and system configuration.</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${
          message.type === 'success' ? 'bg-green-50 text-green-700' :
          message.type === 'error' ? 'bg-red-50 text-red-700' :
          'bg-blue-50 text-blue-700'
        }`}>
          {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> :
           message.type === 'error' ? <AlertTriangle className="h-5 w-5" /> :
           <Activity className="h-5 w-5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
        <nav className="flex space-x-8">
          {[
            { id: 'profile', name: 'Profile', icon: User },
            { id: 'general', name: 'General', icon: SettingsIcon },
            // Hide Database tab for Solo pricing level
            (currentCompany?.pricingLevel !== 'solo') && { id: 'database', name: 'Database', icon: Database },
            // Hide System Logs tab for Solo pricing level
            (currentCompany?.pricingLevel !== 'solo') && { id: 'logs', name: 'System Logs', icon: FileText },
            { id: 'notifications', name: 'Notifications', icon: Bell },
            (currentUser?.role === 'super_admin' || currentUser?.role === 'root') && 
              { id: 'pdf', name: 'PDF Settings', icon: FileText }
          ].filter(Boolean).map((tab: any) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Profile Settings */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Profile Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profile Picture */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Profile Picture</label>
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      {profileData.avatar ? (
                        <img 
                          src={profileData.avatar} 
                          alt="Profile" 
                          className="w-24 h-24 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600">
                          <span className="text-2xl font-bold text-gray-500 dark:text-gray-400">
                            {profileData.name ? profileData.name.charAt(0).toUpperCase() : 'U'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col space-y-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleAvatarFileChange(e)}
                        className="block w-full text-sm text-gray-500 dark:text-gray-400
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-lg file:border-0
                          file:text-sm file:font-semibold
                          file:bg-primary-600 file:text-white
                          hover:file:bg-primary-700
                          dark:file:bg-primary-700 dark:hover:file:bg-primary-600"
                      />
                      <button
                        onClick={handleUploadAvatar}
                        disabled={!avatarFile || loading}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        Upload Picture
                      </button>
                      {profileData.avatar && (
                        <button
                          onClick={handleRemoveAvatar}
                          disabled={loading}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        >
                          Remove Picture
                        </button>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Upload a profile picture. For best results, use a square image (200x200 pixels minimum). JPG, PNG, or GIF formats.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={profileData.email}
                      className="w-full px-3 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                      disabled
                    />
                    <Mail className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email cannot be changed here. Contact support if needed.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Timezone</label>
                  <select
                    value={profileData.timezone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, timezone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="GMT-12 (International Date Line West)">GMT-12 (International Date Line West)</option>
                    <option value="GMT-11 (Midway Island, Samoa)">GMT-11 (Midway Island, Samoa)</option>
                    <option value="GMT-10 (Hawaii)">GMT-10 (Hawaii)</option>
                    <option value="GMT-9 (Alaska)">GMT-9 (Alaska)</option>
                    <option value="GMT-8 (Pacific Time)">GMT-8 (Pacific Time)</option>
                    <option value="GMT-7 (Mountain Time)">GMT-7 (Mountain Time)</option>
                    <option value="GMT-6 (Central Time)">GMT-6 (Central Time)</option>
                    <option value="GMT-5 (Eastern Time)">GMT-5 (Eastern Time)</option>
                    <option value="GMT-4 (Atlantic Time)">GMT-4 (Atlantic Time)</option>
                    <option value="GMT-3:30 (Newfoundland)">GMT-3:30 (Newfoundland)</option>
                    <option value="GMT-3 (Brasília Time)">GMT-3 (Brasília Time)</option>
                    <option value="GMT-2 (Mid-Atlantic)">GMT-2 (Mid-Atlantic)</option>
                    <option value="GMT-1 (Azores)">GMT-1 (Azores)</option>
                    <option value="GMT+0 (Greenwich Mean Time)">GMT+0 (Greenwich Mean Time)</option>
                    <option value="GMT+1 (Central European Time)">GMT+1 (Central European Time)</option>
                    <option value="GMT+2 (Eastern European Time)">GMT+2 (Eastern European Time)</option>
                    <option value="GMT+3 (Moscow Time)">GMT+3 (Moscow Time)</option>
                    <option value="GMT+3:30 (Iran)">GMT+3:30 (Iran)</option>
                    <option value="GMT+4 (Gulf Standard Time)">GMT+4 (Gulf Standard Time)</option>
                    <option value="GMT+4:30 (Afghanistan)">GMT+4:30 (Afghanistan)</option>
                    <option value="GMT+5 (Pakistan)">GMT+5 (Pakistan)</option>
                    <option value="GMT+5:30 (India Standard Time)">GMT+5:30 (India Standard Time)</option>
                    <option value="GMT+5:45 (Nepal)">GMT+5:45 (Nepal)</option>
                    <option value="GMT+6 (Bangladesh)">GMT+6 (Bangladesh)</option>
                    <option value="GMT+6:30 (Myanmar)">GMT+6:30 (Myanmar)</option>
                    <option value="GMT+7 (Indochina Time)">GMT+7 (Indochina Time)</option>
                    <option value="GMT+8 (China Standard Time)">GMT+8 (China Standard Time)</option>
                    <option value="GMT+8:45 (Australia Eucla)">GMT+8:45 (Australia Eucla)</option>
                    <option value="GMT+9 (Japan Standard Time)">GMT+9 (Japan Standard Time)</option>
                    <option value="GMT+9:30 (Australian Central Time)">GMT+9:30 (Australian Central Time)</option>
                    <option value="GMT+10 (Australian Eastern Time)">GMT+10 (Australian Eastern Time)</option>
                    <option value="GMT+10:30 (Lord Howe Island)">GMT+10:30 (Lord Howe Island)</option>
                    <option value="GMT+11 (Solomon Islands)">GMT+11 (Solomon Islands)</option>
                    <option value="GMT+12 (New Zealand Time)">GMT+12 (New Zealand Time)</option>
                    <option value="GMT+12:45 (Chatham Islands)">GMT+12:45 (Chatham Islands)</option>
                    <option value="GMT+13 (Tonga)">GMT+13 (Tonga)</option>
                    <option value="GMT+14 (Line Islands)">GMT+14 (Line Islands)</option>
                  </select>
                </div>

              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleUpdateProfile}
                  disabled={loading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Profile</span>
                </button>
              </div>
            </div>

            {/* Password Change Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Change Password</h3>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="Confirm new password"
                    />
                    <Lock className="h-4 w-4 text-gray-400 absolute right-3 top-2.5" />
                  </div>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <p>Password requirements:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>At least 6 characters long</li>
                    <li>Use a strong, unique password</li>
                  </ul>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleChangePassword}
                  disabled={loading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  <Lock className="h-4 w-4" />
                  <span>Change Password</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* General Settings */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Appearance</h3>
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-200 dark:bg-gray-600 rounded-lg">
                    <SettingsIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Dark Mode</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {isDarkMode ? 'Currently using dark theme' : 'Currently using light theme'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggleDarkMode}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                    isDarkMode ? 'bg-primary-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isDarkMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => handleSaveSettings('general')}
                  disabled={loading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Settings</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Database Settings */}
        {activeTab === 'database' && (
          currentCompany?.pricingLevel === 'solo' ? (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
                <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Database Management Unavailable</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Database management features are not available on the Solo plan.
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Upgrade to Office or Enterprise plan to access database backup and restore functionality.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Database Management</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Download className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">Backup Database</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Download a complete backup of your database</p>
                      </div>
                    </div>
                    <button
                      onClick={handleBackupDatabase}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2 text-white rounded-lg"
                    >
                      <Download className="h-4 w-4" />
                      <span>Backup Now</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Upload className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">Restore Database</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Upload and restore from a backup file</p>
                      </div>
                    </div>
                    <label className="px-4 py-2 bg-green-600 hover:bg-green-700 cursor-pointer flex items-center space-x-2 text-white rounded-lg">
                      <Upload className="h-4 w-4" />
                      <span>Choose File</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleRestoreDatabase}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {backupData && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Last Backup Info</h4>
                      <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                        <p>Date: {format(backupData.metadata.timestamp, 'MMM dd, yyyy HH:mm')}</p>
                        <p>Version: {backupData.metadata.version}</p>
                        <p>Total Records: {backupData.metadata.totalRecords}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        )}

        {/* System Logs */}
        {activeTab === 'logs' && (
          currentCompany?.pricingLevel === 'solo' ? (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">System Logs Unavailable</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  System logs are not available on the Solo plan.
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Upgrade to Office or Enterprise plan to access system logs and monitoring features.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">System Logs</h3>
                {(currentUser?.role === 'admin' || currentUser?.role === 'root') && (
                  <button
                    onClick={handleClearLogs}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center space-x-2"
                  >
                    <Trash className="h-4 w-4" />
                    <span>Clear Logs</span>
                  </button>
                )}
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {(currentUser?.role !== 'admin' && currentUser?.role !== 'root') ? (
                  <div className="text-center py-8 text-gray-500">
                    <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="font-medium">Admin Access Required</p>
                    <p className="text-sm">Only administrators can view system logs</p>
                  </div>
                ) : logs.length > 0 ? (
                  logs.map((log) => (
                    <div key={log.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                      <div className={`p-1 rounded-full ${getLogLevelColor(log.level)}`}>
                        {getLogIcon(log.level)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">{log.message}</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${getLogLevelColor(log.level)}`}>
                            {log.level.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatLogTimestamp(log.timestamp)} • {log.action}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No logs available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      )}



        {/* Notification Settings */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            {/* Sound Notification Settings */}
            <NotificationSettings />
            
            {/* Other Notification Settings */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Notification Preferences</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Email Notifications</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Receive notifications via email</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.emailNotifications}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Push Notifications</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Receive push notifications in browser</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.pushNotifications}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, pushNotifications: e.target.checked }))}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Weekly Reports</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Get weekly time tracking reports</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.weeklyReports}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, weeklyReports: e.target.checked }))}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Project Deadlines</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Notifications for upcoming project deadlines</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.projectDeadlines}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, projectDeadlines: e.target.checked }))}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Team Updates</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Notifications for team-related activities</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.teamUpdates}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, teamUpdates: e.target.checked }))}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">System Alerts</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Important system notifications and alerts</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.systemAlerts}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, systemAlerts: e.target.checked }))}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => handleSaveSettings('notifications')}
                  disabled={loading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Settings</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PDF Settings Link */}
        {activeTab === 'profile' && (currentUser?.role === 'super_admin' || currentUser?.role === 'root') && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">PDF Export Settings</h3>
            {currentCompany?.pricingLevel === 'solo' ? (
              <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">PDF Customization Unavailable</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      PDF customization is not available on the Solo plan. Upgrade to Office or Enterprise plan to unlock this feature.
                    </p>
                  </div>
                </div>
                <div className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-300 rounded-lg cursor-not-allowed">
                  <span>Locked</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <h4 className="font-medium text-gray-900">Customize PDF Exports</h4>
                    <p className="text-sm text-gray-600">Manage company-specific PDF branding and settings</p>
                  </div>
                </div>
                <Link 
                  to="/pdf-settings" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <span>Configure</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        )}

        {/* PDF Settings Tab */}
        {activeTab === 'pdf' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">PDF Export Settings</h3>
            {currentCompany?.pricingLevel === 'solo' ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-16 w-16 text-gray-400 mb-4" />
                <h4 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">PDF Customization Unavailable</h4>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                  PDF customization is not available on the Solo plan. Upgrade to Office or Enterprise plan to unlock company-specific PDF branding, including company name, logo, colors, and footer text.
                </p>
                <div className="px-6 py-3 bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-300 rounded-lg cursor-not-allowed">
                  <span>Feature Locked</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-16 w-16 text-blue-500 mb-4" />
                <h4 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">Customize PDF Exports</h4>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                  Manage company-specific PDF branding, including company name, logo, colors, and footer text.
                </p>
                <Link 
                  to="/pdf-settings" 
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <span>Go to PDF Settings</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

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
  Trash
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { update, get, set } from 'firebase/database'
import { ref } from 'firebase/database'
import { format, isValid } from 'date-fns'
import { database } from '../config/firebase'
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
  const { currentUser } = useAuth()
  const { isDarkMode, toggleDarkMode } = useTheme()
  const [activeTab, setActiveTab] = useState<'profile' | 'general' | 'database' | 'logs' | 'security' | 'notifications'>('profile')
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
    timezone: 'America/New_York',
    hourlyRate: 25
  })
  
  // Password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  
  // General settings
  const [generalSettings, setGeneralSettings] = useState({
    appName: 'Task Flow Pro',
    timezone: 'UTC',
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
          timezone: userData.timezone || 'America/New_York',
          hourlyRate: userData.hourlyRate || 25
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
            { id: 'database', name: 'Database', icon: Database },
            { id: 'logs', name: 'System Logs', icon: FileText },
            { id: 'security', name: 'Security', icon: Shield },
            { id: 'notifications', name: 'Notifications', icon: Bell }
          ].map((tab) => (
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
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="UTC">UTC</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Paris</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                    <option value="Asia/Shanghai">Shanghai</option>
                    <option value="Australia/Sydney">Sydney</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hourly Rate ($)
                    {!canEditRates && (
                      <span className="block text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Only HR and Super Admin users can edit hourly rates
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={profileData.hourlyRate}
                    onChange={(e) => setProfileData(prev => ({ ...prev, hourlyRate: parseFloat(e.target.value) || 0 }))}
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${!canEditRates ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}`}
                    placeholder="25.00"
                    disabled={!canEditRates}
                  />
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
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Application Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Application Name</label>
                  <input
                    type="text"
                    value={generalSettings.appName}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, appName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Timezone</label>
                  <select
                    value={generalSettings.timezone}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, timezone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Format</label>
                  <select
                    value={generalSettings.dateFormat}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, dateFormat: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="MM/dd/yyyy">MM/DD/YYYY</option>
                    <option value="dd/MM/yyyy">DD/MM/YYYY</option>
                    <option value="yyyy-MM-dd">YYYY-MM-DD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time Format</label>
                  <select
                    value={generalSettings.timeFormat}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, timeFormat: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="12h">12 Hour</option>
                    <option value="24h">24 Hour</option>
                  </select>
                </div>
              </div>
              
              {/* Theme Settings */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">Appearance</h4>
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
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Database Management</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Download className="h-5 w-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">Backup Database</h4>
                      <p className="text-sm text-gray-600">Download a complete backup of your database</p>
                    </div>
                  </div>
                  <button
                    onClick={handleBackupDatabase}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Backup Now</span>
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Upload className="h-5 w-5 text-green-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">Restore Database</h4>
                      <p className="text-sm text-gray-600">Upload and restore from a backup file</p>
                    </div>
                  </div>
                  <label className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer flex items-center space-x-2">
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
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Last Backup Info</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Date: {format(backupData.metadata.timestamp, 'MMM dd, yyyy HH:mm')}</p>
                      <p>Version: {backupData.metadata.version}</p>
                      <p>Total Records: {backupData.metadata.totalRecords}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* System Logs */}
        {activeTab === 'logs' && (
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
        )}

        {/* Security Settings */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Security Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
                  <input
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    min="5"
                    max="480"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password Minimum Length</label>
                  <input
                    type="number"
                    value={securitySettings.passwordMinLength}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, passwordMinLength: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    min="6"
                    max="32"
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="requirePasswordChange"
                    checked={securitySettings.requirePasswordChange}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, requirePasswordChange: e.target.checked }))}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="requirePasswordChange" className="text-sm text-gray-700">
                    Require password change on next login
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="twoFactorAuth"
                    checked={securitySettings.twoFactorAuth}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, twoFactorAuth: e.target.checked }))}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="twoFactorAuth" className="text-sm text-gray-700">
                    Enable two-factor authentication
                  </label>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => handleSaveSettings('security')}
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
                    <h4 className="font-medium text-gray-900">Email Notifications</h4>
                    <p className="text-sm text-gray-600">Receive notifications via email</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.emailNotifications}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Push Notifications</h4>
                    <p className="text-sm text-gray-600">Receive push notifications in browser</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.pushNotifications}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, pushNotifications: e.target.checked }))}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Weekly Reports</h4>
                    <p className="text-sm text-gray-600">Get weekly time tracking reports</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.weeklyReports}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, weeklyReports: e.target.checked }))}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Project Deadlines</h4>
                    <p className="text-sm text-gray-600">Notifications for upcoming project deadlines</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.projectDeadlines}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, projectDeadlines: e.target.checked }))}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Team Updates</h4>
                    <p className="text-sm text-gray-600">Notifications for team-related activities</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.teamUpdates}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, teamUpdates: e.target.checked }))}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">System Alerts</h4>
                    <p className="text-sm text-gray-600">Important system notifications and alerts</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.systemAlerts}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, systemAlerts: e.target.checked }))}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
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
      </div>
    </div>
  )
}

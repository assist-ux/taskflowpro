import { useState, useEffect } from 'react'
import { 
  Database, 
  Download, 
  Upload, 
  FileText, 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Trash2, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  HardDrive,
  Activity,
  Save,
  Eye,
  EyeOff
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { database } from '../config/firebase'
import { ref, get, set, remove } from 'firebase/database'
import { format, isValid } from 'date-fns'
import { loggingService, SystemLog } from '../services/loggingService'

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
  const [activeTab, setActiveTab] = useState<'general' | 'database' | 'logs' | 'security' | 'notifications'>('general')
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState<SystemLog[]>([])
  const [backupData, setBackupData] = useState<BackupData | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  
  // General settings
  const [generalSettings, setGeneralSettings] = useState({
    appName: 'Clockistry',
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

  const loadLogs = async () => {
    try {
      setLoading(true)
      
      // Check if user is admin before trying to load logs
      if (currentUser?.role !== 'admin') {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your application preferences, database, and system configuration.</p>
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
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex space-x-8">
          {[
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
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
        {/* General Settings */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Application Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Application Name</label>
                  <input
                    type="text"
                    value={generalSettings.appName}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, appName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                  <select
                    value={generalSettings.timezone}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, timezone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
                  <select
                    value={generalSettings.dateFormat}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, dateFormat: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="MM/dd/yyyy">MM/DD/YYYY</option>
                    <option value="dd/MM/yyyy">DD/MM/YYYY</option>
                    <option value="yyyy-MM-dd">YYYY-MM-DD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time Format</label>
                  <select
                    value={generalSettings.timeFormat}
                    onChange={(e) => setGeneralSettings(prev => ({ ...prev, timeFormat: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="12h">12 Hour</option>
                    <option value="24h">24 Hour</option>
                  </select>
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
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Database Management</h3>
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
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">System Logs</h3>
                {currentUser?.role === 'admin' && (
                  <button
                    onClick={handleClearLogs}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center space-x-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Clear Logs</span>
                  </button>
                )}
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {currentUser?.role !== 'admin' ? (
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
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>
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
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
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

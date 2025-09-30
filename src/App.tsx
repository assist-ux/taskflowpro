import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { SearchProvider } from './contexts/SearchContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { MessagingProvider } from './contexts/MessagingContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { TimeEntryProvider } from './contexts/TimeEntryContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import Clients from './pages/Clients'
import TimeTracker from './pages/TimeTracker'
import Calendar from './pages/Calendar'
import Reports from './pages/Reports'
import TaskManagement from './pages/ProjectManagement'
import Teams from './pages/Teams'
import Billing from './pages/Billing'
import Feedbacks from './pages/Feedbacks'
import AdminDashboard from './pages/AdminDashboard'
import Settings from './pages/Settings'
import SystemSettings from './pages/SystemSettings'
import Auth from './pages/Auth'
import Landing from './pages/Landing'
import About from './pages/About'
import MessagingWidget from './components/messaging/MessagingWidget'

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { currentUser, loading } = useAuth()

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If no user is authenticated, show appropriate page based on route
  if (!currentUser) {
    return (
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<Landing />} />
        </Routes>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <Routes>
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/tracker" element={
              <ProtectedRoute>
                <TimeTracker />
              </ProtectedRoute>
            } />
            <Route path="/calendar" element={
              <ProtectedRoute>
                <Calendar />
              </ProtectedRoute>
            } />
            <Route path="/projects" element={
              <ProtectedRoute>
                <Projects />
              </ProtectedRoute>
            } />
            <Route path="/clients" element={
              <ProtectedRoute>
                <Clients />
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            } />
            <Route path="/management" element={
              <ProtectedRoute>
                <TaskManagement />
              </ProtectedRoute>
            } />
            <Route path="/teams" element={
              <ProtectedRoute>
                <Teams />
              </ProtectedRoute>
            } />
            <Route path="/billing" element={
              <ProtectedRoute>
                <Billing />
              </ProtectedRoute>
            } />
            <Route path="/feedbacks" element={
              <ProtectedRoute>
                <Feedbacks />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/system" element={
              <ProtectedRoute>
                <SystemSettings />
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      
      {/* Global Messaging Widget */}
      <MessagingWidget />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <TimeEntryProvider>
          <SearchProvider>
            <NotificationProvider>
              <MessagingProvider>
                <Router>
                  <AppContent />
                </Router>
              </MessagingProvider>
            </NotificationProvider>
          </SearchProvider>
        </TimeEntryProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App
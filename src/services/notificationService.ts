import { useNotifications } from '../contexts/NotificationContext'

export const notificationService = {
  // Add a notification (this would typically be called from components)
  addNotification: (notification: {
    title: string
    message: string
    type: 'info' | 'success' | 'warning' | 'error'
    actionUrl?: string
  }) => {
    // This will be called from components that have access to the notification context
    console.log('Notification would be added:', notification)
  },

  // Sample notifications for demonstration
  getSampleNotifications: () => [
    {
      title: 'Welcome to Clockistry!',
      message: 'Start tracking your time by creating a new time entry.',
      type: 'info' as const,
      actionUrl: '/tracker'
    },
    {
      title: 'Time Entry Completed',
      message: 'Your 2-hour session on "Website Redesign" has been saved.',
      type: 'success' as const,
      actionUrl: '/tracker'
    },
    {
      title: 'Project Deadline Approaching',
      message: 'The "Mobile App Development" project deadline is in 3 days.',
      type: 'warning' as const,
      actionUrl: '/projects'
    },
    {
      title: 'Team Member Added',
      message: 'John Doe has been added to your team.',
      type: 'info' as const,
      actionUrl: '/teams'
    }
  ]
}

// Hook to easily add notifications from components
export const useNotificationService = () => {
  const { addNotification } = useNotifications()
  
  return {
    addNotification,
    addSuccessNotification: (title: string, message: string, actionUrl?: string) => 
      addNotification({ title, message, type: 'success', actionUrl }),
    addErrorNotification: (title: string, message: string, actionUrl?: string) => 
      addNotification({ title, message, type: 'error', actionUrl }),
    addWarningNotification: (title: string, message: string, actionUrl?: string) => 
      addNotification({ title, message, type: 'warning', actionUrl }),
    addInfoNotification: (title: string, message: string, actionUrl?: string) => 
      addNotification({ title, message, type: 'info', actionUrl })
  }
}

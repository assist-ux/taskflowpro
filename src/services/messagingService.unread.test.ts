// Mock environment variables
const mockEnv = {
  VITE_FIREBASE_API_KEY: 'test-api-key',
  VITE_FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
  VITE_FIREBASE_DATABASE_URL: 'https://test-default-rtdb.firebaseio.com',
  VITE_FIREBASE_PROJECT_ID: 'test-project',
  VITE_FIREBASE_STORAGE_BUCKET: 'test.firebasestorage.app',
  VITE_FIREBASE_MESSAGING_SENDER_ID: 'test-sender-id',
  VITE_FIREBASE_APP_ID: 'test-app-id',
  VITE_FIREBASE_MEASUREMENT_ID: 'test-measurement-id'
};

// Mock process.env
process.env = {
  ...process.env,
  ...mockEnv
};

import { messagingService } from './messagingService'

// Mock Firebase functions
jest.mock('firebase/database', () => ({
  ref: jest.fn(),
  set: jest.fn(),
  get: jest.fn(),
  push: jest.fn(() => ({ key: 'test-key' })),
  query: jest.fn(),
  orderByChild: jest.fn(),
  equalTo: jest.fn(),
  limitToLast: jest.fn(),
  onValue: jest.fn(),
  off: jest.fn()
}))

// Mock teamService
jest.mock('./teamService', () => ({
  teamService: {
    getTeamMembers: jest.fn()
  }
}))

describe('messagingService - Unread Messages', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should have getUnreadMessageCount function', () => {
    expect(typeof messagingService.getUnreadMessageCount).toBe('function')
  })

  it('should have markMessagesAsRead function', () => {
    expect(typeof messagingService.markMessagesAsRead).toBe('function')
  })

  it('should have subscribeToUnreadCounts function', () => {
    expect(typeof messagingService.subscribeToUnreadCounts).toBe('function')
  })

  it('should calculate unread message count correctly', async () => {
    const { get } = require('firebase/database')
    
    // Mock last read timestamp
    get.mockImplementation((ref: any) => {
      if (ref.toString().includes('lastReadTimestamps')) {
        return Promise.resolve({
          exists: () => true,
          val: () => ({
            timestamp: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
          })
        })
      } else {
        // Mock messages
        return Promise.resolve({
          exists: () => true,
          val: () => ({
            'msg-1': {
              teamId: 'team-1',
              senderId: 'user-2',
              timestamp: new Date(Date.now() - 1800000).toISOString() // 30 minutes ago
            },
            'msg-2': {
              teamId: 'team-1',
              senderId: 'user-3',
              timestamp: new Date(Date.now() - 900000).toISOString() // 15 minutes ago
            },
            'msg-3': {
              teamId: 'team-1',
              senderId: 'user-1', // Current user, should not count
              timestamp: new Date(Date.now() - 600000).toISOString() // 10 minutes ago
            }
          })
        })
      }
    })
    
    const unreadCount = await messagingService.getUnreadMessageCount('team-1', 'user-1')
    expect(unreadCount).toBe(2) // Only messages from other users that are newer than last read
  })

  it('should mark messages as read', async () => {
    const { set } = require('firebase/database')
    set.mockResolvedValue()
    
    await messagingService.markMessagesAsRead('team-1', 'user-1')
    expect(set).toHaveBeenCalled()
  })
})
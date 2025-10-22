// Mock environment variables
process.env = {
  ...process.env,
  VITE_FIREBASE_API_KEY: 'test-api-key',
  VITE_FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
  VITE_FIREBASE_DATABASE_URL: 'https://test-default-rtdb.firebaseio.com',
  VITE_FIREBASE_PROJECT_ID: 'test-project',
  VITE_FIREBASE_STORAGE_BUCKET: 'test.firebasestorage.app',
  VITE_FIREBASE_MESSAGING_SENDER_ID: 'test-sender-id',
  VITE_FIREBASE_APP_ID: 'test-app-id',
  VITE_FIREBASE_MEASUREMENT_ID: 'test-measurement-id'
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

describe('messagingService - Permission Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should handle permission errors gracefully when marking messages as read', async () => {
    const { set } = require('firebase/database')
    
    // Mock a permission error
    set.mockRejectedValue(new Error('PERMISSION_DENIED: Permission denied'))
    
    // This should not throw an error but log it instead
    await expect(messagingService.markMessagesAsRead('team-1', 'user-1')).resolves.not.toThrow()
  })

  it('should use the correct path for user read timestamps', async () => {
    const { ref, set } = require('firebase/database')
    const refMock = jest.fn(() => 'test-ref')
    ref.mockImplementation(refMock)
    set.mockResolvedValue()
    
    await messagingService.markMessagesAsRead('team-1', 'user-1')
    
    // Check that the correct path is used
    expect(refMock).toHaveBeenCalledWith(expect.stringContaining('userReadTimestamps/user-1/team-1'))
  })
})
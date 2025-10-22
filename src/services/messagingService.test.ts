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

// Mock import.meta.env
Object.defineProperty(import.meta, 'env', {
  value: mockEnv,
  writable: true
});

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

describe('messagingService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should have createMessage function', () => {
    expect(typeof messagingService.createMessage).toBe('function')
  })

  it('should have getTeamMessages function', () => {
    expect(typeof messagingService.getTeamMessages).toBe('function')
  })

  it('should have subscribeToTeamMessages function', () => {
    expect(typeof messagingService.subscribeToTeamMessages).toBe('function')
  })

  it('should verify team membership before creating a message', async () => {
    const { teamService } = require('./teamService')
    
    // Mock team members - user is not a member
    teamService.getTeamMembers.mockResolvedValue([
      { userId: 'other-user', isActive: true }
    ])
    
    await expect(
      messagingService.createMessage(
        { teamId: 'team-1', content: 'test message' },
        'user-1',
        'Test User',
        'test@example.com'
      )
    ).rejects.toThrow('User is not a member of this team')
  })

  it('should allow message creation for team members', async () => {
    const { teamService } = require('./teamService')
    const { set } = require('firebase/database')
    
    // Mock team members - user is a member
    teamService.getTeamMembers.mockResolvedValue([
      { userId: 'user-1', isActive: true }
    ])
    
    set.mockResolvedValue()
    
    const result = await messagingService.createMessage(
      { teamId: 'team-1', content: 'test message' },
      'user-1',
      'Test User',
      'test@example.com'
    )
    
    expect(result).toBe('test-key')
    expect(set).toHaveBeenCalled()
  })
})
// Mock Firebase config to avoid import.meta issues
jest.mock('../config/firebase', () => ({
  database: {}
}));

// Mock Firebase functions
const mockCallbacks: Function[] = [];
const mockOnValue = jest.fn((query, callback) => {
  mockCallbacks.push(callback);
  // Call the callback immediately with initial data
  callback({
    exists: () => true,
    val: () => ({
      'msg-1': {
        id: 'msg-1',
        teamId: 'team-1',
        senderId: 'user-2',
        senderName: 'User 2',
        senderEmail: 'user2@example.com',
        content: 'Hello there!',
        timestamp: new Date().toISOString()
      }
    })
  });
  return jest.fn(); // Return unsubscribe function
});

jest.mock('firebase/database', () => ({
  ref: jest.fn(),
  set: jest.fn(),
  get: jest.fn(),
  push: jest.fn(() => ({ key: 'test-key' })),
  query: jest.fn(),
  orderByChild: jest.fn(),
  equalTo: jest.fn(),
  limitToLast: jest.fn(),
  onValue: mockOnValue,
  off: jest.fn()
}));

// Mock teamService
jest.mock('./teamService', () => ({
  teamService: {
    getTeamMembers: jest.fn()
  }
}));

// Mock sound utilities
const mockPlayMessageReceivedSound = jest.fn();
jest.mock('../utils/soundUtils', () => ({
  playMessageReceivedSound: mockPlayMessageReceivedSound
}));

import { messagingService } from './messagingService'

describe('messagingService - Sound Notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCallbacks.length = 0; // Clear callbacks array
  });

  it('should have subscribeToTeamMessagesWithSound function', () => {
    expect(typeof messagingService.subscribeToTeamMessagesWithSound).toBe('function');
  });

  it('should not play sound on initial load of messages', () => {
    // Create a mock callback
    const mockCallback = jest.fn();
    
    // Subscribe to team messages with sound
    messagingService.subscribeToTeamMessagesWithSound('team-1', 'user-1', mockCallback);
    
    // Verify that the callback was called with initial messages
    expect(mockCallback).toHaveBeenCalled();
    
    // Verify that sound was NOT played on initial load
    expect(mockPlayMessageReceivedSound).not.toHaveBeenCalled();
  });

  it('should play sound for new messages from other users', () => {
    // Create a mock callback
    const mockCallback = jest.fn();
    
    // Subscribe to team messages with sound
    messagingService.subscribeToTeamMessagesWithSound('team-1', 'user-1', mockCallback);
    
    // Clear the mock to ensure we're testing the right scenario
    mockPlayMessageReceivedSound.mockClear();
    
    // Simulate a new message by calling the onValue callback again with updated data
    if (mockCallbacks.length > 0) {
      mockCallbacks[0]({
        exists: () => true,
        val: () => ({
          'msg-1': {
            id: 'msg-1',
            teamId: 'team-1',
            senderId: 'user-2',
            senderName: 'User 2',
            senderEmail: 'user2@example.com',
            content: 'Hello there!',
            timestamp: new Date().toISOString()
          },
          'msg-2': {
            id: 'msg-2',
            teamId: 'team-1',
            senderId: 'user-3', // Different user
            senderName: 'User 3',
            senderEmail: 'user3@example.com',
            content: 'New message!',
            timestamp: new Date(Date.now() + 1000).toISOString() // Newer timestamp
          }
        })
      });
    }
    
    // Verify that sound was played for the new message from another user
    expect(mockPlayMessageReceivedSound).toHaveBeenCalled();
  });

  it('should not play sound for messages from the current user', () => {
    // Create a mock callback
    const mockCallback = jest.fn();
    
    // Subscribe to team messages with sound
    messagingService.subscribeToTeamMessagesWithSound('team-1', 'user-1', mockCallback);
    
    // Clear the mock to ensure we're testing the right scenario
    mockPlayMessageReceivedSound.mockClear();
    
    // Simulate a new message from the current user
    if (mockCallbacks.length > 0) {
      mockCallbacks[0]({
        exists: () => true,
        val: () => ({
          'msg-1': {
            id: 'msg-1',
            teamId: 'team-1',
            senderId: 'user-2',
            senderName: 'User 2',
            senderEmail: 'user2@example.com',
            content: 'Hello there!',
            timestamp: new Date().toISOString()
          },
          'msg-2': {
            id: 'msg-2',
            teamId: 'team-1',
            senderId: 'user-1', // Same as current user
            senderName: 'Current User',
            senderEmail: 'user1@example.com',
            content: 'My own message',
            timestamp: new Date(Date.now() + 1000).toISOString() // Newer timestamp
          }
        })
      });
    }
    
    // Verify that sound was NOT played for messages from the current user
    expect(mockPlayMessageReceivedSound).not.toHaveBeenCalled();
  });
});
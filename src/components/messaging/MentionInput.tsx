import React, { useState, useRef, useEffect } from 'react'
import { TeamMember } from '../../types'
import { teamService } from '../../services/teamService'
import { MentionNotificationService } from '../../services/mentionNotificationService'

interface MentionInputProps {
  value: string
  onChange: (value: string) => void
  onSendMessage: (content: string, mentionedUsers: string[]) => void
  teamId: string
  currentUserId: string
  currentUserName: string
  placeholder?: string
}

const MentionInput: React.FC<MentionInputProps> = ({
  value,
  onChange,
  onSendMessage,
  teamId,
  currentUserId,
  currentUserName,
  placeholder = 'Type a message...'
}) => {
  const [mentionSuggestions, setMentionSuggestions] = useState<TeamMember[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [cursorPosition, setCursorPosition] = useState(0)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Load team members for mention suggestions
  useEffect(() => {
    const loadTeamMembers = async () => {
      if (teamId) {
        try {
          const members = await teamService.getTeamMembers(teamId)
          // Filter out the current user and inactive members
          const activeMembers = members.filter(
            member => member.userId !== currentUserId && member.isActive
          )
          setMentionSuggestions(activeMembers)
        } catch (error) {
          console.error('Error loading team members:', error)
          setMentionSuggestions([])
        }
      }
    }

    loadTeamMembers()
  }, [teamId, currentUserId])

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const inputValue = e.target.value
    const cursorPos = e.target.selectionStart || 0
    onChange(inputValue)
    setCursorPosition(cursorPos)

    // Check for @ trigger
    const textBeforeCursor = inputValue.substring(0, cursorPos)
    const lastAtPos = textBeforeCursor.lastIndexOf('@')
    const lastSpacePos = textBeforeCursor.lastIndexOf(' ', lastAtPos)

    if (lastAtPos !== -1 && (lastSpacePos === -1 || lastSpacePos < lastAtPos)) {
      const query = textBeforeCursor.substring(lastAtPos + 1)
      setMentionQuery(query)
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }

  // Handle key events (Enter to send, Escape to close suggestions)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions) {
      if (e.key === 'Escape') {
        setShowSuggestions(false)
        e.preventDefault()
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      if (!showSuggestions) {
        e.preventDefault()
        handleSubmit()
      }
    }
  }

  // Insert mention
  const insertMention = (member: TeamMember) => {
    const lastAtPos = value.lastIndexOf('@')
    const textBeforeMention = value.substring(0, lastAtPos)
    const textAfterMention = value.substring(lastAtPos + mentionQuery.length + 1)
    const mentionText = `@${member.userName}`
    const newValue = `${textBeforeMention}${mentionText} ${textAfterMention}`
    
    onChange(newValue)
    setShowSuggestions(false)
    setMentionQuery('')
    
    // Focus back to input and set cursor position
    setTimeout(() => {
      if (inputRef.current) {
        const newCursorPosition = lastAtPos + mentionText.length + 1
        inputRef.current.focus()
        inputRef.current.setSelectionRange(newCursorPosition, newCursorPosition)
      }
    }, 0)
  }

  // Handle form submission
  const handleSubmit = () => {
    if (value.trim()) {
      console.log('=== MentionInput handleSubmit called ===');
      console.log('Message value:', value);
      console.log('Mention suggestions:', mentionSuggestions);
      
      // Extract mentioned user IDs
      const mentionedUserIds: string[] = []
      
      // Find all mentions in the message
      const mentionRegex = /@(\w+)/g
      let match
      while ((match = mentionRegex.exec(value)) !== null) {
        const mentionedUserName = match[1]
        console.log('Found mention in MentionInput:', mentionedUserName);
        const mentionedMember = mentionSuggestions.find(
          member => member.userName === mentionedUserName
        )
        if (mentionedMember) {
          console.log('Found matching member in MentionInput:', mentionedMember);
          mentionedUserIds.push(mentionedMember.userId)
        } else {
          console.log('No matching member found in MentionInput for:', mentionedUserName);
        }
      }
      
      console.log('MentionInput extracted mentioned user IDs:', mentionedUserIds);
      onSendMessage(value, mentionedUserIds)
      onChange('')
    }
  }

  // Filter suggestions based on query
  const filteredSuggestions = mentionSuggestions.filter(member =>
    member.userName.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    member.userEmail.toLowerCase().includes(mentionQuery.toLowerCase())
  )

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className="relative w-full">
      <textarea
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-gray-600 outline-none resize-none"
        rows={1}
      />
      
      {/* Mention Suggestions */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute bottom-full mb-2 left-0 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto z-10"
        >
          {filteredSuggestions.map((member) => (
            <div
              key={member.userId}
              className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center"
              onClick={() => insertMention(member)}
            >
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium mr-3">
                {member.userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">{member.userName}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{member.userEmail}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MentionInput
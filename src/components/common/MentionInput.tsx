import { useState, useRef, useEffect, useCallback } from 'react'
import { User, X } from 'lucide-react'
import { MentionSuggestion } from '../../types'
import { userService } from '../../services/userService'
import { teamService } from '../../services/teamService'

interface MentionInputProps {
  value: string
  onChange: (value: string, mentions: string[]) => void
  projectId?: string
  currentUserId?: string
  placeholder?: string
  className?: string
  rows?: number
  disabled?: boolean
  onKeyPress?: (e: React.KeyboardEvent) => void
  onBlur?: () => void
}

export default function MentionInput({
  value,
  onChange,
  projectId,
  currentUserId,
  placeholder = "Type a message...",
  className = "",
  rows = 1,
  disabled = false,
  onKeyPress,
  onBlur
}: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionStartIndex, setMentionStartIndex] = useState(-1)
  const [mentions, setMentions] = useState<string[]>([])
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Load users for mention suggestions
  const loadUsers = useCallback(async (query: string) => {
    try {
      let filteredUsers: MentionSuggestion[] = [];
      
      if (projectId && currentUserId) {
        console.log('Loading users for mentions with projectId:', projectId, 'currentUserId:', currentUserId);
        // Use team-based filtering if projectId and currentUserId are provided
        const mentionableUsers = await teamService.getMentionableUsers(projectId, currentUserId);
        console.log('Mentionable users:', mentionableUsers);
        filteredUsers = mentionableUsers.filter(user => 
          user.name.toLowerCase().includes(query.toLowerCase()) ||
          user.email.toLowerCase().includes(query.toLowerCase())
        );
        console.log('Filtered users:', filteredUsers);
      } else {
        console.log('Falling back to all users - projectId:', projectId, 'currentUserId:', currentUserId);
        // Fallback to all users if no projectId or currentUserId
        const users = await userService.getAllUsers();
        filteredUsers = users.filter(user => 
          user.name.toLowerCase().includes(query.toLowerCase()) ||
          user.email.toLowerCase().includes(query.toLowerCase())
        ).map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }));
      }
      
      setSuggestions(filteredUsers);
    } catch (error) {
      console.error('Error loading users for mentions:', error);
      setSuggestions([]);
    }
  }, [projectId, currentUserId]);

  // Handle text change and detect @ mentions
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const cursorPosition = e.target.selectionStart
    
    // Find @ mentions in the text (including multi-word usernames)
    const mentionRegex = /@([^\s\n\r@]+(?:\s+[^\s\n\r@]+)*)/g
    const foundMentions: string[] = []
    let match
    
    while ((match = mentionRegex.exec(newValue)) !== null) {
      foundMentions.push(match[1])
    }
    
    setMentions(foundMentions)
    onChange(newValue, foundMentions)
    
    // Check if we're typing a mention
    const textBeforeCursor = newValue.substring(0, cursorPosition)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1)
      // Allow spaces in mentions, but stop at line breaks or special characters
      const mentionMatch = textAfterAt.match(/^([^\s\n\r@]+(?:\s+[^\s\n\r@]+)*)/)
      
      if (mentionMatch) {
        setMentionQuery(mentionMatch[1])
        setMentionStartIndex(lastAtIndex)
        setShowSuggestions(true)
        loadUsers(mentionMatch[1])
      } else {
        setShowSuggestions(false)
      }
    } else {
      setShowSuggestions(false)
    }
  }

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: MentionSuggestion) => {
    if (mentionStartIndex === -1) return
    
    const beforeMention = value.substring(0, mentionStartIndex)
    const afterMention = value.substring(mentionStartIndex + mentionQuery.length + 1)
    const newValue = `${beforeMention}@${suggestion.name} ${afterMention}`
    
    // Update mentions list
    const newMentions = [...mentions.filter(m => m !== mentionQuery), suggestion.name]
    setMentions(newMentions)
    
    onChange(newValue, newMentions)
    setShowSuggestions(false)
    setMentionQuery('')
    setMentionStartIndex(-1)
    
    // Focus back to textarea
    setTimeout(() => {
      textareaRef.current?.focus()
      const newCursorPos = beforeMention.length + suggestion.name.length + 2
      textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) {
      onKeyPress?.(e)
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (suggestions[selectedIndex]) {
          handleSuggestionSelect(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        break
      default:
        onKeyPress?.(e)
    }
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedIndex(0)
  }, [suggestions])

  // Render mentions in the text
  const renderTextWithMentions = (text: string) => {
    const mentionRegex = /@(\w+)/g
    const parts = text.split(mentionRegex)
    
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // This is a mention
        return (
          <span key={index} className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1 rounded">
            @{part}
          </span>
        )
      }
      return part
    })
  }

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none ${className}`}
        rows={rows}
        disabled={disabled}
      />
      
      {/* Mention Suggestions Dropdown */}
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto z-50"
        >
          {suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                onClick={() => handleSuggestionSelect(suggestion)}
                className={`w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 ${
                  index === selectedIndex ? 'bg-blue-50 dark:bg-blue-900' : ''
                }`}
              >
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {suggestion.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {suggestion.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {suggestion.email}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {suggestion.role}
                  </span>
                </div>
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
              No users found
            </div>
          )}
        </div>
      )}
      
      {/* Mentioned Users Display */}
      {mentions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {mentions.map((mention, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full"
            >
              @{mention}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

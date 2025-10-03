import { useState, useRef, useEffect, useCallback } from 'react'
import { User, X } from 'lucide-react'
import { MentionSuggestion } from '../../types'
import { userService } from '../../services/userService'
import { teamService } from '../../services/teamService'

interface MentionInputProps {
  value: string
  onChange: (value: string, mentions: string[]) => void
  teamId?: string  // Changed from projectId to teamId for clarity
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
  teamId,  // Changed from projectId to teamId
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
      console.log('=== loadUsers called ===');
      console.log('Search query:', query);
      console.log('teamId:', teamId);
      console.log('currentUserId:', currentUserId);
      
      // If teamId or currentUserId is not available, don't try to load users
      if (!teamId || !currentUserId) {
        console.log('No team context or current user, returning empty array');
        setSuggestions([]);
        return;
      }
      
      let filteredUsers: MentionSuggestion[] = [];
      
      console.log('Loading users for mentions with teamId:', teamId, 'currentUserId:', currentUserId);
      // Use team-based filtering if teamId and currentUserId are provided
      const mentionableUsers = await teamService.getMentionableUsers(teamId, currentUserId);
      console.log('Mentionable users:', mentionableUsers);
      
      // If no users found, show a message
      if (mentionableUsers.length === 0) {
        console.log('No mentionable users found');
        setSuggestions([]);
        return;
      }
      
      // Case-insensitive search that matches either name or email
      const normalizedQuery = query.toLowerCase().trim();
      filteredUsers = mentionableUsers.filter(user => {
        try {
          // Handle potential undefined values
          const normalizedName = (user.name || '').toLowerCase().trim();
          const normalizedEmail = (user.email || '').toLowerCase().trim();
          const nameMatch = normalizedName.includes(normalizedQuery);
          const emailMatch = normalizedEmail.includes(normalizedQuery);
          
          // Also try matching the query as separate words (for multi-word names)
          const queryWords = normalizedQuery.split(/\s+/);
          const nameWords = normalizedName.split(/\s+/);
          const wordMatch = queryWords.every((queryWord: string) => 
            nameWords.some((nameWord: string) => nameWord.includes(queryWord))
          );
          
          console.log(`User ${user.name}: nameMatch=${nameMatch}, emailMatch=${emailMatch}, wordMatch=${wordMatch}`);
          return nameMatch || emailMatch || wordMatch;
        } catch (filterError) {
          console.error('Error filtering user:', user, filterError);
          return false;
        }
      });
      console.log('Filtered users:', filteredUsers);
      
      console.log('Setting suggestions:', filteredUsers);
      setSuggestions(filteredUsers);
    } catch (error) {
      console.error('Error loading users for mentions:', error);
      // Show a user-friendly message in the UI
      setSuggestions([]);
    }
  }, [teamId, currentUserId]);

  // Handle text change and detect @ mentions
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const cursorPosition = e.target.selectionStart
    
    console.log('=== handleTextChange called ===');
    console.log('newValue:', newValue);
    console.log('cursorPosition:', cursorPosition);
    
    // Just pass the value to the parent - let them handle mention detection if needed
    onChange(newValue, mentions)
    
    // Check if we're currently typing a new mention
    const textBeforeCursor = newValue.substring(0, cursorPosition)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
    
    console.log('textBeforeCursor:', textBeforeCursor);
    console.log('lastAtIndex:', lastAtIndex);
    
    // Only show suggestions if we found an @ and it's not too far from cursor
    if (lastAtIndex !== -1 && cursorPosition - lastAtIndex <= 50) {
      // Extract text after @ to use as search query
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1)
      console.log('textAfterAt:', textAfterAt);
      
      // Check if we're at the beginning of the text or after a space
      const isAtBeginning = lastAtIndex === 0
      const charBeforeAt = lastAtIndex > 0 ? newValue.charAt(lastAtIndex - 1) : ''
      const isAfterSpace = charBeforeAt === ' ' || charBeforeAt === '\n'
      
      // Check if there's a space in the current text after @ (meaning we're past a completed mention)
      const hasSpaceAfterAt = textAfterAt.includes(' ')
      
      console.log('isAtBeginning:', isAtBeginning);
      console.log('isAfterSpace:', isAfterSpace);
      console.log('hasSpaceAfterAt:', hasSpaceAfterAt);
      
      // Show suggestions if we're at a valid position and haven't completed the current mention
      if ((isAtBeginning || isAfterSpace) && !hasSpaceAfterAt) {
        // Show suggestions with the text after @
        setMentionQuery(textAfterAt)
        setMentionStartIndex(lastAtIndex)
        setShowSuggestions(true)
        console.log('Calling loadUsers with query:', textAfterAt);
        loadUsers(textAfterAt)
      } else {
        console.log('Hiding suggestions - invalid position or past completed mention');
        setShowSuggestions(false)
      }
    } else {
      console.log('Hiding suggestions - no @ found or too far from cursor');
      setShowSuggestions(false)
    }
  }

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: MentionSuggestion) => {
    if (mentionStartIndex === -1) return
    
    console.log('=== handleSuggestionSelect called ===');
    console.log('Selected suggestion:', suggestion);
    console.log('mentionStartIndex:', mentionStartIndex);
    console.log('mentionQuery:', mentionQuery);
    console.log('Current value:', value);
    
    const beforeMention = value.substring(0, mentionStartIndex)
    const afterMention = value.substring(mentionStartIndex + mentionQuery.length + 1)
    const newValue = `${beforeMention}@${suggestion.name} ${afterMention}`
    
    console.log('beforeMention:', beforeMention);
    console.log('afterMention:', afterMention);
    console.log('newValue after mention selection:', newValue);
    
    // Update mentions list - properly manage the mentions
    const newMentions = [...mentions.filter(m => m !== mentionQuery), suggestion.name]
    setMentions(newMentions)
    
    onChange(newValue, newMentions)
    setShowSuggestions(false)
    setMentionQuery('')
    setMentionStartIndex(-1)
    
    // Focus back to textarea and set cursor position correctly
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        // Position cursor after the inserted mention and space
        const newCursorPos = beforeMention.length + suggestion.name.length + 2 // +2 for @ and space
        console.log('Setting cursor position to:', newCursorPos);
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
      }
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
      case 'Tab':
        e.preventDefault()
        if (suggestions[selectedIndex]) {
          handleSuggestionSelect(suggestions[selectedIndex])
        }
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
    // This function is for displaying mentions with highlighting
    // We'll use a simpler approach: just return the text as is
    // The actual mention detection is handled by the handleTextChange function
    return text;
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
        className={`w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none min-h-[40px] ${className}`}
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
              No users found. Make sure you're in the same team as the person you're trying to mention.
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
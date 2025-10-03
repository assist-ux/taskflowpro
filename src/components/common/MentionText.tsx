import { Mention } from '../../types'

interface MentionTextProps {
  text: string
  mentions?: Mention[]
  className?: string
}

export default function MentionText({ text, mentions = [], className = "" }: MentionTextProps) {
  // Parse text and replace @mentions with styled spans
  const renderTextWithMentions = (text: string) => {
    // Improved regex to match @username with better handling of edge cases
    // Matches @ followed by alphanumeric characters, underscores, hyphens, and spaces
    // Stops at word boundary or specific punctuation
    const mentionRegex = /@([\w\-]+(?:\s+[\w\-]+)*)(?=\s|[.,;:!?()\\[\\]{}<>\"']|$)/g
    const parts = text.split(mentionRegex)
    
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // This is a mention - find the corresponding mention data
        const mention = mentions.find(m => m.userName === part)
        return (
          <span 
            key={index} 
            className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1 rounded font-medium"
            title={mention ? `@${mention.userName} (${mention.userEmail})` : `@${part}`}
          >
            @{part}
          </span>
        )
      }
      return part
    })
  }

  return (
    <span className={className}>
      {renderTextWithMentions(text)}
    </span>
  )
}
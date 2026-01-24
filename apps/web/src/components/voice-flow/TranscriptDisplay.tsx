import React, { useEffect, useRef } from 'react'
import { VoiceFlowTheme } from '../../lib/theme'
import { TranscriptEntry } from '../../hooks/useVoiceRecipeFlow'

interface TranscriptDisplayProps {
  entries: TranscriptEntry[]
  theme: VoiceFlowTheme
  maxHeight?: string
}

/**
 * Real-time transcript display
 * Shows conversation between user and assistant
 */
const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({
  entries,
  theme,
  maxHeight = '200px',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  
  // Auto-scroll to bottom on new entries
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [entries])
  
  if (entries.length === 0) {
    return null
  }
  
  return (
    <div 
      ref={scrollRef}
      className="overflow-y-auto px-4 py-3 space-y-3"
      style={{ 
        maxHeight,
        backgroundColor: theme.surface,
      }}
    >
      {entries.map((entry) => (
        <div
          key={entry.id}
          className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[85%] px-4 py-2.5 rounded-2xl ${
              entry.isPartial ? 'animate-pulse' : ''
            }`}
            style={{
              backgroundColor: entry.role === 'user' 
                ? theme.transcript.userBubble 
                : theme.transcript.assistantBubble,
              color: entry.role === 'user'
                ? theme.transcript.userText
                : theme.transcript.assistantText,
              borderBottomRightRadius: entry.role === 'user' ? '4px' : undefined,
              borderBottomLeftRadius: entry.role === 'assistant' ? '4px' : undefined,
            }}
          >
            {/* Role indicator */}
            <p className="text-xs font-medium opacity-60 mb-1">
              {entry.role === 'user' ? 'You' : 'Assistant'}
            </p>
            
            {/* Message text */}
            <p className="text-sm leading-relaxed">
              {entry.text}
              {entry.isPartial && (
                <span className="inline-block w-1.5 h-4 ml-0.5 animate-pulse rounded-sm" 
                  style={{ backgroundColor: 'currentColor', opacity: 0.5 }}
                />
              )}
            </p>
            
            {/* Timestamp */}
            <p className="text-xs opacity-40 mt-1">
              {entry.timestamp.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default TranscriptDisplay

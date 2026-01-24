/**
 * Theme Configuration for Voice Recipe Flow
 * 
 * Provides brandable theming for the voice-first recipe experience.
 * Change these values to customize the look and feel.
 */

export interface VoiceFlowTheme {
  // Brand colors
  primary: string
  primaryHover: string
  primaryLight: string
  primaryDark: string
  
  // State colors
  active: string
  activeLight: string
  activePulse: string
  
  // Neutral colors
  background: string
  surface: string
  surfaceHover: string
  border: string
  
  // Text colors
  text: string
  textMuted: string
  textOnPrimary: string
  
  // Accent colors
  error: string
  errorLight: string
  success: string
  successLight: string
  
  // Component-specific
  micButton: {
    idle: string
    idleHover: string
    listening: string
    listeningPulse: string
    disabled: string
  }
  
  transcript: {
    userBubble: string
    userText: string
    assistantBubble: string
    assistantText: string
  }
}

/**
 * Default theme - Modern, clean aesthetic
 */
export const defaultTheme: VoiceFlowTheme = {
  // Brand colors - Blue/Indigo
  primary: '#4F46E5',
  primaryHover: '#4338CA',
  primaryLight: '#EEF2FF',
  primaryDark: '#3730A3',
  
  // State colors - Green for active/listening
  active: '#10B981',
  activeLight: '#D1FAE5',
  activePulse: '#34D399',
  
  // Neutral colors
  background: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceHover: '#F3F4F6',
  border: '#E5E7EB',
  
  // Text colors
  text: '#111827',
  textMuted: '#6B7280',
  textOnPrimary: '#FFFFFF',
  
  // Accent colors
  error: '#EF4444',
  errorLight: '#FEE2E2',
  success: '#10B981',
  successLight: '#D1FAE5',
  
  // Component-specific
  micButton: {
    idle: '#4F46E5',
    idleHover: '#4338CA',
    listening: '#10B981',
    listeningPulse: '#34D399',
    disabled: '#9CA3AF',
  },
  
  transcript: {
    userBubble: '#EEF2FF',
    userText: '#3730A3',
    assistantBubble: '#F3F4F6',
    assistantText: '#374151',
  },
}

/**
 * Dark theme variant
 */
export const darkTheme: VoiceFlowTheme = {
  // Brand colors
  primary: '#818CF8',
  primaryHover: '#A5B4FC',
  primaryLight: '#1E1B4B',
  primaryDark: '#6366F1',
  
  // State colors
  active: '#34D399',
  activeLight: '#064E3B',
  activePulse: '#6EE7B7',
  
  // Neutral colors
  background: '#111827',
  surface: '#1F2937',
  surfaceHover: '#374151',
  border: '#374151',
  
  // Text colors
  text: '#F9FAFB',
  textMuted: '#9CA3AF',
  textOnPrimary: '#111827',
  
  // Accent colors
  error: '#F87171',
  errorLight: '#7F1D1D',
  success: '#34D399',
  successLight: '#064E3B',
  
  // Component-specific
  micButton: {
    idle: '#818CF8',
    idleHover: '#A5B4FC',
    listening: '#34D399',
    listeningPulse: '#6EE7B7',
    disabled: '#4B5563',
  },
  
  transcript: {
    userBubble: '#1E1B4B',
    userText: '#C7D2FE',
    assistantBubble: '#374151',
    assistantText: '#E5E7EB',
  },
}

/**
 * Create a custom theme by merging with defaults
 */
export const createTheme = (overrides: Partial<VoiceFlowTheme>): VoiceFlowTheme => ({
  ...defaultTheme,
  ...overrides,
  micButton: {
    ...defaultTheme.micButton,
    ...overrides.micButton,
  },
  transcript: {
    ...defaultTheme.transcript,
    ...overrides.transcript,
  },
})

/**
 * CSS variable generator for theme
 */
export const themeToCSS = (theme: VoiceFlowTheme): Record<string, string> => ({
  '--vf-primary': theme.primary,
  '--vf-primary-hover': theme.primaryHover,
  '--vf-primary-light': theme.primaryLight,
  '--vf-primary-dark': theme.primaryDark,
  '--vf-active': theme.active,
  '--vf-active-light': theme.activeLight,
  '--vf-active-pulse': theme.activePulse,
  '--vf-background': theme.background,
  '--vf-surface': theme.surface,
  '--vf-surface-hover': theme.surfaceHover,
  '--vf-border': theme.border,
  '--vf-text': theme.text,
  '--vf-text-muted': theme.textMuted,
  '--vf-text-on-primary': theme.textOnPrimary,
  '--vf-error': theme.error,
  '--vf-error-light': theme.errorLight,
  '--vf-success': theme.success,
  '--vf-success-light': theme.successLight,
  '--vf-mic-idle': theme.micButton.idle,
  '--vf-mic-idle-hover': theme.micButton.idleHover,
  '--vf-mic-listening': theme.micButton.listening,
  '--vf-mic-listening-pulse': theme.micButton.listeningPulse,
  '--vf-mic-disabled': theme.micButton.disabled,
  '--vf-transcript-user-bubble': theme.transcript.userBubble,
  '--vf-transcript-user-text': theme.transcript.userText,
  '--vf-transcript-assistant-bubble': theme.transcript.assistantBubble,
  '--vf-transcript-assistant-text': theme.transcript.assistantText,
})

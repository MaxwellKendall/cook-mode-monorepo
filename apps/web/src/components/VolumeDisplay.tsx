import React, { useState, useRef, useEffect, useCallback } from 'react'

interface VolumeDisplayProps {
  error: string | null;
  isMuted: boolean;
  isConnected: boolean;
  isLoading: boolean;
  onMuteToggle: () => void;
}

const VolumeDisplay: React.FC<VolumeDisplayProps> = ({ isMuted, isConnected, isLoading, onMuteToggle }) => {
  const [micVolume, setMicVolume] = useState(0)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Initialize audio context and microphone monitoring
  const initializeAudioMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      
      const audioContext = audioContextRef.current
      analyserRef.current = audioContext.createAnalyser()
      analyserRef.current.fftSize = 256
      
      microphoneRef.current = audioContext.createMediaStreamSource(stream)
      microphoneRef.current.connect(analyserRef.current)
      
      // Start monitoring microphone levels
      monitorMicrophoneLevels()
      
    } catch (err) {
      console.error('Failed to initialize audio monitoring:', err)
      setError('Microphone access denied. Please allow microphone access to use voice assistant.')
    }
  }

  useEffect(() => {
    if (isConnected) {
      initializeAudioMonitoring()
    } else {
        cleanupAudioMonitoring()
    }
  }, [isConnected])

  // Monitor microphone levels
  const monitorMicrophoneLevels = () => {
    if (!analyserRef.current) return
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    
    const updateVolume = () => {
      analyserRef.current!.getByteFrequencyData(dataArray)
      // Calculate average volume
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length
      const normalizedVolume = (average / 255) * 100
      
      setMicVolume(normalizedVolume)
      animationFrameRef.current = requestAnimationFrame(updateVolume)
    }
    
    updateVolume()
  }

  // Cleanup audio monitoring
  const cleanupAudioMonitoring = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    
    if (microphoneRef.current) {
      microphoneRef.current.disconnect()
      microphoneRef.current = null
    }
    
    if (analyserRef.current) {
      analyserRef.current.disconnect()
      analyserRef.current = null
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close()
      audioContextRef.current = null
    }
    
    setMicVolume(0)
  }


  const updateVolume = useCallback(() => {
    if (analyserRef.current && isConnected) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
      analyserRef.current.getByteFrequencyData(dataArray)
      
      // Calculate average volume
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
      const normalizedVolume = (average / 255) * 100
      
      setMicVolume(normalizedVolume)
      animationFrameRef.current = requestAnimationFrame(updateVolume)
    }
  }, [isConnected])

  useEffect(() => {
    if (isConnected && streamRef.current) {
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(streamRef.current)
      const analyser = audioContext.createAnalyser()
      
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser
      
      updateVolume()
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      setMicVolume(0)
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isConnected, updateVolume])

  if (error) return null;
  if (!isConnected && !isLoading) return null;

  return (
    <div className="mt-4 pt-4 border-t border-green-200">
        <div className="space-y-4">
            {/* Loading state while connecting */}
            {isLoading && (
                <div className="flex flex-col items-center space-y-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500"></div>
                </div>
            )}
            {!isLoading && isConnected && (
                <div className="flex flex-col items-center space-y-3">
                    {/* Symmetric center-outward animation */}
                    <div className="flex items-center justify-center h-8 w-20">
                        <div className="flex items-center h-full space-x-1">
                        {/* Left bars */}
                        {[...Array(4)].map((_, i) => {
                            const index = 3 - i // Reverse order for left side
                            const threshold = index * 11.1 // 0, 11.1, 22.2, 33.3
                            const isActive = micVolume > threshold
                            const maxHeight = 100 - (index * 15) // Gradual height decrease from left
                            return (
                            <div
                                key={`left-${index}`}
                                className={`w-1 rounded-full transition-all duration-150 ease-out ${
                                isActive && !isMuted ? 'bg-green-500' : 'bg-green-200'
                                }`}
                                style={{
                                height: isActive && !isMuted
                                    ? `${Math.min(maxHeight, Math.max(20, (micVolume / 100) * maxHeight))}%`
                                    : '20%'
                                }}
                            />
                            )
                        })}
                        
                        {/* Center indicator */}
                        <div 
                            className={`w-1 rounded-full transition-all duration-150 ease-out mx-1 ${
                            micVolume > 5 && !isMuted ? 'bg-green-500' : 'bg-green-200'
                            }`}
                            style={{
                            height: micVolume > 5 && !isMuted
                                ? `${Math.min(100, Math.max(20, (micVolume / 100) * 100))}%`
                                : '20%'
                            }}
                        />
                        
                        {/* Right bars */}
                        {[...Array(4)].map((_, i) => {
                            const index = i
                            const threshold = index * 11.1 // 0, 11.1, 22.2, 33.3 (relative to right side)
                            const isActive = micVolume > threshold
                            const maxHeight = 100 - (index * 15) // Gradual height decrease from center
                            return (
                            <div
                                key={`right-${index}`}
                                className={`w-1 rounded-full transition-all duration-150 ease-out ${
                                isActive && !isMuted ? 'bg-green-500' : 'bg-green-200'
                                }`}
                                style={{
                                height: isActive && !isMuted
                                    ? `${Math.min(maxHeight, Math.max(20, (micVolume / 100) * maxHeight))}%`
                                    : '20%'
                                }}
                            />
                            )
                        })}
                        </div>
                    </div>
                    {/* Mute button */}
                    <button
                        onClick={onMuteToggle}
                        className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 ${
                        isMuted 
                            ? 'bg-red-500 hover:bg-red-600 text-white' 
                            : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                        title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                    >
                        {isMuted ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                        </svg>
                        ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                        )}
                    </button>
                </div>
            )}
        </div>
    </div>
  )
}

export default VolumeDisplay

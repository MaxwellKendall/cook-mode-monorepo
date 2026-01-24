import React from 'react'

interface LoadingStateProps {
  message: string
}

// Modern spinner component
const ModernSpinner: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => (
  <div className={`${className} animate-spin`}>
    <svg
      className="w-full h-full"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  </div>
)

const LoadingState: React.FC<LoadingStateProps> = ({ message }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
      <ModernSpinner className="w-12 h-12 text-blue-500 mx-auto mb-4" />
      <p className="text-gray-600">{message}</p>
    </div>
  )
}

export default LoadingState

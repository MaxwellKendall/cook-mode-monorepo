import React from 'react'

interface ErrorStateProps {
  error: string
  onBack: () => void
}

const ErrorState: React.FC<ErrorStateProps> = ({ error, onBack }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
      <div className="text-red-500 text-6xl mb-4">😕</div>
      <h1 className="text-xl font-semibold text-gray-900 mb-2">There was an error loading this recipe</h1>
      <p className="text-gray-600 mb-6">
        {error || 'The recipe you\'re looking for doesn\'t exist or has been removed.'}
      </p>
      <button
        onClick={onBack}
        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors duration-200"
      >
        Back to Dashboard
      </button>
    </div>
  )
}

export default ErrorState

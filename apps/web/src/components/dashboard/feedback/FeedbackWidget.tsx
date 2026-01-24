import React from 'react'

interface FeedbackWidgetProps {
  isOpen: boolean
  onToggle: () => void
}

const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({ isOpen, onToggle }) => {
  return (
    <div className="fixed right-0 bottom-0 z-40">
      <div className="relative">
        {/* Feedback Button */}
        <button
          onClick={onToggle}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 rounded-l-lg shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:-translate-x-1"
          title="Leave Beta Feedback"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
        
        {/* Feedback Panel */}
        {isOpen && (
          <div className="absolute right-full bottom-0 mr-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900">Beta Feedback</h3>
              <button
                onClick={onToggle}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-600 mb-4">
              Help us improve! Share your thoughts about the beta experience.
            </p>
            <a
              href="https://cook-mode.canny.io/cook-mode"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
              onClick={onToggle}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open Feedback Form
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

export default FeedbackWidget

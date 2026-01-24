import React, { useState, useRef, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCrown, faCheck, faInfinity, faStar } from '@fortawesome/free-solid-svg-icons'
import { SUBSCRIPTION_PLANS, createCheckoutSession } from '../services/subscriptionService'
import { useAuth } from '../contexts/AuthContext'
import { useParams } from 'react-router-dom'

interface UpgradePromptProps {
  onClose?: () => void
  isModal?: boolean
}

const UpgradePrompt: React.FC<UpgradePromptProps> = ({ onClose, isModal = false }) => {
  const recipeId = useParams().recipeId
  const [selectedPlan, setSelectedPlan] = useState(SUBSCRIPTION_PLANS[0])
  const [isLoading, setIsLoading] = useState(false)
  const { user } = useAuth()
  const modalRef = useRef<HTMLDivElement>(null)

  // Handle click outside modal to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isModal && modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose?.()
      }
    }

    if (isModal) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isModal, onClose])

  const handleUpgrade = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      await createCheckoutSession(selectedPlan.stripePriceId, user.id, user.email, recipeId)
    } catch (error) {
      console.error('Upgrade error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const containerClasses = isModal 
    ? "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    : "w-full"

  const contentClasses = isModal
    ? "bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
    : "bg-white rounded-2xl shadow-xl"

  return (
    <div className={containerClasses}>
      <div className={contentClasses} ref={modalRef}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-t-2xl">
          <div className="text-center">
            <FontAwesomeIcon icon={faCrown} className="text-4xl mb-4 text-yellow-300" />
            <h2 className="text-3xl font-bold mb-2">Upgrade Your Cooking Experience</h2>
            <p className="text-blue-100 text-lg">
              {`Get ${selectedPlan.minutes} minutes of voice assistance for only $${selectedPlan.price}/${selectedPlan.interval}`}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Primary CTA - Above the Fold */}
          <div className="text-center mb-8">
            <button
              onClick={handleUpgrade}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <FontAwesomeIcon 
                    icon={faStar} 
                    className="text-yellow-300 mr-2 animate-pulse" 
                  />
                  Processing...
                </div>
              ) : (
                `Upgrade Now - $${selectedPlan.price}/${selectedPlan.interval}`
              )}
            </button>
            
            {onClose && (
              <button
                onClick={onClose}
                className="mt-4 text-gray-500 hover:text-gray-700 transition-colors text-sm"
              >
                Maybe Later
              </button>
            )}
          </div>

          {/* Plan Selection */}
          <div className="grid gap-4 mb-6">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
                  selectedPlan.id === plan.id
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedPlan(plan)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                    <p className="text-gray-600">
                      ${plan.price}/{plan.interval}
                    </p>
                  </div>
                  {selectedPlan.id === plan.id && (
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <FontAwesomeIcon icon={faCheck} className="text-white text-sm" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <FontAwesomeIcon icon={faCheck} className="text-green-500 mr-2" />
                    <span className="text-gray-700 font-semibold">{plan.minutes} minutes per month</span>
                  </div>
                  {plan.features.slice(1).map((feature, idx) => (
                    <div key={idx} className="flex items-center text-sm">
                      <FontAwesomeIcon icon={faCheck} className="text-green-500 mr-2" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Free Tier Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="text-lg font-semibold mb-3 text-gray-900">Free Tier:</h3>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center">
                <FontAwesomeIcon icon={faCheck} className="text-green-500 mr-2" />
                <span className="text-gray-700">10 free minutes (one-time)</span>
              </div>
              <div className="flex items-center">
                <FontAwesomeIcon icon={faCheck} className="text-green-500 mr-2" />
                <span className="text-gray-700">Unlimited recipe imports</span>
              </div>
              <div className="flex items-center">
                <FontAwesomeIcon icon={faCheck} className="text-green-500 mr-2" />
                <span className="text-gray-700">Unlimited recipe searches</span>
              </div>
              <div className="flex items-center">
                <FontAwesomeIcon icon={faCheck} className="text-green-500 mr-2" />
                <span className="text-gray-700">Unlimited recipe saves</span>
              </div>
            </div>
          </div>

          {/* Security Note */}
          <p className="text-xs text-gray-500 text-center">
            🔒 Secure payment powered by Stripe. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  )
}

export default UpgradePrompt

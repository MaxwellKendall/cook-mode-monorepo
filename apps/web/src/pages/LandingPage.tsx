import React, { useState, useEffect, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePostHog } from '@posthog/react'
import { POSTHOG_EVENTS } from '../lib/posthogEvents'

// Feature flag for A/B testing (0-4 to select which hero copy option to use)
const HERO_COPY_VARIANT = 0
// Landing page hero content constants for A/B testing
// Use | as delimiter to mark which part of the header should have the gradient
interface ValueProposition {
  title: string
  description: string
  action: string
}

interface HeroCopy {
  headline: string
  description: string
  valueLine: string
  ctaText: string
}


const HERO_COPY_OPTIONS: HeroCopy[] = [
  {
    headline: "Follow every recipe with | confidence",
    description: "Need substitutions? Dont know a technique? Questions? All answered.",
    valueLine: "Hands-free guidance while you cook. Import, organize, and discover your recipes.",
    ctaText: "Try Cook Mode free →"
  },
  {
    headline: "Your recipes, | spoken aloud",
    description: "Import recipes from anywhere. Get voice reminders while you cook.",
    valueLine: "Cook clean, focused, and hands-free",
    ctaText: "Try it free →"
  },
  {
    headline: "Cook without | touching your phone",
    description: "Voice guidance for the recipes you already use. Adapt on the fly based on what you have.",
    valueLine: "Hands-free cooking that works",
    ctaText: "Start cooking →"
  },
  {
    headline: "Voice reminders | while you cook",
    description: "Hands-free cooking with recipes you already love. No installation required.",
    valueLine: "Your recipes, your way, hands-free",
    ctaText: "Get started →"
  },
  {
    headline: "Stop touching | your phone",
    description: "Get reminders of ingredients, amounts, and next steps. Import recipes from anywhere.",
    valueLine: "Cook with your voice, not your hands",
    ctaText: "Try hands-free cooking →"
  }
]

// All value propositions (static across all variants)
const VALUE_PROPOSITIONS: ValueProposition[] = [
  {
    title: "Adapt on the fly",
    description: "Switch up ingredients. Scale with confidence.",
    action: "Adapt your recipes →"
  },
  {
    title: "Discover recipes using natural language",
    description: "Just type what you're looking for: \"easy chicken dinner\"",
    action: "Search recipes →"
  },
  {
    title: "Your personal cookbook",
    description: "Import recipes from anywhere on the web. Organize them into collections using hashtags.",
    action: "Save your recipes →"
  }
]

// How it works steps
const HOW_IT_WORKS_STEPS = [
  "Import a recipe you already use by pasting a URL in the search bar",
  "Cook hands-free with voice guidance",
  "Ask questions and adapt as you go"
]

// Example questions users can ask
const EXAMPLE_QUESTIONS = [
  "Can I substitute this ingredient?",
  "How can I adapt this recipe for my diet?",
  "Can you explain how to do this technique?",
  "Can I use a pressure cooker for this?"
]

// Final CTA section copy
const FINAL_CTA = {
  headline: "Ready to cook with confidence? ✨",
  buttonText: "Try Cook Mode free →",
  reassurance: "Free to start • Sign-in required"
}

interface FAQItem {
  question: string
  answer: string | ReactNode
}

const LandingPage: React.FC = () => {
  const navigate = useNavigate()
  const posthog = usePostHog()
  // Open "Is it free to use?" by default
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  
  // Get the selected hero copy variant
  const heroCopy = HERO_COPY_OPTIONS[HERO_COPY_VARIANT] || HERO_COPY_OPTIONS[0]
  
  // Split headline for gradient if it contains delimiter
  const headlineParts = heroCopy.headline.includes('|') 
    ? heroCopy.headline.split('|')
    : [heroCopy.headline]

  const faqData: FAQItem[] = [
    {
      question: "Is it free to use?",
      answer: (
        <div className="text-gray-600 text-left leading-relaxed">
          <p className="mb-2">Yes! You can import and save unlimited recipes for free.</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Free plan: 10 minutes of voice cooking assistance (one-time)</li>
            <li>Starter: $5/month for 40 minutes</li>
            <li>Cook: $8/month for 60 minutes</li>
            <li>Chef: $10/month for 80 minutes</li>
          </ul>
        </div>
      )
    },
    {
      question: "What is cook mode?",
      answer: "Most recipe blogs have a 'cook mode' button. Our button connects you to our voice assistant."
    },
    {
      question: "Can I import recipes from anywhere?",
      answer: "Yes! You can import recipes from anywhere. We add support for more recipe sources everyday. For now, most recipes from TikTok, Pintrest, and any blog will work."
    },
    {
      question: "Do I need to install anything?",
      answer: "No installation required! Voice Cooking works entirely in your web browser. Just grant microphone access when prompted and you're ready to start cooking with voice guidance."
    },
    {
      question: "Can I use it on my phone?",
      answer: "Yes! Voice Cooking works on both desktop and mobile devices. The voice assistant is optimized for hands-free cooking, making it perfect for use on your phone in the kitchen."
    }
  ]

  // Track landing page view
  useEffect(() => {
    posthog?.capture(POSTHOG_EVENTS.landingPageViewed, {
      heroVariant: HERO_COPY_VARIANT,
    })
  }, [posthog])

  const handleTryNow = (location: 'hero' | 'final' = 'hero') => {
    // Track CTA click
    posthog?.capture(POSTHOG_EVENTS.landingPageCtaClicked, {
      heroVariant: HERO_COPY_VARIANT,
      ctaText: location === 'hero' ? heroCopy.ctaText : FINAL_CTA.buttonText,
      location,
    })
    
    // Navigate to login page which now includes sign-up functionality
    navigate('/login')
  }

  const handleValuePropositionClick = (title: string, action: string) => {
    // Track value proposition click
    posthog?.capture(POSTHOG_EVENTS.landingPageValuePropClicked, {
      valuePropTitle: title,
      actionText: action,
    })
    
    // Navigate to login page
    navigate('/login')
  }

  const toggleFaq = (index: number) => {
    const isOpening = openFaq !== index
    setOpenFaq(openFaq === index ? null : index)
    
    // Track FAQ interaction
    if (isOpening) {
      posthog?.capture(POSTHOG_EVENTS.landingPageFaqOpened, {
        faqIndex: index,
        faqQuestion: faqData[index].question,
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">

      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-6 py-12 md:py-16">
        <div className="text-center">
          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4 leading-tight">
            {headlineParts.length > 1 ? (
              <>
                {headlineParts[0]}
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {headlineParts[1]}
                </span>
              </>
            ) : (
              headlineParts[0]
            )}
        </h1>
          
          {/* Description */}
          <p className="text-lg md:text-xl text-gray-600 mb-6 max-w-2xl mx-auto">
            {heroCopy.description}
          </p>
          
          {/* CTA */}
          <button
            onClick={() => handleTryNow('hero')}
            className="bg-gray-900 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-800 transition-colors text-base mb-3"
          >
            {heroCopy.ctaText}
          </button>
          
          {/* Value Line */}
          <p className="text-sm text-gray-500">
            {heroCopy.valueLine}
          </p>
        </div>
      </div>

      {/* Value Propositions Section */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {VALUE_PROPOSITIONS.map((prop, index) => (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 text-center flex flex-col">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{prop.title}</h3>
              <p className="text-gray-600 leading-relaxed mb-4 flex-grow">{prop.description}</p>
              {prop.action && (
                <a 
                  href="#" 
                  onClick={(e) => { 
                    e.preventDefault(); 
                    handleValuePropositionClick(prop.title, prop.action); 
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium inline-block mt-auto"
                >
                  {prop.action}
                </a>
              )}
            </div>
          ))}
              </div>
            </div>

      {/* How It Works Section */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          How it works
        </h2>
        <div className="space-y-4">
          {HOW_IT_WORKS_STEPS.map((step, index) => (
            <div key={index} className="text-center">
              <p className="text-lg text-gray-700">
                {index + 1}. {step}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Example Questions Section */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          Example questions you can ask 💭
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {EXAMPLE_QUESTIONS.map((question, index) => (
            <div 
              key={index} 
              className="bg-white rounded-lg border border-gray-200 p-4 text-center"
            >
              <p className="text-gray-700 italic">
                "{question}"
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-6">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-12">
            Frequently Asked Questions
          </h3>
          
          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <div key={index} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-900">{faq.question}</span>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                      openFaq === index ? 'rotate-45' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
                
                {openFaq === index && (
                  <div className="px-6 pb-4">
                    {typeof faq.answer === 'string' ? (
                    <p className="text-gray-600 text-left leading-relaxed">{faq.answer}</p>
                    ) : (
                      faq.answer
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            {FINAL_CTA.headline}
          </h2>
          <button
            onClick={() => handleTryNow('final')}
            className="bg-gray-900 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors text-lg mb-3"
          >
            {FINAL_CTA.buttonText}
          </button>
          <p className="text-sm text-gray-500">
            {FINAL_CTA.reassurance}
          </p>
        </div>
      </div>
    </div>
  )
}

export default LandingPage

import React, { useState, useEffect, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePostHog } from '@posthog/react'
import { POSTHOG_EVENTS } from '../lib/posthogEvents'

interface FAQItem {
  question: string
  answer: string | ReactNode
}

const VALUE_PROPOSITIONS = [
  {
    title: "AI Meal Planning",
    description: "Snap a photo of your pantry, get a personalized 3-meal plan in seconds.",
    action: "Try it now",
    href: "/pantry",
  },
  {
    title: "Voice Cooking",
    description: "Hands-free recipe guidance. Ask questions and adapt as you go.",
    action: "Browse recipes",
    href: "/search?q=dinner",
  },
  {
    title: "Recipe Collection",
    description: "Import recipes from any URL. Save, organize, and search with natural language.",
    action: "Search recipes",
    href: "/search?q=easy+chicken",
  },
]

const HOW_IT_WORKS_STEPS = [
  "Snap a photo of your pantry or type what you have",
  "Get a personalized 3-meal plan",
  "Cook hands-free with voice guidance",
]

const EXAMPLE_QUESTIONS = [
  "Can I substitute this ingredient?",
  "How can I adapt this recipe for my diet?",
  "Can you explain how to do this technique?",
  "Can I use a pressure cooker for this?",
]

const LandingPage: React.FC = () => {
  const navigate = useNavigate()
  const posthog = usePostHog()
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const faqData: FAQItem[] = [
    {
      question: "Is it free to use?",
      answer: (
        <div className="text-gray-600 text-left leading-relaxed">
          <p className="mb-2">Yes! Most features are free. Here's how the two plans compare:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Free: 2 weekly meal plans/month, unlimited grocery lists, single meal generation, recipe browsing &amp; saves, 10 min voice trial</li>
            <li>Pro ($8/month): Unlimited plans, plan history, household sharing, unlimited meal swaps, 60 min/mo voice cooking</li>
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

  useEffect(() => {
    posthog?.capture(POSTHOG_EVENTS.landingPageViewed)
  }, [posthog])

  const handlePantryClick = () => {
    posthog?.capture(POSTHOG_EVENTS.landingPageCtaClicked, {
      ctaText: 'Scan Your Pantry',
      location: 'hero',
    })
    navigate('/pantry')
  }

  const handleSearchClick = () => {
    posthog?.capture(POSTHOG_EVENTS.landingPageCtaClicked, {
      ctaText: 'Search for a recipe',
      location: 'hero',
    })
    navigate('/search?q=dinner')
  }

  const handleValuePropClick = (title: string, href: string) => {
    posthog?.capture(POSTHOG_EVENTS.landingPageValuePropClicked, {
      valuePropTitle: title,
    })
    navigate(href)
  }

  const toggleFaq = (index: number) => {
    const isOpening = openFaq !== index
    setOpenFaq(openFaq === index ? null : index)

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
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4 leading-tight">
            What's in your{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              kitchen?
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Snap a photo of your pantry. Get a personalized meal plan in seconds.
          </p>

          {/* Primary CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
            <button
              onClick={handlePantryClick}
              className="flex items-center gap-2 bg-gray-900 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors text-base"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Scan Your Pantry
            </button>
            <button
              onClick={handleSearchClick}
              className="text-gray-700 font-medium hover:text-blue-600 transition-colors text-base"
            >
              Or search for a recipe →
            </button>
          </div>

          <p className="text-sm text-gray-500">
            No sign-up required to get started
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
              <button
                onClick={() => handleValuePropClick(prop.title, prop.href)}
                className="text-blue-600 hover:text-blue-700 font-medium inline-block mt-auto"
              >
                {prop.action} →
              </button>
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
          Ask anything while you cook
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
            Ready to cook with what you have?
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-3">
            <button
              onClick={() => {
                posthog?.capture(POSTHOG_EVENTS.landingPageCtaClicked, {
                  ctaText: 'Scan Your Pantry',
                  location: 'final',
                })
                navigate('/pantry')
              }}
              className="flex items-center gap-2 bg-gray-900 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors text-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Scan Your Pantry
            </button>
            <button
              onClick={() => {
                posthog?.capture(POSTHOG_EVENTS.landingPageCtaClicked, {
                  ctaText: 'Search recipes',
                  location: 'final',
                })
                navigate('/search?q=dinner')
              }}
              className="text-gray-700 font-medium hover:text-blue-600 transition-colors text-lg"
            >
              Or search for a recipe →
            </button>
          </div>
          <p className="text-sm text-gray-500">
            Free to start · No sign-up required
          </p>
        </div>
      </div>
    </div>
  )
}

export default LandingPage

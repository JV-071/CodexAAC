'use client'

import { useState, useEffect } from 'react'

export default function HeroBanner() {
  const images = [
    '/images/character.png',
    '/images/character2.png',
  ]

  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [images.length])

  return (
    <div className="w-full py-3 sm:py-4">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative w-full h-[300px] sm:h-[350px] md:h-[380px] lg:h-[420px] overflow-hidden rounded-xl border-2 border-[#404040]/60 shadow-xl">
          {images.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={image}
                alt={`Banner ${index + 1}`}
                className="w-full h-full object-cover object-center"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1200" height="500"%3E%3Crect fill="%231a1a2e" width="1200" height="500"/%3E%3Ctext fill="%23ffd700" x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-size="48" font-weight="bold"%3ETIBIA%3C/text%3E%3C/svg%3E'
                }}
              />
            </div>
          ))}
          
          {/* Gradient Overlay - improved to avoid colliding with text */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a]/95 via-[#1a1a1a]/40 to-transparent"></div>
          
          {/* Overlay Text e CTAs */}
          <div className="absolute inset-0 flex flex-col justify-end">
            <div className="w-full px-6 sm:px-8 pb-4 sm:pb-6 space-y-3 sm:space-y-4">
              <div className="text-white max-w-2xl">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 drop-shadow-lg">Welcome to CodexAAC</h1>
                <p className="text-base sm:text-lg md:text-xl text-gray-100 drop-shadow-md mb-6">Experience the adventure in our world</p>
              </div>
              
              {/* Call-to-Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="/create-account"
                  className="inline-flex items-center justify-center gap-2 bg-[#ffd700] hover:bg-[#ffed4e] text-[#0a0a0a] font-bold py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base"
                >
                  <span>✨</span>
                  Create Account
                </a>
                <a
                  href="/download"
                  className="inline-flex items-center justify-center gap-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base"
                >
                  <span>⬇️</span>
                  Download Client
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

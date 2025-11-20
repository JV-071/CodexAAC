'use client'

import { useEffect, useState } from 'react'

interface NewsItem {
  date: string
  title: string
}

export default function NewsTicker() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const news: NewsItem[] = [
    { date: '13 Nov 2025', title: '[World Transfer]' },
    { date: '09 Nov 2025', title: '[Event Schedule]' },
    { date: '06 Nov 2025', title: '[Tenebrium]' },
    { date: '27 Oct 2025', title: '[Prestige Arena]' },
    { date: '17 Oct 2025', title: '[Sites Fraudulentos]' },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % news.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [news.length])

  const currentNews = news[currentIndex]

  return (
    <div className="bg-[#1a1a1a]/90 backdrop-blur-sm rounded border border-[#3a3a3a] p-4 shadow-lg">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-[#ffd700] font-bold text-sm uppercase tracking-wide whitespace-nowrap">
          News Ticker
        </h3>
        <div className="flex-1 flex items-center gap-2 text-[#d4d4d4] text-sm min-w-0">
          <span className="text-[#666] whitespace-nowrap text-xs">{currentNews.date}</span>
          <span>-</span>
          <span className="truncate">{currentNews.title}</span>
        </div>
        <div className="flex gap-1">
          {news.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-[#ffd700]' : 'bg-[#3a3a3a]'
              }`}
              aria-label={`Go to news ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}


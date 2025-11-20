'use client'

export default function NewsSection() {
  const newsItems = [
    {
      icon: '📢',
      title: 'Server Update',
      description: 'Important updates and improvements coming to our server...',
      time: '2 hours ago',
      image: '/images/news/server-update.jpg',
    },
    {
      icon: '🎉',
      title: 'Weekend Event',
      description: 'Double experience and special rewards this weekend!',
      time: '1 day ago',
      image: '/images/news/weekend-event.jpg',
    },
  ]

  return (
    <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border border-[#404040]/60 p-4 sm:p-6 shadow-xl">
      <h2 className="text-[#ffd700] text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 pb-3 border-b-2 border-[#ffd700]/30">Latest News</h2>
      
      <div className="space-y-3 sm:space-y-4">
        {newsItems.map((item, index) => (
          <div
            key={index}
            className="bg-[#1f1f1f]/80 rounded-lg border border-[#404040]/50 p-4 sm:p-5 hover:border-[#ffd700]/60 hover:bg-[#252525]/90 transition-all duration-200 shadow-md overflow-hidden"
          >
            <div className="flex items-start gap-3 sm:gap-4">
              {/* Thumbnail Image */}
              <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border border-[#404040]/50 bg-[#0a0a0a]">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to icon if image doesn't exist
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center text-3xl">${item.icon}</div>`
                  }}
                />
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-[#ffd700] font-bold text-base sm:text-lg">{item.title}</h3>
                  <span className="text-[#888] text-xs whitespace-nowrap">{item.time}</span>
                </div>
                <p className="text-[#d0d0d0] text-xs sm:text-sm mb-2 leading-relaxed">{item.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

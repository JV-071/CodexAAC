'use client'

import { useState } from 'react'

export default function CharacterSearch() {
  const [characterName, setCharacterName] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (characterName.trim()) {
      window.location.href = `/characters/${characterName}`
    }
  }

  return (
    <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 p-4 sm:p-6 shadow-2xl ring-2 ring-[#ffd700]/10">
      <h2 className="text-[#ffd700] text-xl sm:text-2xl font-bold mb-4 sm:mb-6 pb-3 border-b border-[#404040]/40 flex items-center gap-2">
        <span>🔍</span> CHARACTERS
      </h2>
      
      <form onSubmit={handleSearch} className="space-y-4">
        <div>
          <input
            type="text"
            value={characterName}
            onChange={(e) => setCharacterName(e.target.value)}
            className="w-full bg-[#1a1a1a] border-2 border-[#404040]/60 rounded-lg px-4 py-3 text-[#e0e0e0] focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 transition-all placeholder:text-[#666]"
            placeholder="Character name"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[#ff6600] hover:bg-[#ff7700] text-white font-bold py-3 px-4 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
        >
          Search
        </button>
      </form>
    </div>
  )
}


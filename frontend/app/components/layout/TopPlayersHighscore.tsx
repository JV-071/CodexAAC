'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '../../services/api'
import type { ApiResponse } from '../../types/account'
import type { RankingResponse } from '../../types/ranking'
import { makeOutfit } from '../../utils/outfit'

export default function TopPlayersHighscore() {
  const [ranking, setRanking] = useState<RankingResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTopPlayers = async () => {
      try {
        const params = new URLSearchParams({
          type: 'level',
          limit: '3',
          page: '1',
        })

        const response = await api.get<ApiResponse<RankingResponse>>(
          `/ranking?${params.toString()}`,
          { public: true }
        )
        if (response && response.data) {
          setRanking(response.data)
        }
      } catch (err) {
        console.error('Error loading top players:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTopPlayers()
  }, [])

  const getMedal = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇'
      case 2:
        return '🥈'
      case 3:
        return '🥉'
      default:
        return null
    }
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-[#ffd700] to-[#ffed4e]'
      case 2:
        return 'from-[#c0c0c0] to-[#e8e8e8]'
      case 3:
        return 'from-[#cd7f32] to-[#daa06d]'
      default:
        return 'from-[#404040] to-[#505050]'
    }
  }

  const getRankGlow = (rank: number) => {
    switch (rank) {
      case 1:
        return 'shadow-[0_0_20px_rgba(255,215,0,0.5)]'
      case 2:
        return 'shadow-[0_0_15px_rgba(192,192,192,0.4)]'
      case 3:
        return 'shadow-[0_0_15px_rgba(205,127,50,0.4)]'
      default:
        return ''
    }
  }

  return (
    <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 p-4 sm:p-6 shadow-2xl ring-2 ring-[#ffd700]/10">
      <h2 className="text-[#ffd700] text-xl sm:text-2xl font-bold mb-4 sm:mb-6 pb-3 border-b border-[#404040]/40 flex items-center gap-2">
        <span className="text-2xl animate-pulse">🏆</span>
        Top Players
      </h2>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#ffd700] mb-2" />
            <p className="text-[#888] text-sm">Loading...</p>
          </div>
        </div>
      ) : ranking && ranking.players.length > 0 ? (
        <div className="space-y-3">
          {ranking.players.map((player, index) => {
            const medal = getMedal(player.rank)
            const isTopThree = player.rank <= 3

            return (
              <Link
                key={`${player.name}-${index}`}
                href={`/characters/${player.name}`}
                className={`block group relative overflow-hidden rounded-lg border-2 transition-all duration-300 hover:scale-[1.02] ${
                  isTopThree
                    ? `bg-gradient-to-r ${getRankColor(player.rank)} border-[#ffd700]/50 ${getRankGlow(player.rank)}`
                    : 'bg-[#1a1a1a]/80 border-[#404040]/60 hover:border-[#505050]'
                }`}
              >
                <div className="p-3 flex items-center gap-3">
                  {/* Rank & Medal */}
                  <div className="flex-shrink-0">
                    {medal ? (
                      <div className={`text-3xl ${player.rank === 1 ? 'animate-pulse' : ''} transition-transform group-hover:scale-110`}>
                        {medal}
                      </div>
                    ) : (
                      <div className="w-10 h-10 flex items-center justify-center bg-[#2a2a2a] rounded-full border border-[#404040] transition-transform group-hover:scale-110">
                        <span className="text-[#888] font-bold text-sm">#{player.rank}</span>
                      </div>
                    )}
                  </div>

                  {/* Character Outfit */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 flex items-end justify-start bg-[#0a0a0a]/50 rounded border border-[#404040]/30 overflow-hidden pb-1">
                      {player.lookType > 0 ? (
                        <img
                          src={makeOutfit({
                            id: player.lookType,
                            addons: player.lookAddons,
                            head: player.lookHead,
                            body: player.lookBody,
                            legs: player.lookLegs,
                            feet: player.lookFeet,
                          })}
                          alt={player.name}
                          className="w-full h-full object-contain object-bottom transition-transform duration-300 group-hover:scale-110"
                          style={{ transform: 'scale(1.5) translateX(-8px) translateY(-6px)' }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : (
                        <span className="text-2xl">👤</span>
                      )}
                    </div>
                  </div>

                  {/* Player Info */}
                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold truncate ${isTopThree ? 'text-[#0a0a0a]' : 'text-white group-hover:text-[#ffd700]'} transition-colors`}>
                      {player.name}
                    </div>
                    <div className={`text-xs ${isTopThree ? 'text-[#0a0a0a]/80' : 'text-[#888]'}`}>
                      {player.vocation} • Level {player.level}
                    </div>
                  </div>

                  {/* Level Badge */}
                  <div className="flex-shrink-0">
                    <div className={`px-3 py-1.5 rounded-lg font-bold text-sm ${
                      isTopThree
                        ? 'bg-[#0a0a0a]/30 text-[#0a0a0a]'
                        : 'bg-[#ffd700]/20 text-[#ffd700]'
                    }`}>
                      {player.level}
                    </div>
                  </div>
                </div>

                {/* Shine effect for top 3 */}
                {isTopThree && (
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                )}
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-[#888]">
          <p>No players found</p>
        </div>
      )}
    </div>
  )
}


'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { api } from '../services/api'
import { makeOutfit } from '../utils/outfit'
import type { OnlinePlayer, PaginationInfo, OnlinePlayersResponse } from '../types/character'

export default function PlayersOnlinePage() {
  const [players, setPlayers] = useState<OnlinePlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const LIMIT_PER_PAGE = 50

  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: LIMIT_PER_PAGE,
    total: 0,
    totalPages: 0,
  })

  const fetchOnlinePlayers = useCallback(async (searchTerm: string = '', pageNum: number = 1) => {
    try {
      setLoading(true)
      setError('')
      const params = new URLSearchParams()
      if (searchTerm) {
        params.set('search', searchTerm)
      }
      params.set('page', String(pageNum))
      params.set('limit', String(LIMIT_PER_PAGE))
      
      const response = await api.get<{ data: OnlinePlayersResponse }>(`/players/online?${params.toString()}`, { public: true })
      if (response.data) {
        setPlayers(response.data.players || [])
        setPagination(response.data.pagination || { page: 1, limit: LIMIT_PER_PAGE, total: 0, totalPages: 0 })
      }
    } catch (err: any) {
      setError(err.message || 'Error loading online players')
      setPlayers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    let timeoutId: NodeJS.Timeout | null = null

    if (search) {
      timeoutId = setTimeout(() => {
        if (isMounted) {
          setPage(1)
          fetchOnlinePlayers(search, 1)
        }
      }, 500)
    } else {
      setPage(1)
      fetchOnlinePlayers('', 1)
    }

    return () => {
      isMounted = false
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [search, fetchOnlinePlayers])

  useEffect(() => {
    if (page === 1) {
      return
    }
    fetchOnlinePlayers(search, page)
  }, [page, fetchOnlinePlayers, search])

  return (
    <div>
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold">
              <span className="text-[#ffd700]">PLAYERS</span>
              <span className="text-[#3b82f6]"> ONLINE</span>
            </h1>
            <Link
              href="/"
              className="text-[#3b82f6] hover:text-[#60a5fa] text-sm hover:underline"
            >
              ← Back to Home
            </Link>
          </div>

          {loading ? (
            <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 p-6 shadow-2xl text-center">
              <div className="text-[#ffd700] text-2xl font-bold mb-4">Loading players...</div>
              <div className="text-[#d0d0d0]">Please wait</div>
            </div>
          ) : error ? (
            <div className="bg-red-900/30 border border-red-700 rounded-xl p-6 text-center">
              <h2 className="text-red-300 text-2xl font-bold mb-2">Error</h2>
              <p className="text-red-200">{error}</p>
            </div>
          ) : (
            <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 p-6 shadow-2xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-[#ffd700] text-xl sm:text-2xl font-bold">
                  Online Players ({pagination.total || players.length})
                </h2>
                <div className="w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Search player name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full sm:w-64 bg-[#1a1a1a] border-2 border-[#404040]/60 rounded-lg px-4 py-2 text-[#e0e0e0] focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 transition-all placeholder:text-[#666]"
                  />
                </div>
              </div>
              {players.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-[#ffd700] text-2xl font-bold mb-4">No Players Online</div>
                  <div className="text-[#d0d0d0]">
                    {search ? `No players found matching "${search}"` : 'There are currently no players online'}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {players.map((player) => {
                    const outfitUrl = makeOutfit({
                      id: player.lookType,
                      addons: player.lookAddons,
                      head: player.lookHead,
                      body: player.lookBody,
                      legs: player.lookLegs,
                      feet: player.lookFeet,
                    })

                    return (
                      <Link
                        key={player.name}
                        href={`/characters/${player.name}`}
                        className="bg-[#1a1a1a] border-2 border-[#404040]/60 rounded-lg p-4 hover:border-[#3b82f6]/60 hover:bg-[#1f1f1f] transition-all group shadow-lg hover:shadow-xl hover:scale-[1.02]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 w-16 h-16 bg-[#0a0a0a] rounded border-2 border-[#404040]/60 overflow-hidden flex items-center justify-center">
                            <img
                              src={outfitUrl}
                              alt={`${player.name} outfit`}
                              className="w-full h-full object-contain object-center"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[#3b82f6] font-bold text-base group-hover:text-[#60a5fa] truncate mb-1">
                              {player.name}
                            </div>
                            <div className="text-[#d0d0d0] text-sm space-y-1">
                              <div>
                                <span className="text-[#ffd700] font-semibold">Level {player.level}</span>
                              </div>
                              <div className="text-[#888] text-xs">
                                {player.vocation}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-[#1a1a1a] border-2 border-[#404040]/60 rounded-lg text-[#e0e0e0] hover:border-[#3b82f6]/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Previous
                  </button>
                  <span className="text-[#d0d0d0] px-4">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                    className="px-4 py-2 bg-[#1a1a1a] border-2 border-[#404040]/60 rounded-lg text-[#e0e0e0] hover:border-[#3b82f6]/60 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}


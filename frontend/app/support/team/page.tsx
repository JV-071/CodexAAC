'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { api } from '../../services/api'
import type { ApiResponse } from '../../types/account'
import type { TeamResponse, TeamPlayer } from '../../types/team'
import { makeOutfit } from '../../utils/outfit'

export default function TeamPage() {
	const [team, setTeam] = useState<TeamResponse | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')

	const fetchTeam = useCallback(async () => {
		setLoading(true)
		setError('')
		try {
			const response = await api.get<ApiResponse<TeamResponse>>(
				`/team`,
				{ public: true }
			)
			if (response && response.data) {
				setTeam(response.data)
			}
		} catch (err: any) {
			setError(err.message || 'Error loading team')
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		fetchTeam()
	}, [fetchTeam])

	const renderTeamTable = (players: TeamPlayer[] | null | undefined, title: string) => {
		if (!players || players.length === 0) {
			return null
		}

		return (
			<div className="mb-8">
				<h2 className="text-2xl font-bold text-[#ffd700] mb-4">{title}</h2>
				<div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#404040]/60 shadow-2xl overflow-hidden">
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead className="bg-[#1a1a1a] border-b-2 border-[#404040]">
								<tr>
									<th className="px-6 py-4 w-24 text-left text-[#ffd700] font-bold text-sm uppercase tracking-wide"></th>
									<th className="px-6 py-4 w-48 text-left text-[#ffd700] font-bold text-sm uppercase tracking-wide">Role</th>
									<th className="px-6 py-4 w-64 text-left text-[#ffd700] font-bold text-sm uppercase tracking-wide">Name</th>
									<th className="px-6 py-4 w-40 text-left text-[#ffd700] font-bold text-sm uppercase tracking-wide">World</th>
								</tr>
							</thead>
							<tbody>
								{players.map((player, index) => (
									<tr
										key={`${player.name}-${index}`}
										className="border-b border-[#404040]/30 hover:bg-[#1a1a1a]/50 transition-colors"
									>
										<td className="px-6 py-4 w-24">
											<div className="w-12 h-12 flex items-end justify-start flex-shrink-0 bg-[#0a0a0a]/50 rounded border border-[#404040]/30 overflow-hidden pb-1">
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
														className="w-full h-full object-contain object-bottom"
														style={{ transform: 'scale(1.5) translateX(-8px) translateY(-6px)' }}
														onError={(e) => {
															e.currentTarget.style.display = 'none'
														}}
													/>
												) : (
													<span className="text-2xl">👤</span>
												)}
											</div>
										</td>
										<td className="px-6 py-4 w-48">
											<span className="text-[#e0e0e0] font-semibold">{player.role}</span>
										</td>
										<td className="px-6 py-4 w-64">
											<Link
												href={`/characters/${encodeURIComponent(player.name)}`}
												className="font-semibold text-white hover:text-[#ffd700] transition-colors"
											>
												{player.name}
											</Link>
										</td>
										<td className="px-6 py-4 w-40">
											<span className="text-[#e0e0e0]">{player.world}</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen">
			<div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="mb-8">
					<div className="flex items-center gap-4 mb-4">
						<div className="w-16 h-16 bg-gradient-to-br from-[#ffd700] to-[#ffed4e] rounded-xl flex items-center justify-center shadow-lg">
							<span className="text-3xl">👥</span>
						</div>
						<div>
							<h1 className="text-4xl font-bold text-[#ffd700] mb-2">Team</h1>
							<p className="text-[#888]">Our support and administration team</p>
						</div>
					</div>
				</div>

				{error && (
					<div className="bg-red-900/30 border-2 border-red-600 rounded-lg p-4 mb-6">
						<p className="text-red-400">{error}</p>
					</div>
				)}

				{loading ? (
					<div className="flex items-center justify-center py-20">
						<div className="text-center">
							<div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ffd700] mb-4" />
							<p className="text-[#888]">Loading team...</p>
						</div>
					</div>
				) : team ? (
					<>
						{renderTeamTable(team.tutors, 'Tutors')}
						{renderTeamTable(team.administration, 'Administration')}

						{(!team.tutors || team.tutors.length === 0) && (!team.administration || team.administration.length === 0) && (
							<div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#404040]/60 p-12 text-center">
								<p className="text-[#888] text-lg">No team members found</p>
							</div>
						)}
					</>
				) : (
					<div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#404040]/60 p-12 text-center">
						<p className="text-[#888] text-lg">No team members found</p>
					</div>
				)}
			</div>
		</div>
	)
}

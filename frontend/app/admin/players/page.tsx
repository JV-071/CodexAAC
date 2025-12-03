'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '../../services/api'
import type { ApiResponse } from '../../types/account'
import type { AdminPlayer, AdminPlayersResponse } from '../../types/admin'

const handleAdminError = (err: any, router: { replace: (path: string) => void }): boolean => {
	const status = err.status || err.response?.status

	if (status === 404) {
		router.replace('/not-found')
		return true
	}
	return false
}

interface EditPlayerModalProps {
	player: AdminPlayer | null
	isOpen: boolean
	onClose: () => void
	onSave: (playerId: number, data: any) => Promise<void>
}

function EditPlayerModal({ player, isOpen, onClose, onSave }: EditPlayerModalProps) {
	const [formData, setFormData] = useState({
		name: '',
		accountId: 0,
		level: 0,
		experience: 0,
		health: 0,
		healthMax: 0,
		mana: 0,
		manaMax: 0,
		magicLevel: 0,
		skillFist: 10,
		skillClub: 10,
		skillSword: 10,
		skillAxe: 10,
		skillDist: 10,
		skillShielding: 10,
		skillFishing: 10,
		soul: 0,
		cap: 0,
		townId: 0,
		groupId: 1,
	})
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState('')

	useEffect(() => {
		if (player) {
			setFormData({
				name: player.name,
				accountId: player.accountId,
				level: player.level,
				experience: player.experience,
				health: player.health,
				healthMax: player.healthMax,
				mana: player.mana,
				manaMax: player.manaMax,
				magicLevel: player.magicLevel,
				skillFist: player.skillFist,
				skillClub: player.skillClub,
				skillSword: player.skillSword,
				skillAxe: player.skillAxe,
				skillDist: player.skillDist,
				skillShielding: player.skillShielding,
				skillFishing: player.skillFishing,
				soul: player.soul,
				cap: player.cap,
				townId: player.townId,
				groupId: player.groupId,
			})
			setError('')
		}
	}, [player])

	if (!isOpen || !player) return null

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setSaving(true)
		setError('')
		try {
			await onSave(player.id, formData)
			onClose()
		} catch (err: any) {
			setError(err.message || 'Error saving player')
		} finally {
			setSaving(false)
		}
	}

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<div className="bg-[#1f1f1f] rounded-xl border-2 border-[#ffd700]/30 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
				<div className="p-6">
					<div className="flex items-center justify-between mb-6">
						<h2 className="text-2xl font-bold text-[#ffd700]">Edit Player</h2>
						<button
							onClick={onClose}
							className="text-[#888] hover:text-[#e0e0e0] text-2xl"
						>
							×
						</button>
					</div>

					<div className="mb-4 p-4 bg-[#252525] rounded-lg">
						<p className="text-sm text-[#888] mb-1">Player ID</p>
						<p className="text-[#e0e0e0] font-semibold">{player.id}</p>
					</div>

					{error && (
						<div className="bg-red-900/30 border-2 border-red-600 rounded-lg p-4 mb-4">
							<p className="text-red-400">{error}</p>
						</div>
					)}

					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block text-[#e0e0e0] font-semibold mb-2">
									Name
								</label>
								<input
									type="text"
									value={formData.name}
									onChange={(e) => setFormData({ ...formData, name: e.target.value })}
									className="w-full px-4 py-2 bg-[#252525] border-2 border-[#404040] rounded-lg text-[#e0e0e0] focus:border-[#ffd700] focus:outline-none"
									required
								/>
							</div>

							<div>
								<label className="block text-[#e0e0e0] font-semibold mb-2">
									Account ID
								</label>
								<input
									type="number"
									value={formData.accountId}
									onChange={(e) => setFormData({ ...formData, accountId: parseInt(e.target.value) || 0 })}
									className="w-full px-4 py-2 bg-[#252525] border-2 border-[#404040] rounded-lg text-[#e0e0e0] focus:border-[#ffd700] focus:outline-none"
									min="1"
									required
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block text-[#e0e0e0] font-semibold mb-2">
									Level
								</label>
								<input
									type="number"
									value={formData.level}
									onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) || 0 })}
									className="w-full px-4 py-2 bg-[#252525] border-2 border-[#404040] rounded-lg text-[#e0e0e0] focus:border-[#ffd700] focus:outline-none"
									min="1"
								/>
							</div>

							<div>
								<label className="block text-[#e0e0e0] font-semibold mb-2">
									Experience
								</label>
								<input
									type="number"
									value={formData.experience}
									onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })}
									className="w-full px-4 py-2 bg-[#252525] border-2 border-[#404040] rounded-lg text-[#e0e0e0] focus:border-[#ffd700] focus:outline-none"
									min="0"
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block text-[#e0e0e0] font-semibold mb-2">
									Health
								</label>
								<input
									type="number"
									value={formData.health}
									onChange={(e) => setFormData({ ...formData, health: parseInt(e.target.value) || 0 })}
									className="w-full px-4 py-2 bg-[#252525] border-2 border-[#404040] rounded-lg text-[#e0e0e0] focus:border-[#ffd700] focus:outline-none"
									min="0"
								/>
							</div>

							<div>
								<label className="block text-[#e0e0e0] font-semibold mb-2">
									Max Health
								</label>
								<input
									type="number"
									value={formData.healthMax}
									onChange={(e) => setFormData({ ...formData, healthMax: parseInt(e.target.value) || 0 })}
									className="w-full px-4 py-2 bg-[#252525] border-2 border-[#404040] rounded-lg text-[#e0e0e0] focus:border-[#ffd700] focus:outline-none"
									min="0"
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block text-[#e0e0e0] font-semibold mb-2">
									Mana
								</label>
								<input
									type="number"
									value={formData.mana}
									onChange={(e) => setFormData({ ...formData, mana: parseInt(e.target.value) || 0 })}
									className="w-full px-4 py-2 bg-[#252525] border-2 border-[#404040] rounded-lg text-[#e0e0e0] focus:border-[#ffd700] focus:outline-none"
									min="0"
								/>
							</div>

							<div>
								<label className="block text-[#e0e0e0] font-semibold mb-2">
									Max Mana
								</label>
								<input
									type="number"
									value={formData.manaMax}
									onChange={(e) => setFormData({ ...formData, manaMax: parseInt(e.target.value) || 0 })}
									className="w-full px-4 py-2 bg-[#252525] border-2 border-[#404040] rounded-lg text-[#e0e0e0] focus:border-[#ffd700] focus:outline-none"
									min="0"
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block text-[#e0e0e0] font-semibold mb-2">
									Magic Level
								</label>
								<input
									type="number"
									value={formData.magicLevel}
									onChange={(e) => setFormData({ ...formData, magicLevel: parseInt(e.target.value) || 0 })}
									className="w-full px-4 py-2 bg-[#252525] border-2 border-[#404040] rounded-lg text-[#e0e0e0] focus:border-[#ffd700] focus:outline-none"
									min="0"
								/>
							</div>

							<div>
								<label className="block text-[#e0e0e0] font-semibold mb-2">
									Soul
								</label>
								<input
									type="number"
									value={formData.soul}
									onChange={(e) => setFormData({ ...formData, soul: parseInt(e.target.value) || 0 })}
									className="w-full px-4 py-2 bg-[#252525] border-2 border-[#404040] rounded-lg text-[#e0e0e0] focus:border-[#ffd700] focus:outline-none"
									min="0"
								/>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="block text-[#e0e0e0] font-semibold mb-2">
									Capacity
								</label>
								<input
									type="number"
									value={formData.cap}
									onChange={(e) => setFormData({ ...formData, cap: parseInt(e.target.value) || 0 })}
									className="w-full px-4 py-2 bg-[#252525] border-2 border-[#404040] rounded-lg text-[#e0e0e0] focus:border-[#ffd700] focus:outline-none"
									min="0"
								/>
							</div>

							<div>
								<label className="block text-[#e0e0e0] font-semibold mb-2">
									Town ID
								</label>
								<input
									type="number"
									value={formData.townId}
									onChange={(e) => setFormData({ ...formData, townId: parseInt(e.target.value) || 0 })}
									className="w-full px-4 py-2 bg-[#252525] border-2 border-[#404040] rounded-lg text-[#e0e0e0] focus:border-[#ffd700] focus:outline-none"
									min="0"
								/>
							</div>
						</div>

						<div>
							<label className="block text-[#e0e0e0] font-semibold mb-2">
								Group ID
							</label>
							<select
								value={formData.groupId}
								onChange={(e) => setFormData({ ...formData, groupId: parseInt(e.target.value) || 1 })}
								className="w-full px-4 py-2 bg-[#252525] border-2 border-[#404040] rounded-lg text-[#e0e0e0] focus:border-[#ffd700] focus:outline-none"
							>
								<option value="1">Player</option>
								<option value="2">Tutor</option>
								<option value="3">Senior Tutor</option>
								<option value="4">Gamemaster</option>
								<option value="5">Community Manager</option>
								<option value="6">Administrator</option>
							</select>
						</div>

						<div className="border-t-2 border-[#404040] pt-4">
							<h3 className="text-lg font-bold text-[#ffd700] mb-4">Skills</h3>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-[#e0e0e0] font-semibold mb-2">
										Fist Fighting
									</label>
									<input
										type="number"
										value={formData.skillFist}
										onChange={(e) => setFormData({ ...formData, skillFist: parseInt(e.target.value) || 10 })}
										className="w-full px-4 py-2 bg-[#252525] border-2 border-[#404040] rounded-lg text-[#e0e0e0] focus:border-[#ffd700] focus:outline-none"
										min="10"
									/>
								</div>

								<div>
									<label className="block text-[#e0e0e0] font-semibold mb-2">
										Club Fighting
									</label>
									<input
										type="number"
										value={formData.skillClub}
										onChange={(e) => setFormData({ ...formData, skillClub: parseInt(e.target.value) || 10 })}
										className="w-full px-4 py-2 bg-[#252525] border-2 border-[#404040] rounded-lg text-[#e0e0e0] focus:border-[#ffd700] focus:outline-none"
										min="10"
									/>
								</div>

								<div>
									<label className="block text-[#e0e0e0] font-semibold mb-2">
										Sword Fighting
									</label>
									<input
										type="number"
										value={formData.skillSword}
										onChange={(e) => setFormData({ ...formData, skillSword: parseInt(e.target.value) || 10 })}
										className="w-full px-4 py-2 bg-[#252525] border-2 border-[#404040] rounded-lg text-[#e0e0e0] focus:border-[#ffd700] focus:outline-none"
										min="10"
									/>
								</div>

								<div>
									<label className="block text-[#e0e0e0] font-semibold mb-2">
										Axe Fighting
									</label>
									<input
										type="number"
										value={formData.skillAxe}
										onChange={(e) => setFormData({ ...formData, skillAxe: parseInt(e.target.value) || 10 })}
										className="w-full px-4 py-2 bg-[#252525] border-2 border-[#404040] rounded-lg text-[#e0e0e0] focus:border-[#ffd700] focus:outline-none"
										min="10"
									/>
								</div>

								<div>
									<label className="block text-[#e0e0e0] font-semibold mb-2">
										Distance Fighting
									</label>
									<input
										type="number"
										value={formData.skillDist}
										onChange={(e) => setFormData({ ...formData, skillDist: parseInt(e.target.value) || 10 })}
										className="w-full px-4 py-2 bg-[#252525] border-2 border-[#404040] rounded-lg text-[#e0e0e0] focus:border-[#ffd700] focus:outline-none"
										min="10"
									/>
								</div>

								<div>
									<label className="block text-[#e0e0e0] font-semibold mb-2">
										Shielding
									</label>
									<input
										type="number"
										value={formData.skillShielding}
										onChange={(e) => setFormData({ ...formData, skillShielding: parseInt(e.target.value) || 10 })}
										className="w-full px-4 py-2 bg-[#252525] border-2 border-[#404040] rounded-lg text-[#e0e0e0] focus:border-[#ffd700] focus:outline-none"
										min="10"
									/>
								</div>

								<div>
									<label className="block text-[#e0e0e0] font-semibold mb-2">
										Fishing
									</label>
									<input
										type="number"
										value={formData.skillFishing}
										onChange={(e) => setFormData({ ...formData, skillFishing: parseInt(e.target.value) || 10 })}
										className="w-full px-4 py-2 bg-[#252525] border-2 border-[#404040] rounded-lg text-[#e0e0e0] focus:border-[#ffd700] focus:outline-none"
										min="10"
									/>
								</div>
							</div>
						</div>

						<div className="flex gap-4 justify-end pt-4">
							<button
								type="button"
								onClick={onClose}
								className="px-6 py-3 bg-[#404040] hover:bg-[#505050] text-white rounded-lg font-bold transition-all"
							>
								Cancel
							</button>
							<button
								type="submit"
								disabled={saving}
								className="px-6 py-3 bg-[#ffd700] hover:bg-[#ffd33d] rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{saving ? 'Saving...' : 'Save Changes'}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	)
}

interface SQLModalProps {
	player: AdminPlayer | null
	isOpen: boolean
	onClose: () => void
	onExecute: (playerId: number, sql: string) => Promise<void>
}

function SQLModal({ player, isOpen, onClose, onExecute }: SQLModalProps) {
	const [sql, setSql] = useState('')
	const [executing, setExecuting] = useState(false)
	const [error, setError] = useState('')
	const [result, setResult] = useState<any>(null)

	useEffect(() => {
		if (player && isOpen) {
			setSql(`UPDATE players SET \n  level = ${player.level},\n  experience = ${player.experience}\nWHERE id = ${player.id};`)
			setError('')
			setResult(null)
		}
	}, [player, isOpen])

	if (!isOpen || !player) return null

	const handleExecute = async () => {
		if (!sql.trim()) {
			setError('SQL query cannot be empty')
			return
		}

		setExecuting(true)
		setError('')
		setResult(null)
		try {
			await onExecute(player.id, sql)
			setResult({ success: true, message: 'SQL executed successfully' })
		} catch (err: any) {
			setError(err.message || 'Error executing SQL')
			setResult(null)
		} finally {
			setExecuting(false)
		}
	}

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<div className="bg-[#1f1f1f] rounded-xl border-2 border-[#ffd700]/30 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
				<div className="p-6">
					<div className="flex items-center justify-between mb-6">
						<h2 className="text-2xl font-bold text-[#ffd700]">Execute SQL Query</h2>
						<button
							onClick={onClose}
							className="text-[#888] hover:text-[#e0e0e0] text-2xl"
						>
							×
						</button>
					</div>

					<div className="mb-4 p-4 bg-[#252525] rounded-lg">
						<p className="text-sm text-[#888] mb-1">Player ID</p>
						<p className="text-[#e0e0e0] font-semibold">{player.id}</p>
					</div>

					<div className="mb-4">
						<label className="block text-[#e0e0e0] font-semibold mb-2">
							SQL Query
						</label>
						<textarea
							value={sql}
							onChange={(e) => setSql(e.target.value)}
							className="w-full px-4 py-2 bg-[#252525] border-2 border-[#404040] rounded-lg text-[#e0e0e0] focus:border-[#ffd700] focus:outline-none font-mono text-sm"
							rows={10}
							placeholder="Enter SQL query here..."
						/>
						<p className="text-xs text-[#888] mt-2">
							⚠️ Warning: Execute SQL queries with caution. Make sure you know what you're doing.
						</p>
					</div>

					{error && (
						<div className="bg-red-900/30 border-2 border-red-600 rounded-lg p-4 mb-4">
							<p className="text-red-400">{error}</p>
						</div>
					)}

					{result && (
						<div className="bg-green-900/30 border-2 border-green-600 rounded-lg p-4 mb-4">
							<p className="text-green-300">{result.message}</p>
						</div>
					)}

					<div className="flex gap-4 justify-end">
						<button
							type="button"
							onClick={onClose}
							className="px-6 py-3 bg-[#404040] hover:bg-[#505050] text-white rounded-lg font-bold transition-all"
						>
							Close
						</button>
						<button
							type="button"
							onClick={handleExecute}
							disabled={executing || !sql.trim()}
							className="px-6 py-3 bg-[#ffd700] hover:bg-[#ffd33d] rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{executing ? 'Executing...' : 'Execute SQL'}
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}

export default function ManagePlayersPage() {
	const router = useRouter()
	const [players, setPlayers] = useState<AdminPlayer[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [search, setSearch] = useState('')
	const [page, setPage] = useState(1)
	const [limit] = useState(50)
	const [totalPages, setTotalPages] = useState(1)
	const [total, setTotal] = useState(0)
	const [selectedPlayer, setSelectedPlayer] = useState<AdminPlayer | null>(null)
	const [editModalOpen, setEditModalOpen] = useState(false)
	const [sqlModalOpen, setSqlModalOpen] = useState(false)
	const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

	const fetchPlayers = useCallback(async () => {
		setLoading(true)
		setError('')
		try {
			const params = new URLSearchParams({
				page: page.toString(),
				limit: limit.toString(),
			})
			if (search) {
				params.append('search', search)
			}

			const response = await api.get<ApiResponse<AdminPlayersResponse>>(`/admin/players?${params.toString()}`)
			if (response && response.data) {
				setPlayers(response.data.players)
				setTotalPages(response.data.pagination.totalPages)
				setTotal(response.data.pagination.total)
				setIsAuthorized(true)
			}
		} catch (err: any) {
			if (handleAdminError(err, router)) {
				return
			}
			setIsAuthorized(false)
			setError('Error fetching players')
		} finally {
			setLoading(false)
		}
	}, [page, limit, search, router])

	useEffect(() => {
		fetchPlayers()
	}, [fetchPlayers])

	const handleEditPlayer = async (playerId: number, data: any) => {
		try {
			const updateData: any = {}
			if (data.name !== undefined) updateData.name = data.name
			if (data.accountId !== undefined) updateData.accountId = data.accountId
			if (data.level !== undefined) updateData.level = data.level
			if (data.experience !== undefined) updateData.experience = data.experience
			if (data.health !== undefined) updateData.health = data.health
			if (data.healthMax !== undefined) updateData.healthMax = data.healthMax
			if (data.mana !== undefined) updateData.mana = data.mana
			if (data.manaMax !== undefined) updateData.manaMax = data.manaMax
			if (data.magicLevel !== undefined) updateData.magicLevel = data.magicLevel
			if (data.skillFist !== undefined) updateData.skillFist = data.skillFist
			if (data.skillClub !== undefined) updateData.skillClub = data.skillClub
			if (data.skillSword !== undefined) updateData.skillSword = data.skillSword
			if (data.skillAxe !== undefined) updateData.skillAxe = data.skillAxe
			if (data.skillDist !== undefined) updateData.skillDist = data.skillDist
			if (data.skillShielding !== undefined) updateData.skillShielding = data.skillShielding
			if (data.skillFishing !== undefined) updateData.skillFishing = data.skillFishing
			if (data.soul !== undefined) updateData.soul = data.soul
			if (data.cap !== undefined) updateData.cap = data.cap
			if (data.townId !== undefined) updateData.townId = data.townId
			if (data.groupId !== undefined) updateData.groupId = data.groupId

			await api.put<ApiResponse<any>>(`/admin/player?id=${playerId}`, updateData)
			fetchPlayers()
		} catch (err: any) {
			throw new Error(err.message || 'Error updating player')
		}
	}

	const handleExecuteSQL = async (playerId: number, sql: string) => {
		try {
			const response = await api.post<ApiResponse<any>>(`/admin/player/sql?id=${playerId}`, {
				sql: sql,
			})
			fetchPlayers()
			return response
		} catch (err: any) {
			throw new Error(err.message || 'Error executing SQL')
		}
	}

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault()
		setPage(1)
		fetchPlayers()
	}

	const getStatusBadge = (status: string) => {
		const statusMap: Record<string, { label: string; color: string }> = {
			'online': { label: 'Online', color: 'bg-green-900/30 text-green-300 border-green-600' },
			'offline': { label: 'Offline', color: 'bg-gray-900/30 text-gray-300 border-gray-600' },
		}
		const statusInfo = statusMap[status] || { label: status, color: 'bg-[#404040] text-[#888] border-[#505050]' }
		return (
			<span className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${statusInfo.color}`}>
				{statusInfo.label}
			</span>
		)
	}

	const getGroupBadge = (groupId: number) => {
		const groupMap: Record<number, { label: string; color: string }> = {
			1: { label: 'Player', color: 'bg-blue-900/30 text-blue-300 border-blue-600' },
			2: { label: 'Tutor', color: 'bg-purple-900/30 text-purple-300 border-purple-600' },
			3: { label: 'Senior Tutor', color: 'bg-indigo-900/30 text-indigo-300 border-indigo-600' },
			4: { label: 'Gamemaster', color: 'bg-yellow-900/30 text-yellow-300 border-yellow-600' },
			5: { label: 'Community Manager', color: 'bg-orange-900/30 text-orange-300 border-orange-600' },
			6: { label: 'Administrator', color: 'bg-red-900/30 text-red-300 border-red-600' },
		}
		const groupInfo = groupMap[groupId] || { label: `Group ${groupId}`, color: 'bg-[#404040] text-[#888] border-[#505050]' }
		return (
			<span className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${groupInfo.color}`}>
				{groupInfo.label}
			</span>
		)
	}

	if (isAuthorized === false) {
		return null
	}

	if (isAuthorized === null || loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ffd700] mb-4"></div>
					<p className="text-[#888]">Loading players...</p>
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
							<span className="text-3xl">📊</span>
						</div>
						<div>
							<h1 className="text-4xl font-bold text-[#ffd700] mb-2">Manage Players</h1>
							<p className="text-[#888]">View and manage player characters</p>
						</div>
					</div>
				</div>

				{error && (
					<div className="bg-red-900/30 border-2 border-red-600 rounded-lg p-4 mb-6">
						<p className="text-red-400">{error}</p>
					</div>
				)}

				<div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 p-6 mb-6 shadow-2xl">
					<form onSubmit={handleSearch} className="flex gap-4">
						<input
							type="text"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search by name..."
							className="flex-1 px-4 py-2 bg-[#1f1f1f] border-2 border-[#404040] rounded-lg text-[#e0e0e0] focus:border-[#ffd700] focus:outline-none"
						/>
						<button
							type="submit"
							className="px-6 py-2 bg-[#ffd700] hover:bg-[#ffd33d] rounded-lg font-bold transition-all"
						>
							Search
						</button>
						{search && (
							<button
								type="button"
								onClick={() => {
									setSearch('')
									setPage(1)
								}}
								className="px-6 py-2 bg-[#404040] hover:bg-[#505050] rounded-lg font-bold transition-all"
							>
								Clear
							</button>
						)}
					</form>
				</div>

				<div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 shadow-2xl overflow-hidden">
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead className="bg-[#1f1f1f]">
								<tr>
									<th className="px-6 py-4 text-left text-sm font-semibold text-[#ffd700]">ID</th>
									<th className="px-6 py-4 text-left text-sm font-semibold text-[#ffd700]">Name</th>
									<th className="px-6 py-4 text-left text-sm font-semibold text-[#ffd700]">Account</th>
									<th className="px-6 py-4 text-left text-sm font-semibold text-[#ffd700]">Vocation</th>
									<th className="px-6 py-4 text-left text-sm font-semibold text-[#ffd700]">Level</th>
									<th className="px-6 py-4 text-left text-sm font-semibold text-[#ffd700]">Experience</th>
									<th className="px-6 py-4 text-left text-sm font-semibold text-[#ffd700]">Status</th>
									<th className="px-6 py-4 text-left text-sm font-semibold text-[#ffd700]">Group</th>
									<th className="px-6 py-4 text-left text-sm font-semibold text-[#ffd700]">Guild</th>
									<th className="px-6 py-4 text-center text-sm font-semibold text-[#ffd700]">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-[#404040]">
								{players.length === 0 ? (
									<tr>
										<td colSpan={10} className="px-6 py-8 text-center text-[#888]">
											No players found
										</td>
									</tr>
								) : (
									players.map((player) => (
										<tr key={player.id} className="hover:bg-[#1f1f1f]/50 transition-colors">
											<td className="px-6 py-4 text-[#e0e0e0]">{player.id}</td>
											<td className="px-6 py-4 text-[#e0e0e0] font-semibold">{player.name}</td>
											<td className="px-6 py-4 text-[#e0e0e0] text-sm">{player.accountEmail}</td>
											<td className="px-6 py-4 text-[#e0e0e0]">{player.vocation}</td>
											<td className="px-6 py-4 text-[#e0e0e0] font-semibold">{player.level}</td>
											<td className="px-6 py-4 text-[#e0e0e0]">{player.experience.toLocaleString()}</td>
											<td className="px-6 py-4">{getStatusBadge(player.status)}</td>
											<td className="px-6 py-4">{getGroupBadge(player.groupId)}</td>
											<td className="px-6 py-4 text-[#e0e0e0] text-sm">
												{player.guildName || '-'}
												{player.guildRank && ` (${player.guildRank})`}
											</td>
											<td className="px-6 py-4">
												<div className="flex gap-2 justify-center">
													<button
														onClick={() => {
															setSelectedPlayer(player)
															setEditModalOpen(true)
														}}
														className="px-3 py-1 bg-[#3b82f6] hover:bg-[#2563eb] rounded text-sm font-semibold transition-all"
														title="Edit Player"
													>
														✏️
													</button>
													<button
														onClick={() => {
															setSelectedPlayer(player)
															setSqlModalOpen(true)
														}}
														className="px-3 py-1 bg-[#8b5cf6] hover:bg-[#7c3aed] rounded text-sm font-semibold transition-all"
														title="Execute SQL"
													>
														▶️
													</button>
												</div>
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>

					{totalPages > 1 && (
						<div className="px-6 py-4 bg-[#1f1f1f] flex items-center justify-between">
							<div className="text-[#888] text-sm">
								Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} players
							</div>
							<div className="flex gap-2">
								<button
									onClick={() => setPage(p => Math.max(1, p - 1))}
									disabled={page === 1}
									className="px-4 py-2 bg-[#404040] hover:bg-[#505050] rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
								>
									Previous
								</button>
								<span className="px-4 py-2 text-[#e0e0e0] font-semibold">
									Page {page} of {totalPages}
								</span>
								<button
									onClick={() => setPage(p => Math.min(totalPages, p + 1))}
									disabled={page === totalPages}
									className="px-4 py-2 bg-[#404040] hover:bg-[#505050] rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
								>
									Next
								</button>
							</div>
						</div>
					)}
				</div>
			</div>

			<EditPlayerModal
				player={selectedPlayer}
				isOpen={editModalOpen}
				onClose={() => {
					setEditModalOpen(false)
					setSelectedPlayer(null)
				}}
				onSave={handleEditPlayer}
			/>

			<SQLModal
				player={selectedPlayer}
				isOpen={sqlModalOpen}
				onClose={() => {
					setSqlModalOpen(false)
					setSelectedPlayer(null)
				}}
				onExecute={handleExecuteSQL}
			/>
		</div>
	)
}

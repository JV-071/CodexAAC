'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '../../services/api'
import type { ApiResponse } from '../../types/account'
import type { AdminAccount, AdminAccountsResponse } from '../../types/admin'

const handleAdminError = (err: any, router: { replace: (path: string) => void }): boolean => {
	const status = err.status || err.response?.status

	if (status === 404) {
		router.replace('/not-found')
		return true
	}
	return false
}

interface EditAccountModalProps {
	account: AdminAccount | null
	isOpen: boolean
	onClose: () => void
	onSave: (accountId: number, data: any) => Promise<void>
}

function EditAccountModal({ account, isOpen, onClose, onSave }: EditAccountModalProps) {
	const [formData, setFormData] = useState({
		premiumDays: 0,
		coins: 0,
		coinsTransferable: 0,
		status: '',
		isAdmin: false,
	})
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState('')

	useEffect(() => {
		if (account) {
			setFormData({
				premiumDays: account.premiumDays,
				coins: account.coins,
				coinsTransferable: account.coinsTransferable,
				status: account.status,
				isAdmin: account.isAdmin,
			})
			setError('')
		}
	}, [account])

	if (!isOpen || !account) return null

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setSaving(true)
		setError('')
		try {
			await onSave(account.id, formData)
			onClose()
		} catch (err: any) {
			setError(err.message || 'Error saving account')
		} finally {
			setSaving(false)
		}
	}

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<div className="bg-[#1f1f1f] rounded-xl border-2 border-[#ffd700]/30 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
				<div className="p-6">
					<div className="flex items-center justify-between mb-6">
						<h2 className="text-2xl font-bold text-[#ffd700]">Edit Account</h2>
						<button
							onClick={onClose}
							className="text-[#888] hover:text-[#e0e0e0] text-2xl"
						>
							×
						</button>
					</div>

					<div className="mb-4 p-4 bg-[#252525] rounded-lg">
						<p className="text-sm text-[#888] mb-1">Account ID</p>
						<p className="text-[#e0e0e0] font-semibold">{account.id}</p>
					</div>

					<div className="mb-4 p-4 bg-[#252525] rounded-lg">
						<p className="text-sm text-[#888] mb-1">Email</p>
						<p className="text-[#e0e0e0] font-semibold">{account.email}</p>
					</div>

					{error && (
						<div className="bg-red-900/30 border-2 border-red-600 rounded-lg p-4 mb-4">
							<p className="text-red-400">{error}</p>
						</div>
					)}

					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<label className="block text-[#e0e0e0] font-semibold mb-2">
								Premium Days
							</label>
							<input
								type="number"
								value={formData.premiumDays}
								onChange={(e) => setFormData({ ...formData, premiumDays: parseInt(e.target.value) || 0 })}
								className="w-full px-4 py-2 bg-[#252525] border-2 border-[#404040] rounded-lg text-[#e0e0e0] focus:border-[#ffd700] focus:outline-none"
								min="0"
							/>
						</div>

						<div>
							<label className="block text-[#e0e0e0] font-semibold mb-2">
								Coins
							</label>
							<input
								type="number"
								value={formData.coins}
								onChange={(e) => setFormData({ ...formData, coins: parseInt(e.target.value) || 0 })}
								className="w-full px-4 py-2 bg-[#252525] border-2 border-[#404040] rounded-lg text-[#e0e0e0] focus:border-[#ffd700] focus:outline-none"
								min="0"
							/>
						</div>

						<div>
							<label className="block text-[#e0e0e0] font-semibold mb-2">
								Transferable Coins
							</label>
							<input
								type="number"
								value={formData.coinsTransferable}
								onChange={(e) => setFormData({ ...formData, coinsTransferable: parseInt(e.target.value) || 0 })}
								className="w-full px-4 py-2 bg-[#252525] border-2 border-[#404040] rounded-lg text-[#e0e0e0] focus:border-[#ffd700] focus:outline-none"
								min="0"
							/>
						</div>

						<div>
							<label className="block text-[#e0e0e0] font-semibold mb-2">
								Status
							</label>
							<select
								value={formData.status}
								onChange={(e) => setFormData({ ...formData, status: e.target.value })}
								className="w-full px-4 py-2 bg-[#252525] border-2 border-[#404040] rounded-lg text-[#e0e0e0] focus:border-[#ffd700] focus:outline-none"
							>
								<option value="1">Active</option>
								<option value="2">Blocked</option>
								<option value="3">Banned</option>
							</select>
						</div>

						<div className="flex items-center gap-2">
							<input
								type="checkbox"
								id="isAdmin"
								checked={formData.isAdmin}
								onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
								className="w-4 h-4 text-[#ffd700] bg-[#252525] border-[#404040] rounded focus:ring-[#ffd700]"
							/>
							<label htmlFor="isAdmin" className="text-[#e0e0e0] font-semibold">
								Admin Access
							</label>
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
	account: AdminAccount | null
	isOpen: boolean
	onClose: () => void
	onExecute: (accountId: number, sql: string) => Promise<void>
}

function SQLModal({ account, isOpen, onClose, onExecute }: SQLModalProps) {
	const [sql, setSql] = useState('')
	const [executing, setExecuting] = useState(false)
	const [error, setError] = useState('')
	const [result, setResult] = useState<any>(null)

	useEffect(() => {
		if (account && isOpen) {
			setSql(`UPDATE accounts SET \n  premdays = ${account.premiumDays},\n  coins = ${account.coins}\nWHERE id = ${account.id};`)
			setError('')
			setResult(null)
		}
	}, [account, isOpen])

	if (!isOpen || !account) return null

	const handleExecute = async () => {
		if (!sql.trim()) {
			setError('SQL query cannot be empty')
			return
		}

		setExecuting(true)
		setError('')
		setResult(null)
		try {
			await onExecute(account.id, sql)
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
						<p className="text-sm text-[#888] mb-1">Account ID</p>
						<p className="text-[#e0e0e0] font-semibold">{account.id}</p>
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

export default function ManageAccountsPage() {
	const router = useRouter()
	const [accounts, setAccounts] = useState<AdminAccount[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [search, setSearch] = useState('')
	const [page, setPage] = useState(1)
	const [limit] = useState(50)
	const [totalPages, setTotalPages] = useState(1)
	const [total, setTotal] = useState(0)
	const [selectedAccount, setSelectedAccount] = useState<AdminAccount | null>(null)
	const [editModalOpen, setEditModalOpen] = useState(false)
	const [sqlModalOpen, setSqlModalOpen] = useState(false)
	const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

	const fetchAccounts = useCallback(async () => {
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

			const response = await api.get<ApiResponse<AdminAccountsResponse>>(`/admin/accounts?${params.toString()}`)
			if (response && response.data) {
				setAccounts(response.data.accounts)
				setTotalPages(response.data.pagination.totalPages)
				setTotal(response.data.pagination.total)
				setIsAuthorized(true)
			}
		} catch (err: any) {
			if (handleAdminError(err, router)) {
				return
			}
			setIsAuthorized(false)
			setError('Error fetching accounts')
		} finally {
			setLoading(false)
		}
	}, [page, limit, search, router])

	useEffect(() => {
		fetchAccounts()
	}, [fetchAccounts])

	const handleEditAccount = async (accountId: number, data: any) => {
		try {
			const updateData: any = {}
			if (data.premiumDays !== undefined) updateData.premiumDays = data.premiumDays
			if (data.coins !== undefined) updateData.coins = data.coins
			if (data.coinsTransferable !== undefined) updateData.coinsTransferable = data.coinsTransferable
			if (data.status !== undefined) updateData.status = parseInt(data.status)
			if (data.isAdmin !== undefined) updateData.isAdmin = data.isAdmin

			await api.put<ApiResponse<any>>(`/admin/account?id=${accountId}`, updateData)
			// Refresh accounts list
			fetchAccounts()
		} catch (err: any) {
			throw new Error(err.message || 'Error updating account')
		}
	}

	const handleExecuteSQL = async (accountId: number, sql: string) => {
		try {
			const response = await api.post<ApiResponse<any>>(`/admin/account/sql?id=${accountId}`, {
				sql: sql,
			})
			// Refresh accounts list
			fetchAccounts()
			return response
		} catch (err: any) {
			throw new Error(err.message || 'Error executing SQL')
		}
	}

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault()
		setPage(1)
		fetchAccounts()
	}

	const getStatusBadge = (status: string) => {
		const statusMap: Record<string, { label: string; color: string }> = {
			'1': { label: 'Active', color: 'bg-green-900/30 text-green-300 border-green-600' },
			'2': { label: 'Blocked', color: 'bg-yellow-900/30 text-yellow-300 border-yellow-600' },
			'3': { label: 'Banned', color: 'bg-red-900/30 text-red-300 border-red-600' },
		}
		const statusInfo = statusMap[status] || { label: status, color: 'bg-[#404040] text-[#888] border-[#505050]' }
		return (
			<span className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${statusInfo.color}`}>
				{statusInfo.label}
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
					<p className="text-[#888]">Loading accounts...</p>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen">
			<div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Header */}
				<div className="mb-8">
					<div className="flex items-center gap-4 mb-4">
						<div className="w-16 h-16 bg-gradient-to-br from-[#ffd700] to-[#ffed4e] rounded-xl flex items-center justify-center shadow-lg">
							<span className="text-3xl">👥</span>
						</div>
						<div>
							<h1 className="text-4xl font-bold text-[#ffd700] mb-2">Manage Accounts</h1>
							<p className="text-[#888]">View and manage player accounts</p>
						</div>
					</div>
				</div>

				{error && (
					<div className="bg-red-900/30 border-2 border-red-600 rounded-lg p-4 mb-6">
						<p className="text-red-400">{error}</p>
					</div>
				)}

				{/* Search Bar */}
				<div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 p-6 mb-6 shadow-2xl">
					<form onSubmit={handleSearch} className="flex gap-4">
						<input
							type="text"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search by email..."
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

				{/* Accounts Table */}
				<div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 shadow-2xl overflow-hidden">
					<div className="overflow-x-auto">
						<table className="w-full">
							<thead className="bg-[#1f1f1f]">
								<tr>
									<th className="px-6 py-4 text-left text-sm font-semibold text-[#ffd700]">ID</th>
									<th className="px-6 py-4 text-left text-sm font-semibold text-[#ffd700]">Email</th>
									<th className="px-6 py-4 text-left text-sm font-semibold text-[#ffd700]">Type</th>
									<th className="px-6 py-4 text-left text-sm font-semibold text-[#ffd700]">Premium Days</th>
									<th className="px-6 py-4 text-left text-sm font-semibold text-[#ffd700]">Coins</th>
									<th className="px-6 py-4 text-left text-sm font-semibold text-[#ffd700]">Status</th>
									<th className="px-6 py-4 text-left text-sm font-semibold text-[#ffd700]">Characters</th>
									<th className="px-6 py-4 text-left text-sm font-semibold text-[#ffd700]">Created</th>
									<th className="px-6 py-4 text-center text-sm font-semibold text-[#ffd700]">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-[#404040]">
								{accounts.length === 0 ? (
									<tr>
										<td colSpan={9} className="px-6 py-8 text-center text-[#888]">
											No accounts found
										</td>
									</tr>
								) : (
									accounts.map((account) => (
										<tr key={account.id} className="hover:bg-[#1f1f1f]/50 transition-colors">
											<td className="px-6 py-4 text-[#e0e0e0]">{account.id}</td>
											<td className="px-6 py-4 text-[#e0e0e0]">{account.email}</td>
											<td className="px-6 py-4">
												<span className={`px-3 py-1 rounded-full text-xs font-semibold ${account.accountType === 'Premium Account'
													? 'bg-[#ffd700]/20 text-[#ffd700] border border-[#ffd700]/30'
													: 'bg-[#404040] text-[#888]'
													}`}>
													{account.accountType}
												</span>
											</td>
											<td className="px-6 py-4 text-[#e0e0e0]">{account.premiumDays}</td>
											<td className="px-6 py-4 text-[#e0e0e0]">
												{account.coins.toLocaleString()} {account.coinsTransferable > 0 && `(${account.coinsTransferable})`}
											</td>
											<td className="px-6 py-4">{getStatusBadge(account.status)}</td>
											<td className="px-6 py-4 text-[#e0e0e0]">{account.charactersCount}</td>
											<td className="px-6 py-4 text-[#888] text-sm">{account.createdAt}</td>
											<td className="px-6 py-4">
												<div className="flex gap-2 justify-center">
													<button
														onClick={() => {
															setSelectedAccount(account)
															setEditModalOpen(true)
														}}
														className="px-3 py-1 bg-[#3b82f6] hover:bg-[#2563eb] rounded text-sm font-semibold transition-all"
														title="Edit Account"
													>
														✏️
													</button>
													<button
														onClick={() => {
															setSelectedAccount(account)
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

					{/* Pagination */}
					{totalPages > 1 && (
						<div className="px-6 py-4 bg-[#1f1f1f] flex items-center justify-between">
							<div className="text-[#888] text-sm">
								Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} accounts
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

			{/* Edit Account Modal */}
			<EditAccountModal
				account={selectedAccount}
				isOpen={editModalOpen}
				onClose={() => {
					setEditModalOpen(false)
					setSelectedAccount(null)
				}}
				onSave={handleEditAccount}
			/>

			{/* SQL Modal */}
			<SQLModal
				account={selectedAccount}
				isOpen={sqlModalOpen}
				onClose={() => {
					setSqlModalOpen(false)
					setSelectedAccount(null)
				}}
				onExecute={handleExecuteSQL}
			/>
		</div>
	)
}

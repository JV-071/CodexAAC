'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '../../services/api'
import type { ApiResponse } from '../../types/account'

interface LogFile {
	name: string
	size: number
	modified: string
}

interface LogContent {
	fileName: string
	content: string
	size: number
}

export default function LogsPage() {
	const router = useRouter()
	const [logFiles, setLogFiles] = useState<LogFile[]>([])
	const [selectedFile, setSelectedFile] = useState<string | null>(null)
	const [logContent, setLogContent] = useState<LogContent | null>(null)
	const [loading, setLoading] = useState(true)
	const [loadingContent, setLoadingContent] = useState(false)
	const [error, setError] = useState('')

	const fetchLogFiles = useCallback(async () => {
		try {
			setLoading(true)
			setError('')
			const response = await api.get<ApiResponse<LogFile[]>>('/admin/logs')
			if (response && response.data) {
				setLogFiles(response.data)
				if (response.data.length > 0 && !selectedFile) {
					setSelectedFile(response.data[0].name)
				}
			}
		} catch (err: any) {
			if (err.status === 404) {
				router.replace('/not-found')
				return
			}
			setError('Error loading logs list')
		} finally {
			setLoading(false)
		}
	}, [router, selectedFile])

	const fetchLogContent = useCallback(async (fileName: string) => {
		try {
			setLoadingContent(true)
			setError('')
			const response = await api.get<ApiResponse<LogContent>>(
				`/admin/logs/content?file=${encodeURIComponent(fileName)}`
			)

			if (response && response.data) {
				const decoder = new TextDecoder('latin1')
				const buffer = new TextEncoder().encode(response.data.content)
				const fixed = decoder.decode(buffer)

				setLogContent({
					...response.data,
					content: fixed
				})
			}
		} catch (err: any) {
			setError(err.status === 404 ? 'Log file not found' : 'Error loading log content')
			setLogContent(null)
		} finally {
			setLoadingContent(false)
		}
	}, [])

	useEffect(() => {
		fetchLogFiles()
	}, [fetchLogFiles])

	useEffect(() => {
		if (selectedFile) fetchLogContent(selectedFile)
	}, [selectedFile, fetchLogContent])

	const handleRefresh = () => {
		fetchLogFiles()
		if (selectedFile) fetchLogContent(selectedFile)
	}

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ffd700] mb-4"></div>
					<p className="text-[#888]">Loading logs...</p>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8 max-w-[1400px] mx-auto">
			<div className="flex items-center justify-between mb-8">
				<div className="flex items-center gap-4">
					<div className="w-16 h-16 bg-gradient-to-br from-[#ffd700] to-[#ffed4e] rounded-xl flex items-center justify-center shadow-lg">
						<span className="text-3xl">📝</span>
					</div>
					<div>
						<h1 className="text-4xl font-bold text-[#ffd700] mb-2">Server Logs</h1>
						<p className="text-[#888]">View and monitor server logs</p>
					</div>
				</div>

				<button
					onClick={handleRefresh}
					className="px-4 py-2 bg-[#404040] hover:bg-[#505050] text-white rounded-lg font-semibold transition-all flex items-center gap-2"
				>
					<span>🔄</span>
					<span>Refresh</span>
				</button>
			</div>

			{error && (
				<div className="bg-red-900/30 border-2 border-red-600 rounded-lg p-4 mb-6">
					<p className="text-red-400">{error}</p>
				</div>
			)}

			<div className="mb-6">
				<label className="text-[#ffd700] font-semibold block mb-2">Select log file</label>

				<select
					value={selectedFile ?? ''}
					onChange={(e) => setSelectedFile(e.target.value)}
					className="w-full bg-[#1a1a1a] border-2 border-[#505050] text-[#e0e0e0] p-3 rounded-lg focus:border-[#ffd700] outline-none"
				>
					{logFiles.map((file) => (
						<option key={file.name} value={file.name}>
							{file.name}
						</option>
					))}
				</select>
			</div>

			<div className="bg-[#252525]/95 border-2 border-[#505050]/70 rounded-xl p-6 shadow-2xl min-h-[70vh]">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-xl font-bold text-[#ffd700]">
						{selectedFile ? `Content: ${selectedFile}` : 'Select a file'}
					</h2>

					{logContent && (
						<span className="text-sm text-[#888]">
							{logContent.size.toLocaleString()} characters
						</span>
					)}
				</div>

				{loadingContent ? (
					<div className="flex items-center justify-center py-12">
						<div className="text-center">
							<div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#ffd700] mb-2"></div>
							<p className="text-[#888]">Loading content...</p>
						</div>
					</div>
				) : logContent ? (
					<div className="bg-black border border-[#333] rounded-lg p-4 max-h-[70vh] overflow-auto shadow-inner">
						<pre className="text-xs text-[#00ff7f] font-mono whitespace-pre-wrap leading-tight tracking-normal">
							{logContent.content}
						</pre>
					</div>
				) : (
					<div className="text-center py-12 text-[#888]">
						<p>Select a log file to view its content</p>
					</div>
				)}
			</div>
		</div>
	)
}

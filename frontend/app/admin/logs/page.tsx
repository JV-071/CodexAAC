'use client'

import { useState, useEffect, useCallback, memo } from 'react'
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

const LogFileItem = memo(({
    file,
    isSelected,
    onSelect
}: {
    file: LogFile
    isSelected: boolean
    onSelect: () => void
}) => {
    const formatSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    }

    return (
        <button
            onClick={onSelect}
            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                isSelected
                    ? 'bg-[#ffd700]/10 border-[#ffd700] text-[#ffd700]'
                    : 'bg-[#1a1a1a] border-[#404040] text-[#e0e0e0] hover:border-[#ffd700]/50 hover:bg-[#252525]'
            }`}
        >
            <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{file.name}</p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-[#888]">
                        <span>{formatSize(file.size)}</span>
                        <span>•</span>
                        <span>{file.modified}</span>
                    </div>
                </div>
                {isSelected && (
                    <span className="ml-4 text-xl">✓</span>
                )}
            </div>
        </button>
    )
})
LogFileItem.displayName = 'LogFileItem'

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
            const response = await api.get<ApiResponse<LogContent>>(`/admin/logs/content?file=${encodeURIComponent(fileName)}`)
            if (response && response.data) {
                setLogContent(response.data)
            }
        } catch (err: any) {
            if (err.status === 404) {
                setError('Log file not found')
            } else {
                setError('Error loading log content')
            }
            setLogContent(null)
        } finally {
            setLoadingContent(false)
        }
    }, [])

    useEffect(() => {
        fetchLogFiles()
    }, [fetchLogFiles])

    useEffect(() => {
        if (selectedFile) {
            fetchLogContent(selectedFile)
        }
    }, [selectedFile, fetchLogContent])

    const handleFileSelect = useCallback((fileName: string) => {
        setSelectedFile(fileName)
    }, [])

    const handleRefresh = useCallback(() => {
        fetchLogFiles()
        if (selectedFile) {
            fetchLogContent(selectedFile)
        }
    }, [fetchLogFiles, selectedFile, fetchLogContent])

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
        <div className="min-h-screen">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
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
                </div>

                {error && (
                    <div className="bg-red-900/30 border-2 border-red-600 rounded-lg p-4 mb-6">
                        <p className="text-red-400">{error}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 p-6 shadow-2xl">
                            <h2 className="text-xl font-bold text-[#ffd700] mb-4">Log Files</h2>

                            {logFiles.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-[#888]">No log files found</p>
                                    <p className="text-[#666] text-sm mt-2">
                                        Make sure the logs folder exists in SERVER_PATH
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                                    {logFiles.map((file) => (
                                        <LogFileItem
                                            key={file.name}
                                            file={file}
                                            isSelected={selectedFile === file.name}
                                            onSelect={() => handleFileSelect(file.name)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-2">
                        <div className="bg-[#252525]/95 backdrop-blur-sm rounded-xl border-2 border-[#505050]/70 p-6 shadow-2xl">
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
                                <div className="bg-[#1a1a1a] border-2 border-[#404040] rounded-lg p-4">
                                    <pre className="text-sm text-[#e0e0e0] font-mono whitespace-pre-wrap break-words overflow-x-auto max-h-[600px] overflow-y-auto">
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
                </div>
            </div>
        </div>
    )
}


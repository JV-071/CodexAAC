export interface ChangelogEntry {
  id: number
  version: string
  title: string
  description?: string | null
  type: 'feature' | 'bugfix' | 'update' | 'hotfix' | 'other'
  createdAt: number
  createdBy?: number
}

export interface Changelog extends ChangelogEntry {}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ChangelogsResponse {
  changelogs: ChangelogEntry[]
  pagination: PaginationInfo
}

export interface ChangelogsApiResponse {
  message: string
  status: string
  data: ChangelogsResponse
}


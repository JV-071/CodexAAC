export interface News {
  id: number
  title: string
  content: string
  authorId: number
  characterId?: number
  icon?: string
  author?: string
  createdAt: number
  updatedAt: number
}

export interface NewsComment {
  id: number
  newsId: number
  authorId: number
  characterId: number
  characterName: string
  content: string
  createdAt: number
  lookType?: number
  lookHead?: number
  lookBody?: number
  lookLegs?: number
  lookFeet?: number
  lookAddons?: number
  newsTitle?: string
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface NewsResponse {
  news: News[]
  pagination: PaginationInfo
}

export interface NewsApiResponse {
  message: string
  status: string
  data: NewsResponse
}

export interface SingleNewsApiResponse {
  message: string
  status: string
  data: News
}


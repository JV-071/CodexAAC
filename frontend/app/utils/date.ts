export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export const formatDateTime = (timestamp: number, neverText: string = 'Nunca'): string => {
  if (timestamp === 0) return neverText
  const date = new Date(timestamp * 1000)
  return date.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const formatRelativeTime = (timestamp: number): string => {
  const now = Math.floor(Date.now() / 1000)
  const diff = now - timestamp

  if (diff < 60) {
    return 'just now'
  } else if (diff < 3600) {
    const minutes = Math.floor(diff / 60)
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`
  } else if (diff < 86400) {
    const hours = Math.floor(diff / 3600)
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  } else if (diff < 604800) {
    const days = Math.floor(diff / 86400)
    return `${days} ${days === 1 ? 'day' : 'days'} ago`
  } else if (diff < 2592000) {
    const weeks = Math.floor(diff / 604800)
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`
  } else {
    return formatDate(timestamp)
  }
}


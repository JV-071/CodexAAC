'use client'

import { useEffect } from 'react'
import AdminTopBar from '../components/layout/AdminTopBar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    // Hide default TopBar when in admin area using CSS class
    const topBar = document.querySelector('[data-topbar]')
    if (topBar) {
      topBar.classList.add('hidden')
    }

    return () => {
      // Show TopBar again when leaving admin area
      if (topBar) {
        topBar.classList.remove('hidden')
      }
    }
  }, [])

  return (
    <>
      {/* Always show AdminTopBar in admin area */}
      <AdminTopBar />
      {children}
    </>
  )
}


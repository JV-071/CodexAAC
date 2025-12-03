'use client'

import { useEffect } from 'react'
import AdminTopBar from '../components/layout/AdminTopBar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    const topBar = document.querySelector('[data-topbar]')
    if (topBar) {
      topBar.classList.add('hidden')
    }

    return () => {
      if (topBar) {
        topBar.classList.remove('hidden')
      }
    }
  }, [])

  return (
    <>
      {/* Always show AdminTopBar in admin area */}
      <AdminTopBar />
      <div className="pt-16">
        {children}
      </div>
    </>
  )
}


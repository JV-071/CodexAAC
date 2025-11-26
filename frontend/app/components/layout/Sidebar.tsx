'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useServerName } from '../../hooks/useServerName'
import { useSocialLinks } from '../../hooks/useSocialLinks'
import { authService } from '../../services/auth'

interface MenuSection {
  title: string
  items: { label: string; href: string; icon?: string; badge?: string }[]
}

export default function Sidebar() {
  const serverName = useServerName()
  const socialLinks = useSocialLinks()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  
  useEffect(() => {
    setIsAuthenticated(authService.isAuthenticated())
  }, [])

  const menuSections: MenuSection[] = [
    {
      title: 'News',
      items: [
        { label: 'Latest News', href: '/news', icon: '➤' },
        { label: 'Token (2FA)', href: '/token' },
        { label: 'Event Schedule', href: '/events' },
        { label: `${serverName} Wiki`, href: '/wiki' },
      ],
    },
    {
      title: 'Library',
      items: [
        { label: 'Server Info', href: '/server-info' },
        { label: 'VIP & Loyalty', href: '/vip', badge: 'NEW' },
        { label: "Beginner's Guide", href: '/guide', badge: 'NEW' },
      ],
    },
    {
      title: 'Community',
      items: [
        { label: 'Characters', href: '/characters' },
        { label: 'Highscores', href: '/highscores' },
        { label: 'Kill Statistics', href: '/kills' },
        { label: 'Latest Deaths', href: '/deaths' },
        { label: 'Latest Transfers', href: '/transfers' },
        { label: 'Houses', href: '/houses' },
        { label: 'Guilds', href: '/guilds' },
        { label: 'Guild War', href: '/guild-war' },
        { label: 'Polls', href: '/polls' },
        { label: 'Banishments', href: '/banishments' },
      ],
    },
    {
      title: 'Account',
      items: [
        { label: 'Account Management', href: '/account' },
        { label: 'Create Account', href: '/create-account' },
        { label: 'Lost Account', href: '/lost-account' },
      ],
    },
    {
      title: 'Custom',
      items: [
        { label: 'Roulette System', href: '/roulette', badge: 'NEW' },
        { label: 'Linked Tasks', href: '/tasks', badge: 'NEW' },
        { label: 'Castle', href: '/castle' },
      ],
    },
    {
      title: 'Support',
      items: [
        { label: 'Staff', href: '/staff' },
        { label: 'Rules', href: '/rules' },
        { label: 'Legal Documents', href: '/legal' },
      ],
    },
    {
      title: 'Char Bazaar',
      items: [
        { label: 'Current Auctions', href: '/auctions' },
        { label: 'Auction History', href: '/auction-history' },
        { label: 'My Bids', href: '/my-bids' },
        { label: 'My Auctions', href: '/my-auctions' },
        { label: 'My Watched Auctions', href: '/watched' },
      ],
    },
  ]

  return (
    <nav className="space-y-1">
      {menuSections.map((section) => (
        <div key={section.title} className="mb-3">
          <h3 className="text-[#ffd700] font-bold text-xs mb-1.5 uppercase tracking-wide">
            {section.title}
          </h3>
          <ul className="space-y-0.5">
            {section.items
              .filter((item) => {
                if (item.label === 'Create Account' && isAuthenticated) {
                  return false
                }
                return true
              })
              .map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="block px-2 py-1.5 text-[#d4d4d4] hover:text-[#ffd700] hover:bg-[#2a2a2a]/50 rounded text-xs transition-colors flex items-center justify-between group"
                  >
                    <span className="flex items-center gap-1.5">
                      {item.icon && <span className="text-[#ffd700]">{item.icon}</span>}
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="bg-[#ffd700] text-[#0a0a0a] text-[10px] font-bold px-1.5 py-0.5 rounded">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      ))}

      {/* Shop Button */}
      <div className="mb-3 mt-4">
        <Link
          href="/shop"
          className="block px-2 py-1.5 text-[#ffd700] font-semibold hover:bg-[#2a2a2a]/50 rounded text-xs transition-colors"
        >
          Shop
        </Link>
      </div>

      {/* Webshop Box */}
      <div className="mb-3 bg-[#151515] rounded border border-[#3a3a3a] p-3">
        <h3 className="text-[#ffd700] font-bold text-xs mb-2 uppercase">Webshop</h3>
        <Link
          href="/exclusive"
          className="block px-2 py-1 text-[#d4d4d4] hover:text-[#ffd700] rounded text-xs transition-colors mb-2"
        >
          Exclusive Content
        </Link>
        <div className="grid grid-cols-2 gap-1 mb-2">
          {/* Placeholder for item images */}
          <div className="aspect-square bg-[#0a0a0a] rounded border border-[#3a3a3a]"></div>
          <div className="aspect-square bg-[#0a0a0a] rounded border border-[#3a3a3a]"></div>
          <div className="aspect-square bg-[#0a0a0a] rounded border border-[#3a3a3a]"></div>
          <div className="aspect-square bg-[#0a0a0a] rounded border border-[#3a3a3a]"></div>
        </div>
        <button className="w-full bg-[#ffd700] hover:bg-[#ffed4e] text-[#0a0a0a] font-bold py-1.5 px-3 rounded text-xs transition-colors">
          Get Codex Coins
        </button>
      </div>

      {/* Discord Button */}
      {socialLinks.discord && (
        <div className="mt-4">
          <a
            href={socialLinks.discord}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold py-2 px-3 rounded flex items-center justify-center gap-2 transition-colors text-xs"
          >
            <span>💬</span>
            Join Server
          </a>
        </div>
      )}
    </nav>
  )
}

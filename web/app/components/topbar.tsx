'use client'

import { Bell, Menu, Search, GitBranch } from 'lucide-react'
import Link from 'next/link'

interface TopbarProps { onMenuClick: () => void }

export function Topbar({ onMenuClick }: TopbarProps) {
  return (
    <header className="topbar">
      <button className="topbar-menu-btn" onClick={onMenuClick} aria-label="Open menu">
        <Menu size={20} />
      </button>

      <Link href="/dashboard" style={{ textDecoration: 'none' }}>
        <div className="topbar-logo">
          <div className="topbar-logo-icon">
            <GitBranch size={14} />
          </div>
          <span>FIRE</span>
          <span className="topbar-demo">DEMO</span>
        </div>
      </Link>

      <div className="topbar-search">
        <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input type="search" placeholder="Search tickets..." />
      </div>

      <div className="topbar-right">
        <button className="topbar-icon-btn" aria-label="Notifications">
          <Bell size={18} />
        </button>

        <div className="topbar-avatar">
          <div className="topbar-avatar-circle">SC</div>
          <div>
            <div className="topbar-user-name">Sarah Chen</div>
            <div className="topbar-user-role">Support Supervisor</div>
          </div>
        </div>
      </div>
    </header>
  )
}

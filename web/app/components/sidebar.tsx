'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Inbox, FileText, Users,
  BarChart3, Sparkles, X, GitBranch,
} from 'lucide-react'

const NAV = [
  { href: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/tickets',    icon: Inbox,           label: 'Incoming Queue', badge: null },
  { href: '/ticket',     icon: FileText,        label: 'Ticket Review' },
  { href: '/managers',   icon: Users,           label: 'Managers' },
  { href: '/stats',      icon: BarChart3,       label: 'Analytics' },
  { href: '/star-task',  icon: Sparkles,        label: 'Star Task ⭐' },
]

interface SidebarProps { open: boolean; onClose: () => void }

export function Sidebar({ open, onClose }: SidebarProps) {
  const path = usePathname()

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <GitBranch size={16} />
        </div>
        <div>
          <div className="sidebar-logo-text">FIRE</div>
          <div className="sidebar-logo-sub">Routing Engine v1.0</div>
        </div>
        {/* Mobile close */}
        <button
          onClick={onClose}
          style={{
            marginLeft: 'auto', background: 'none', border: 'none',
            color: '#9CA3AF', cursor: 'pointer', padding: 4,
            display: 'flex', alignItems: 'center',
          }}
          className="lg-hidden"
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(({ href, icon: Icon, label, badge }) => (
          <Link
            key={href}
            href={href}
            className={`nav-item ${path.startsWith(href) ? 'active' : ''}`}
            onClick={onClose}
          >
            <Icon size={17} />
            <span>{label}</span>
            {badge && <span className="nav-badge">{badge}</span>}
          </Link>
        ))}
      </nav>
    </aside>
  )
}

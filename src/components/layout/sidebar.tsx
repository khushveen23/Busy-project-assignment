'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { 
  LayoutDashboard, 
  Package, 
  BookOpen, 
  AlertTriangle,
  FolderHeart,
  Users,
  LogOut,
  Library,
  ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  librarianOnly?: boolean
  badge?: number
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/items', label: 'Catalogue', icon: Package },
  { href: '/loans', label: 'Loans', icon: BookOpen },
  { href: '/my-items', label: 'My Items', icon: FolderHeart, librarianOnly: true },
  { href: '/alerts', label: 'Alerts', icon: AlertTriangle, librarianOnly: true },
  { href: '/members', label: 'Members', icon: Users, librarianOnly: true },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isLibrarian = session?.user?.role === 'LIBRARIAN'
  const [alertCount, setAlertCount] = useState(0)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    if (!isLibrarian) return
    fetch('/api/alerts/count')
      .then(r => r.json())
      .then(d => setAlertCount(d.count ?? 0))
      .catch(() => {})
    const interval = setInterval(() => {
      fetch('/api/alerts/count')
        .then(r => r.json())
        .then(d => setAlertCount(d.count ?? 0))
        .catch(() => {})
    }, 30000)
    return () => clearInterval(interval)
  }, [isLibrarian])

  return (
    <aside className={cn(
      'flex flex-col h-screen bg-card border-r border-border transition-all duration-300',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
          <Library className="w-5 h-5 text-primary" />
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate">Asset Lending</p>
            <p className="text-xs text-muted-foreground truncate">{session?.user?.name}</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-muted-foreground hover:text-foreground transition-colors p-1"
        >
          <ChevronDown className={cn('w-4 h-4 transition-transform', collapsed ? '-rotate-90' : 'rotate-90')} />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          if (item.librarianOnly && !isLibrarian) return null
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          const count = item.href === '/alerts' ? alertCount : 0

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <div className="relative flex-shrink-0">
                <Icon className="w-5 h-5" />
                {count > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </div>
              {!collapsed && (
                <span className="flex-1">{item.label}</span>
              )}
              {!collapsed && count > 0 && (
                <span className="bg-destructive text-destructive-foreground text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-border">
        {!collapsed && (
          <div className="mb-2 px-3 py-2">
            <p className="text-xs font-medium text-foreground truncate">{session?.user?.email}</p>
            <p className="text-xs text-muted-foreground capitalize">{session?.user?.role?.toLowerCase()}</p>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  )
}

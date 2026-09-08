'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, MapPin, CreditCard, UserCheck,
  ShoppingCart, Zap, FileBarChart, Settings, Building2, ChevronRight,
} from 'lucide-react'

const navItems = [
  {
    label: 'Main',
    items: [
      { href: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
      { href: '/members',    label: 'Members',    icon: Users },
      { href: '/spaces',     label: 'Spaces',     icon: MapPin },
      { href: '/payments',   label: 'Payments',   icon: CreditCard },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/staff',      label: 'Staff',      icon: UserCheck },
      { href: '/expenses',   label: 'Expenses',   icon: Zap },
      { href: '/grocery',    label: 'Grocery',    icon: ShoppingCart },
      { href: '/generator',  label: 'Generator',  icon: Building2 },
    ],
  },
  {
    label: 'Insights',
    items: [
      { href: '/reports',    label: 'Reports',    icon: FileBarChart },
      { href: '/settings',   label: 'Settings',   icon: Settings },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex flex-col h-full bg-sidebar text-sidebar-foreground w-64 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-600 shrink-0 shadow-lg shadow-indigo-500/30">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white leading-tight">MentorSpace</p>
          <p className="text-xs text-slate-400 leading-tight">Management</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navItems.map(group => (
          <div key={group.label}>
            <p className="px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map(item => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                        isActive
                          ? 'bg-sidebar-primary text-white shadow-sm shadow-indigo-500/20'
                          : 'text-slate-400 hover:text-white hover:bg-sidebar-accent'
                      )}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-60" />}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-sidebar-border">
        <p className="text-[10px] text-slate-600 text-center">
          MentorSpace &copy; {new Date().getFullYear()}
        </p>
      </div>
    </aside>
  )
}

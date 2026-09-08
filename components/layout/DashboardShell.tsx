'use client'

import { useState } from 'react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import Topbar from './Topbar'
import Sidebar from './Sidebar'
import PageTitleProvider from './PageTitleProvider'

interface DashboardShellProps {
  userEmail?: string | null
  children: React.ReactNode
}

export default function DashboardShell({ userEmail, children }: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <PageTitleProvider>
        {(title) => (
          <Topbar
            title={title}
            userEmail={userEmail}
            onMenuClick={() => setMobileOpen(true)}
          />
        )}
      </PageTitleProvider>

      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-64 bg-sidebar border-sidebar-border">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-screen-2xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}

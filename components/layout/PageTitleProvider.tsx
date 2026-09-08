'use client'

import { createContext, useContext, useState } from 'react'

const PageTitleContext = createContext<{ title: string; setTitle: (t: string) => void }>({
  title: 'Dashboard',
  setTitle: () => {},
})

export function usePageTitle(title: string) {
  const ctx = useContext(PageTitleContext)
  // Set title on mount
  if (ctx.title !== title) ctx.setTitle(title)
}

interface PageTitleProviderProps {
  children: (title: string) => React.ReactNode
}

export default function PageTitleProvider({ children }: PageTitleProviderProps) {
  const [title, setTitle] = useState('Dashboard')

  return (
    <PageTitleContext.Provider value={{ title, setTitle }}>
      {children(title)}
    </PageTitleContext.Provider>
  )
}

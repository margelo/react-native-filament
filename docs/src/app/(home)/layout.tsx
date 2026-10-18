import { HomeLayout } from 'fumadocs-ui/layouts/home'
import type { ReactNode } from 'react'
import { homeOptions } from '@/lib/layout.shared'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <HomeLayout {...homeOptions()} className="rnf-home dark bg-fd-background text-fd-foreground">
      {children}
    </HomeLayout>
  )
}

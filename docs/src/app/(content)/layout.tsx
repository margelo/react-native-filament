import { HomeLayout } from 'fumadocs-ui/layouts/home'
import type { ReactNode } from 'react'
import { homeOptions } from '@/lib/layout.shared'

export default function ContentLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col">
      <HomeLayout {...homeOptions()} className="max-md:hidden" />
      {children}
    </div>
  )
}

import { DocsLayout } from 'fumadocs-ui/layouts/docs'
import type { ReactNode } from 'react'
import { sidebarOptions } from '@/lib/layout.shared'
import { apiSource } from '@/lib/source'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={apiSource.pageTree}
      {...sidebarOptions()}
      sidebar={{ collapsible: false }}
      searchToggle={{ components: { lg: false } }}
      containerProps={{ className: 'md:[--fd-sidebar-width:19rem]' }}
    >
      {children}
    </DocsLayout>
  )
}

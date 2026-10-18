import { DocsLayout } from 'fumadocs-ui/layouts/docs'
import type { ReactNode } from 'react'
import { sidebarOptions } from '@/lib/layout.shared'
import { docsSource } from '@/lib/source'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout tree={docsSource.pageTree} {...sidebarOptions()} sidebar={{ collapsible: false }} searchToggle={{ components: { lg: false } }}>
      {children}
    </DocsLayout>
  )
}

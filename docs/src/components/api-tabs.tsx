import { Tab, Tabs } from 'fumadocs-ui/components/tabs'
import type { ReactNode } from 'react'

const STYLES = ['Declarative', 'Imperative']

/** Shows the same API as React components and hooks, and as the native Nitro objects. The choice persists across pages. */
export function ApiTabs({ children }: { children: ReactNode }) {
  return (
    <Tabs items={STYLES} groupId="api-style" persist>
      {children}
    </Tabs>
  )
}

export function Declarative({ children }: { children: ReactNode }) {
  return <Tab value="Declarative">{children}</Tab>
}

export function Imperative({ children }: { children: ReactNode }) {
  return <Tab value="Imperative">{children}</Tab>
}

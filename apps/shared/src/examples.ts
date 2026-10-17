import type { ComponentType } from 'react'

export interface Example {
  route: string
  title: string
  component: ComponentType
}

export const examples: Example[] = []

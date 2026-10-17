import type { ComponentType } from 'react'
import { ClearColorExample } from './ClearColorExample'

export interface Example {
  route: string
  title: string
  component: ComponentType
}

export const examples: Example[] = [{ route: 'ClearColor', title: '🟦 Clear color', component: ClearColorExample }]

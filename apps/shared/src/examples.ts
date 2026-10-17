import type { ComponentType } from 'react'
import { ClearColorExample } from './ClearColorExample'
import { FrameListenerExample } from './FrameListenerExample'

export interface Example {
  route: string
  title: string
  component: ComponentType
}

export const examples: Example[] = [
  { route: 'ClearColor', title: '🟦 Clear color', component: ClearColorExample },
  { route: 'FrameListener', title: '🌈 Frame listener', component: FrameListenerExample },
]

import type { ComponentType } from 'react'
import { ClearColorExample } from './ClearColorExample'
import { FrameListenerExample } from './FrameListenerExample'
import { ModelExample } from './ModelExample'
import { SceneExample } from './SceneExample'

export interface Example {
  route: string
  title: string
  component: ComponentType
}

export const examples: Example[] = [
  { route: 'ClearColor', title: '🟦 Clear color', component: ClearColorExample },
  { route: 'FrameListener', title: '🌈 Frame listener', component: FrameListenerExample },
  { route: 'Scene', title: '🌅 Scene and skybox', component: SceneExample },
  { route: 'Model', title: '🚁 Animated model', component: ModelExample },
]

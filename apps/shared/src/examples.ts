import type { ComponentType } from 'react'
import { CameraOrbitExample } from './CameraOrbitExample'
import { ChangeMaterialsExample } from './ChangeMaterialsExample'
import { ClearColorExample } from './ClearColorExample'
import { FrameListenerExample } from './FrameListenerExample'
import { InstancesExample } from './InstancesExample'
import { LightsExample } from './LightsExample'
import { ModelExample } from './ModelExample'
import { MorphTargetsExample } from './MorphTargetsExample'
import { ReanimatedRotateExample } from './ReanimatedRotateExample'
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
  { route: 'ReanimatedRotate', title: '🔄 Reanimated rotation', component: ReanimatedRotateExample },
  { route: 'CameraOrbit', title: '🎥 Orbit gestures', component: CameraOrbitExample },
  { route: 'Lights', title: '💡 Lights and view options', component: LightsExample },
  { route: 'ChangeMaterials', title: '🎨 Change materials', component: ChangeMaterialsExample },
  { route: 'MorphTargets', title: '😮 Morph targets', component: MorphTargetsExample },
  { route: 'Instances', title: '👯 Instances and skeletons', component: InstancesExample },
]

import type { ComponentType } from 'react'
import { AnimatedRotateExample } from './AnimatedRotateExample'
import { AnimatedRotateStateExample } from './AnimatedRotateStateExample'
import { AnimationTransitionsExample } from './AnimationTransitionsExample'
import { BackgroundShadowsExample } from './BackgroundShadowsExample'
import { CameraOrbitExample } from './CameraOrbitExample'
import { CastShadowExample } from './CastShadowExample'
import { ChangeMaterialsExample } from './ChangeMaterialsExample'
import { ClearColorExample } from './ClearColorExample'
import { FadeOutExample } from './FadeOutExample'
import { FrameListenerExample } from './FrameListenerExample'
import { ImageExample } from './ImageExample'
import { InstancesExample } from './InstancesExample'
import { LightsExample } from './LightsExample'
import { LoadFromFileExample } from './LoadFromFileExample'
import { ModelExample } from './ModelExample'
import { MorphTargetsExample } from './MorphTargetsExample'
import { MultipleInstancesExample } from './MultipleInstancesExample'
import { NoneTransparentExample } from './NoneTransparentExample'
import { PhysicsCoinExample } from './PhysicsCoinExample'
import { PickingExample } from './PickingExample'
import { ReanimatedRotateExample } from './ReanimatedRotateExample'
import { RecordingExample } from './RecordingExample'
import { ScaleEffectExample } from './ScaleEffectExample'
import { SceneExample } from './SceneExample'
import { SkyboxExample } from './SkyboxExample'

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
  { route: 'CameraOrbit', title: '🎥 Camera pan (remote model)', component: CameraOrbitExample },
  { route: 'Lights', title: '💡 Lights and view options', component: LightsExample },
  { route: 'ChangeMaterials', title: '🎨 Change materials', component: ChangeMaterialsExample },
  { route: 'MorphTargets', title: '😮 Morph targets', component: MorphTargetsExample },
  { route: 'Instances', title: '👯 Instances and skeletons', component: InstancesExample },
  { route: 'Picking', title: '👆 Picking and snapshots', component: PickingExample },
  { route: 'BackgroundShadows', title: '🖼️ Background, shadows and bounds', component: BackgroundShadowsExample },
  { route: 'Recording', title: '🎬 Offscreen recording', component: RecordingExample },
  { route: 'PhysicsCoin', title: '🪙 Physics coins', component: PhysicsCoinExample },
  { route: 'AnimationTransitions', title: '💃 Animation transitions', component: AnimationTransitionsExample },
  { route: 'LoadFromFile', title: '📂 Load from file', component: LoadFromFileExample },
  { route: 'NoneTransparent', title: '⬛ Opaque view and bounds', component: NoneTransparentExample },
  { route: 'MultipleInstances', title: '🚁 Multiple instances', component: MultipleInstancesExample },
  { route: 'AnimatedRotate', title: '🌀 Animated rotate', component: AnimatedRotateExample },
  { route: 'AnimatedRotateState', title: '🧭 Rotate from render-thread state', component: AnimatedRotateStateExample },
  { route: 'FadeOut', title: '👻 Fade out', component: FadeOutExample },
  { route: 'ScaleEffect', title: '🔍 Scale effect', component: ScaleEffectExample },
  { route: 'Skybox', title: '🌌 KTX skybox', component: SkyboxExample },
  { route: 'CastShadow', title: '🌓 Cast shadow', component: CastShadowExample },
  { route: 'Image', title: '🏞️ Image background', component: ImageExample },
]

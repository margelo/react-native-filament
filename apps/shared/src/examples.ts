import type { ComponentType } from 'react'
import { AnimationTransitions } from './examples/AnimationTransitions'
import { CameraPan } from './examples/CameraPan'
import { AnimationTransitionsRecording } from './examples/AnimationTransitionsRecording'
import { ImageExample } from './examples/ImageExample'
import { LoadFromFile } from './examples/LoadFromFile'
import { NoneTransparent } from './examples/NoneTransparent'
import { MultipleInstances } from './examples/MultipleInstances'
import { AnimatedRotate } from './examples/AnimatedRotate'
import { AnimatedRotateSharedValues } from './examples/AnimatedRotateSharedValues'
import { ReanimatedRotation } from './examples/ReanimatedRotation'
import { PhysicsCoin } from './examples/PhysicsCoin'
import { FadeOut } from './examples/FadeOut'
import { CastShadow } from './examples/CastShadow'
import { ScaleEffect } from './examples/ScaleEffect'
import { ChangeMaterials } from './examples/ChangeMaterials'
import { SkyboxExample } from './examples/SkyboxExample'
import { MorphTargets } from './examples/MorphTargets'
import { ScrollingViews } from './examples/ScrollingViews'
import { SkeletonSharing } from './examples/SkeletonSharing'
import { ReactScene } from './examples/ReactScene'
import { ClearColorExample } from './imperative/ClearColorExample'
import { FrameListenerExample } from './imperative/FrameListenerExample'
import { SceneExample } from './imperative/SceneExample'
import { ModelExample } from './imperative/ModelExample'
import { ReanimatedRotateExample } from './imperative/ReanimatedRotateExample'
import { CameraOrbitExample } from './imperative/CameraOrbitExample'
import { LightsExample } from './imperative/LightsExample'
import { ChangeMaterialsExample } from './imperative/ChangeMaterialsExample'
import { MorphTargetsExample } from './imperative/MorphTargetsExample'
import { InstancesExample } from './imperative/InstancesExample'
import { PickingExample } from './imperative/PickingExample'
import { BackgroundShadowsExample } from './imperative/BackgroundShadowsExample'
import { RecordingExample } from './imperative/RecordingExample'
import { PhysicsCoinExample } from './imperative/PhysicsCoinExample'
import { AnimationTransitionsExample } from './imperative/AnimationTransitionsExample'
import { LoadFromFileExample } from './imperative/LoadFromFileExample'
import { NoneTransparentExample } from './imperative/NoneTransparentExample'
import { MultipleInstancesExample } from './imperative/MultipleInstancesExample'
import { AnimatedRotateExample } from './imperative/AnimatedRotateExample'
import { AnimatedRotateStateExample } from './imperative/AnimatedRotateStateExample'
import { FadeOutExample } from './imperative/FadeOutExample'
import { ScaleEffectExample } from './imperative/ScaleEffectExample'
import { SkyboxExample as ImperativeSkyboxExample } from './imperative/SkyboxExample'
import { CastShadowExample } from './imperative/CastShadowExample'
import { ImageExample as ImperativeImageExample } from './imperative/ImageExample'

export type ExampleSection = 'React API' | 'Imperative API'

export interface Example {
  route: string
  title: string
  section: ExampleSection
  component: ComponentType
}

export const examples: Example[] = [
  { route: 'AnimationTransitions', title: '▶️ Animation Transitions', section: 'React API', component: AnimationTransitions },
  { route: 'CameraPan', title: '📸 Camera Pan', section: 'React API', component: CameraPan },
  { route: 'AnimationTransitionsRecording', title: '📹 Offscreen recording', section: 'React API', component: AnimationTransitionsRecording },
  { route: 'ImageExample', title: '🏞️ Image', section: 'React API', component: ImageExample },
  { route: 'LoadFromFile', title: '📦 Load from file', section: 'React API', component: LoadFromFile },
  { route: 'NoneTransparent', title: '🫥 None Transparent rendering', section: 'React API', component: NoneTransparent },
  { route: 'MultipleInstances', title: '🤖 Multiple Instances', section: 'React API', component: MultipleInstances },
  { route: 'AnimatedRotate', title: '🔄 Animated Rotate', section: 'React API', component: AnimatedRotate },
  { route: 'AnimatedRotateSharedValues', title: '🔄 Animated Rotate w/ Shared Values', section: 'React API', component: AnimatedRotateSharedValues },
  { route: 'ReanimatedRotation', title: '🐎 Reanimated Rotate', section: 'React API', component: ReanimatedRotation },
  { route: 'PhysicsCoin', title: '💰 Physics Coin', section: 'React API', component: PhysicsCoin },
  { route: 'FadeOut', title: '😶‍🌫️ Fade Out', section: 'React API', component: FadeOut },
  { route: 'CastShadow', title: '🌑 Cast Shadow', section: 'React API', component: CastShadow },
  { route: 'ScaleEffect', title: '↕️ Scale Effect', section: 'React API', component: ScaleEffect },
  { route: 'ChangeMaterials', title: '🎨 Change Materials', section: 'React API', component: ChangeMaterials },
  { route: 'SkyboxExample', title: '☁️ Skybox', section: 'React API', component: SkyboxExample },
  { route: 'MorphTargets', title: '🔄 MorphTargets', section: 'React API', component: MorphTargets },
  { route: 'ScrollingViews', title: '📜 Views in a scrolling list', section: 'React API', component: ScrollingViews },
  { route: 'SkeletonSharing', title: '👯 Skeleton sharing (attachSkin)', section: 'React API', component: SkeletonSharing },
  { route: 'ReactScene', title: '⚛️ React API', section: 'React API', component: ReactScene },
  { route: 'ImperativeClearColor', title: '🟦 Clear color', section: 'Imperative API', component: ClearColorExample },
  { route: 'ImperativeFrameListener', title: '🌈 Frame listener', section: 'Imperative API', component: FrameListenerExample },
  { route: 'ImperativeScene', title: '🌅 Scene and skybox', section: 'Imperative API', component: SceneExample },
  { route: 'ImperativeModel', title: '🚁 Animated model', section: 'Imperative API', component: ModelExample },
  { route: 'ImperativeReanimatedRotate', title: '🔄 Reanimated rotation', section: 'Imperative API', component: ReanimatedRotateExample },
  { route: 'ImperativeCameraOrbit', title: '🎥 Camera pan (remote model)', section: 'Imperative API', component: CameraOrbitExample },
  { route: 'ImperativeLights', title: '💡 Lights and view options', section: 'Imperative API', component: LightsExample },
  { route: 'ImperativeChangeMaterials', title: '🎨 Change materials', section: 'Imperative API', component: ChangeMaterialsExample },
  { route: 'ImperativeMorphTargets', title: '😮 Morph targets', section: 'Imperative API', component: MorphTargetsExample },
  { route: 'ImperativeInstances', title: '👯 Instances and skeletons', section: 'Imperative API', component: InstancesExample },
  { route: 'ImperativePicking', title: '👆 Picking and snapshots', section: 'Imperative API', component: PickingExample },
  { route: 'ImperativeBackgroundShadows', title: '🖼️ Background, shadows and bounds', section: 'Imperative API', component: BackgroundShadowsExample },
  { route: 'ImperativeRecording', title: '🎬 Offscreen recording', section: 'Imperative API', component: RecordingExample },
  { route: 'ImperativePhysicsCoin', title: '🪙 Physics coins', section: 'Imperative API', component: PhysicsCoinExample },
  { route: 'ImperativeAnimationTransitions', title: '💃 Animation transitions', section: 'Imperative API', component: AnimationTransitionsExample },
  { route: 'ImperativeLoadFromFile', title: '📂 Load from file', section: 'Imperative API', component: LoadFromFileExample },
  { route: 'ImperativeNoneTransparent', title: '⬛ Opaque view and bounds', section: 'Imperative API', component: NoneTransparentExample },
  { route: 'ImperativeMultipleInstances', title: '🚁 Multiple instances', section: 'Imperative API', component: MultipleInstancesExample },
  { route: 'ImperativeAnimatedRotate', title: '🌀 Animated rotate', section: 'Imperative API', component: AnimatedRotateExample },
  { route: 'ImperativeAnimatedRotateState', title: '🧭 Rotate from render-thread state', section: 'Imperative API', component: AnimatedRotateStateExample },
  { route: 'ImperativeFadeOut', title: '👻 Fade out', section: 'Imperative API', component: FadeOutExample },
  { route: 'ImperativeScaleEffect', title: '🔍 Scale effect', section: 'Imperative API', component: ScaleEffectExample },
  { route: 'ImperativeSkybox', title: '🌌 KTX skybox', section: 'Imperative API', component: ImperativeSkyboxExample },
  { route: 'ImperativeCastShadow', title: '🌓 Cast shadow', section: 'Imperative API', component: CastShadowExample },
  { route: 'ImperativeImage', title: '🏞️ Image background', section: 'Imperative API', component: ImperativeImageExample },
]

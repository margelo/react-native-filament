import React, { type ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { useRoute } from '@react-navigation/native'
import { Camera, DefaultLight, FilamentScene, FilamentView, type EngineBackend, type Float3, type RenderMode } from 'react-native-filament'
import { BenchmarkOverlay } from './BenchmarkOverlay'
import { useRenderFrameCounter } from './useRenderFrameCounter'

function Overlay({ scene }: { scene: string }) {
  const readRenderFrames = useRenderFrameCounter()
  return <BenchmarkOverlay scene={scene} readRenderFrames={readRenderFrames} />
}

interface Props {
  scene: string
  cameraPosition?: Float3
  renderMode?: RenderMode
  children: ReactNode
}

const BACKENDS: EngineBackend[] = ['metal', 'opengl', 'vulkan']

/** The Engine backend a `?backend=` link parameter asks for. */
function useLinkedBackend(): EngineBackend | undefined {
  const params = useRoute().params as { backend?: string } | undefined
  return BACKENDS.find((backend) => backend === params?.backend)
}

/** A full-screen view with the default camera and light, and the benchmark overlay. */
export function BenchmarkScene({ scene, cameraPosition, renderMode, children }: Props) {
  const backend = useLinkedBackend()
  return (
    <View style={styles.container}>
      <FilamentScene renderMode={renderMode} backend={backend}>
        <FilamentView style={styles.container}>
          <Camera cameraPosition={cameraPosition} />
          <DefaultLight />
          {children}
        </FilamentView>
        <Overlay scene={scene} />
      </FilamentScene>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
})

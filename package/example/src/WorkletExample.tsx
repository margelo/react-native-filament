import React, { useCallback } from 'react'
import { useSharedValue } from 'react-native-worklets-core'
import { Button, Platform, SafeAreaView, StyleSheet, View } from 'react-native'
import {
  Engine,
  Filament,
  Float3,
  useCamera,
  useEngine,
  useModel,
  useRenderCallback,
  useTransformManager,
  useView,
} from 'react-native-filament'
import { useDefaultLight } from './hooks/useDefaultLight'
import { Config } from './config'

const marsModelPath = Platform.select({
  android: 'custom/mars.glb',
  ios: 'mars.glb',
})!
const rocketModelPath = Platform.select({
  android: 'custom/rocket.glb',
  ios: 'rocket.glb',
})!

function blockJS(): number {
  let sum = 0
  for (let i = 0; i < 1000000000; i++) {
    sum += i
  }
  return sum
}

function Renderer({ engine }: { engine: Engine }) {
  useDefaultLight(engine)
  useModel({
    engine,
    path: marsModelPath,
  })
  useModel({
    engine,
    path: rocketModelPath,
  })

  const view = useView(engine)
  const camera = useCamera(engine)

  const prevAspectRatio = useSharedValue(0)
  useRenderCallback(
    engine,
    useCallback(
      (_timestamp: number, startTime: number, passedSeconds: number) => {
        'worklet'

        const aspectRatio = view.aspectRatio
        if (prevAspectRatio.value !== aspectRatio) {
          prevAspectRatio.value = aspectRatio
          // Setup camera lens:
          const config = {
            focalLengthInMillimeters: 28,
            near: 0.1,
            far: 1000,
            cameraPosition: [0, 0, 8] as Float3,
            cameraTarget: [0, 0, 0] as Float3,
            cameraUp: [0, 1, 0] as Float3,
          }
          camera.setLensProjection(config.focalLengthInMillimeters, aspectRatio, config.near, config.far)
        }

        const radius = 5
        const rotationSpeed = 0.5
        const angle = passedSeconds * rotationSpeed
        const cameraPosition: Float3 = [
          Math.cos(angle) * radius, // x
          3, // y
          Math.sin(angle) * radius, // z
        ]

        camera.lookAt(cameraPosition, [0, 1, 0] as Float3, [0, 1, 0] as Float3)
      },
      [camera, prevAspectRatio, view.aspectRatio]
    )
  )

  return (
    <View style={styles.container}>
      <Filament style={styles.filamentView} engine={engine} />
    </View>
  )
}

export function WorkletExample() {
  const engine = useEngine()

  if (engine == null) return null
  return <Renderer engine={engine} />
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#cf511f',
  },
  filamentView: {
    flex: 1,
  },
})

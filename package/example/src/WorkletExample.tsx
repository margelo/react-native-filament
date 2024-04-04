import React, { useCallback } from 'react'
import { useSharedValue } from 'react-native-worklets-core'
import { Platform, StyleSheet, View } from 'react-native'
import { Engine, Filament, Float3, useCamera, useEngine, useModel, useRenderCallback, useView } from 'react-native-filament'
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

function Renderer({ engine }: { engine: Engine }) {
  useDefaultLight(engine)
  useModel({
    engine,
    path: marsModelPath,
    receiveShadow: true,
  })
  const rocket = useModel({
    engine,
    path: rocketModelPath,
    castShadow: true,
  })

  const view = useView(engine)
  const camera = useCamera(engine)

  const prevAspectRatio = useSharedValue(0)

  const rocketAsset = rocket.state === 'loaded' ? rocket.asset : undefined
  useRenderCallback(
    engine,
    useCallback(
      (_timestamp: number, _startTime: number, passedSeconds: number) => {
        'worklet'

        const aspectRatio = view.aspectRatio
        if (prevAspectRatio.value !== aspectRatio) {
          prevAspectRatio.value = aspectRatio
          // Setup camera lens:
          const { focalLengthInMillimeters, near, far } = Config.camera
          camera.setLensProjection(focalLengthInMillimeters, aspectRatio, near, far)
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

        if (rocketAsset != null) {
          engine.setEntityPosition(rocketAsset.getRoot(), [0, 1, 0], false)
        }
      },
      [camera, engine, prevAspectRatio, rocketAsset, view.aspectRatio]
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

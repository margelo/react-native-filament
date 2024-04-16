import React from 'react'
import { useSharedValue } from 'react-native-worklets-core'
import { Animated, Button, SafeAreaView, StyleSheet } from 'react-native'
import {
  Engine,
  Filament,
  Float3,
  getAssetFromModel,
  useAssetAnimator,
  useCamera,
  useEngine,
  useEntityInScene,
  useLightEntity,
  useLightManager,
  useModel,
  useRenderCallback,
  useScene,
  useView,
  useWorkletCallback,
} from 'react-native-filament'
import { useDefaultLight } from './hooks/useDefaultLight'
import { Config } from './config'
import { getAssetPath } from './utils/getAssetPasth'

const penguModelPath = getAssetPath('pengu.glb')

const cameraPosition: Float3 = [0, 0, 8]
const cameraTarget: Float3 = [0, 0, 0]
const cameraUp: Float3 = [0, 1, 0]

function Renderer({ engine }: { engine: Engine }) {
  // useDefaultLight(engine, false)
  const asset = useModel({
    engine,
    path: penguModelPath,
    autoAddToScene: true,
  })

  const view = useView(engine)
  const camera = useCamera(engine)

  const prevAspectRatio = useSharedValue(0)
  // const assetAnimator = useAssetAnimator(getAssetFromModel(asset))
  // useRenderCallback(
  //   engine,
  //   useWorkletCallback(
  //     (_timestamp: number, _startTime: number, passedSeconds: number) => {
  //       'worklet'

  //       const aspectRatio = view.getAspectRatio()
  //       if (prevAspectRatio.value !== aspectRatio) {
  //         prevAspectRatio.value = aspectRatio
  //         // Setup camera lens:
  //         const { focalLengthInMillimeters, near, far } = Config.camera
  //         camera.setLensProjection(focalLengthInMillimeters, aspectRatio, near, far)
  //         console.log('Updated camera lens!')
  //       }

  //       camera.lookAt(cameraPosition, cameraTarget, cameraUp)

  //       // if (assetAnimator == null) {
  //       //   return
  //       // }

  //       // assetAnimator.applyAnimation(0, passedSeconds)
  //       // assetAnimator.updateBoneMatrices()
  //     },
  //     // [assetAnimator, camera, prevAspectRatio, view]
  //     [camera, prevAspectRatio, view]
  //   )
  // )

  const lightManager = useLightManager(engine)
  const lightIntensity = useSharedValue(100_000)
  const lightEntity = useLightEntity(lightManager, {
    type: 'directional',
    castShadows: true,
    colorKelvin: 2_500,
    direction: [0, -1, 0],
    intensity: lightIntensity,
    position: [0, 0, 0],
  })
  const scene = useScene(engine)
  useEntityInScene(scene, lightEntity)

  return (
    <SafeAreaView style={styles.container}>
      <Filament style={styles.filamentView} engine={engine} />
      <Button
        title="Toggle light"
        onPress={() => {
          const from = lightIntensity.value
          const to = from === 0 ? 100_000 : 0
          const animValue = new Animated.Value(from)
          animValue.addListener(({ value }) => {
            lightIntensity.value = value
          })
          Animated.timing(animValue, {
            toValue: to,
            useNativeDriver: false,
            duration: 3000,
          }).start()
        }}
      />
    </SafeAreaView>
  )
}

export function FadingLightExample() {
  const engine = useEngine()

  if (engine == null) return null
  return <Renderer engine={engine} />
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filamentView: {
    flex: 1,
    backgroundColor: 'lightblue',
  },
})

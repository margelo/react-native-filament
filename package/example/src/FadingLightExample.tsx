import React from 'react'
import { useSharedValue } from 'react-native-worklets-core'
import { Animated, Button, SafeAreaView, StyleSheet } from 'react-native'
import {
  Filament,
  FilamentProvider,
  Float3,
  getAssetFromModel,
  useAssetAnimator,
  useEntityInScene,
  useFilamentContext,
  useLightEntity,
  useModel,
  useRenderCallback,
  useWorkletCallback,
} from 'react-native-filament'
import { useDefaultLight } from './hooks/useDefaultLight'
import { Config } from './config'
import { getAssetPath } from './utils/getAssetPasth'

const penguModelPath = getAssetPath('pengu.glb')

const cameraPosition: Float3 = [0, 0, 8]
const cameraTarget: Float3 = [0, 0, 0]
const cameraUp: Float3 = [0, 1, 0]

function Renderer() {
  const { camera, view, scene, lightManager } = useFilamentContext()
  useDefaultLight(false)
  const model = useModel({ path: penguModelPath })

  const prevAspectRatio = useSharedValue(0)
  const assetAnimator = useAssetAnimator(getAssetFromModel(model))
  useRenderCallback(
    useWorkletCallback(
      (_timestamp: number, _startTime: number, passedSeconds: number) => {
        'worklet'

        const aspectRatio = view.getAspectRatio()
        if (prevAspectRatio.value !== aspectRatio) {
          prevAspectRatio.value = aspectRatio
          // Setup camera lens:
          const { focalLengthInMillimeters, near, far } = Config.camera
          camera.setLensProjection(focalLengthInMillimeters, aspectRatio, near, far)
          console.log('Updated camera lens!')
        }

        camera.lookAt(cameraPosition, cameraTarget, cameraUp)

        if (assetAnimator == null) {
          return
        }

        assetAnimator.applyAnimation(0, passedSeconds)
        assetAnimator.updateBoneMatrices()
      },
      [camera, prevAspectRatio, view, assetAnimator]
    )
  )

  const lightIntensity = useSharedValue(100_000)
  const lightEntity = useLightEntity(lightManager, {
    type: 'directional',
    castShadows: true,
    colorKelvin: 2_500,
    direction: [0, -1, 0],
    intensity: lightIntensity,
    position: [0, 0, 0],
  })
  useEntityInScene(scene, lightEntity)

  console.log('')

  return (
    <SafeAreaView style={styles.container}>
      <Filament style={styles.filamentView} />
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
  return (
    <FilamentProvider>
      <Renderer />
    </FilamentProvider>
  )
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

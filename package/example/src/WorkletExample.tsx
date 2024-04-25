import React from 'react'
import { useSharedValue } from 'react-native-worklets-core'
import { Button, Platform, SafeAreaView, StyleSheet, View } from 'react-native'
import {
  DynamicResolutionOptions,
  Filament,
  FilamentProvider,
  Float3,
  getAssetFromModel,
  useAssetAnimator,
  useFilamentContext,
  useModel,
  useRenderCallback,
  useWorkletCallback,
} from 'react-native-filament'
import { useDefaultLight } from './hooks/useDefaultLight'
import { Config } from './config'
import { getAssetPath } from './utils/getAssetPasth'

const penguModelPath = Platform.select({
  android: 'custom/pengu.glb',
  ios: 'pengu.glb',
})!

function Model() {
  useModel({
    path: getAssetPath('coffeeshop.glb'),
    addToScene: true,
  })
  useModel({
    path: getAssetPath('coffeeshop_table_level03.glb'),
    addToScene: true,
  })
  useModel({
    path: getAssetPath('coffeeshop_seating_level03.glb'),
    addToScene: true,
  })
  useModel({
    path: getAssetPath('coffeeshop_plant_level03.glb'),
    addToScene: true,
  })
  useModel({
    path: getAssetPath('coffeeshop_machine_level03.glb'),
    addToScene: true,
  })

  return null
}

const cameraPosition: Float3 = [0, 3, 13]
const cameraTarget: Float3 = [0, 0, 0]
const cameraUp: Float3 = [0, 1, 0]

function Renderer() {
  const { camera, view } = useFilamentContext()
  useDefaultLight()
  const asset = useModel({
    path: penguModelPath,
    addToScene: true,
  })

  const prevAspectRatio = useSharedValue(0)
  const assetAnimator = useAssetAnimator(getAssetFromModel(asset))
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
      [assetAnimator, camera, prevAspectRatio, view]
    )
  )

  const [showItem, setShowItem] = React.useState(true)

  return (
    <SafeAreaView style={styles.container}>
      <Filament style={styles.filamentView} />
      {showItem && <Model />}
      <Button
        title="Toggle item"
        onPress={() => {
          // setShowItem((prev) => !prev)
          setInterval(() => {
            setShowItem((prev) => !prev)
          }, 100)
        }}
      />
    </SafeAreaView>
  )
}

// Dynamic Resolution can greatly improve the performance on lower end android devices.
// It will downscale the resolution (thus reducing the load on the GPU) when the frame rate drops
// below the target frame rate (currently hard coded to 60 FPS).
const dynamicResolutionOptions: DynamicResolutionOptions = {
  enabled: true,
}

export function WorkletExample() {
  const [showView, setShowView] = React.useState(true)

  return (
    <View style={styles.container}>
      {showView ? (
        <FilamentProvider dynamicResolutionOptions={dynamicResolutionOptions}>
          <Renderer />
        </FilamentProvider>
      ) : (
        <View style={styles.container} />
      )}
      <Button
        title="Toggle view"
        onPress={() => {
          setInterval(() => {
            setShowView((prev) => !prev)
          }, 195)
        }}
      />
    </View>
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

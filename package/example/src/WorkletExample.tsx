import React, { useCallback, useEffect } from 'react'
import { useSharedValue } from 'react-native-worklets-core'
import { Button, Platform, SafeAreaView, StyleSheet, View } from 'react-native'
import {
  DynamicResolutionOptions,
  Filament,
  FilamentProvider,
  Float3,
  getAssetFromModel,
  useAsset,
  useAssetAnimator,
  useFilamentContext,
  useModel,
  useRenderCallback,
  useSkybox,
  useWorkletEffect,
} from 'react-native-filament'
import { useDefaultLight } from './hooks/useDefaultLight'
import { Config } from './config'
import { getAssetPath } from './utils/getAssetPasth'

const cameraPosition: Float3 = [0, 0, 10]
const cameraTarget: Float3 = [0, 0, 0]
const cameraUp: Float3 = [0, 1, 0]

function Renderer() {
  const { camera, view, renderableManager, scene, transformManager } = useFilamentContext()
  useDefaultLight()
  // const model = useModel({ path: getAssetPath('pengu.glb') })
  // const asset = getAssetFromModel(model)

  const prevAspectRatio = useSharedValue(0)
  useRenderCallback(
    useCallback(() => {
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
    }, [camera, prevAspectRatio, view])
  )

  // TODO: check if we can replace material
  const material = useAsset({ path: getAssetPath('baked_color.filamat') })
  useWorkletEffect(() => {
    'worklet'

    // if (asset != null) {
    //   transformManager.setEntityPosition(asset.getRoot(), [0, 0, -30], false)
    // }

    if (material == null) return
    const entity = renderableManager.createDebugCube(material, 1, 1, 1)
    scene.addEntity(entity)
    console.log('added to scene!', entity)

    // return () => {
    //   scene.removeEntity(entity)
    //   console.log('removed from scene!', entity)
    // }
  }, [material, renderableManager, scene, transformManager])

  return (
    <SafeAreaView style={styles.container}>
      <Filament style={styles.filamentView} enableTransparentRendering={false} />
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
        <FilamentProvider>
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
    // backgroundColor: 'black',
  },
})

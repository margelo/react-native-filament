import React, { useCallback, useEffect } from 'react'
import { useSharedValue } from 'react-native-worklets-core'
import { Button, SafeAreaView, StyleSheet, View } from 'react-native'
import {
  DynamicResolutionOptions,
  Entity,
  Filament,
  FilamentProvider,
  Float3,
  runOnWorklet,
  useAsset,
  useFilamentContext,
  useRenderCallback,
} from 'react-native-filament'
import { useDefaultLight } from './hooks/useDefaultLight'
import { Config } from './config'
import { getAssetPath } from './utils/getAssetPasth'

const cameraPosition: Float3 = [0, 2, 7]
const cameraTarget: Float3 = [0, 0, 0]
const cameraUp: Float3 = [0, 1, 0]

function Renderer() {
  const { engine, camera, view, renderableManager, scene, transformManager } = useFilamentContext()
  useDefaultLight()

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
  const materialBuffer = useAsset({ path: getAssetPath('baked_color.filamat') })
  useEffect(() => {
    'worklet'

    if (materialBuffer == null) return

    let entity: Entity | undefined
    runOnWorklet(() => {
      'worklet'

      const debugEntity = renderableManager.createDebugCubeWireframe([1, 1, 1], undefined, undefined)
      scene.addEntity(debugEntity)
      return debugEntity
    })().then((e) => {
      entity = e
    })

    return () => {
      if (entity == null) return
      scene.removeEntity(entity)
    }
  }, [materialBuffer, renderableManager, scene, transformManager])

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

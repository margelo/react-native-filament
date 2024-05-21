import { Filament, FilamentProvider, Float3, RenderCallback, getAssetFromModel, useFilamentContext, useModel } from 'react-native-filament'
import { getAssetPath } from './utils/getAssetPasth'
import React, { useCallback, useEffect } from 'react'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { StyleSheet } from 'react-native'
import { useSharedValue } from 'react-native-worklets-core'
import { useDefaultLight } from './hooks/useDefaultLight'

// Camera config:
const cameraPosition: Float3 = [0, 0, 8]
const cameraTarget: Float3 = [0, 0, 0]
const cameraUp: Float3 = [0, 1, 0]
const focalLengthInMillimeters = 28
const near = 0.1
const far = 1000

const penguModelPath = getAssetPath('pengu.glb')

function Renderer() {
  const pengu = useModel({ path: penguModelPath })
  const asset = getAssetFromModel(pengu)
  const { view, camera, transformManager } = useFilamentContext()
  useDefaultLight()

  const prevAspectRatio = useSharedValue(0)
  const renderCallback: RenderCallback = useCallback(
    ({ passedSeconds }) => {
      'worklet'

      const aspectRatio = view.getAspectRatio()
      if (prevAspectRatio.value !== aspectRatio) {
        prevAspectRatio.value = aspectRatio
        // Setup camera lens:
        camera.setLensProjection(focalLengthInMillimeters, aspectRatio, near, far)
        console.log('Setting up camera lens with aspect ratio:', aspectRatio)
      }

      camera.lookAt(cameraPosition, cameraTarget, cameraUp)
    },
    [view, prevAspectRatio, camera]
  )

  useEffect(() => {
    if (asset == null) return
    transformManager.transformToUnitCube(asset)
  }, [asset, transformManager])

  const panGesture = Gesture.Pan()

  return (
    <GestureDetector gesture={panGesture}>
      <Filament style={styles.container} renderCallback={renderCallback} />
    </GestureDetector>
  )
}

export function CameraPan() {
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
})

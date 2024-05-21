import { Filament, FilamentProvider, Float3, RenderCallback, getAssetFromModel, useFilamentContext, useModel } from 'react-native-filament'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { LayoutChangeEvent, StyleSheet, View } from 'react-native'
import { useSharedValue } from 'react-native-worklets-core'
import { useDefaultLight } from './hooks/useDefaultLight'

// Camera config:
const cameraPosition: Float3 = [0, 0, 8]
const cameraTarget: Float3 = [0, 0, 0]
const cameraUp: Float3 = [0, 1, 0]
const focalLengthInMillimeters = 28
const near = 0.1
const far = 1000

const modelPath = 'https://raw.githubusercontent.com/google/filament/main/third_party/models/DamagedHelmet/DamagedHelmet.glb'

function Renderer() {
  const model = useModel({ uri: modelPath })
  const asset = getAssetFromModel(model)
  const { engine, view, camera, transformManager } = useFilamentContext()
  useDefaultLight()

  const cameraManipulator = useMemo(
    () =>
      engine.createOrbitCameraManipulator({
        orbitHomePosition: cameraPosition,
        targetPosition: cameraTarget,
        upVector: cameraUp,
      }),
    [engine]
  )

  const prevAspectRatio = useSharedValue(0)
  const renderCallback: RenderCallback = useCallback(() => {
    'worklet'

    const aspectRatio = view.getAspectRatio()
    if (prevAspectRatio.value !== aspectRatio) {
      prevAspectRatio.value = aspectRatio
      // Setup camera lens:
      camera.setLensProjection(focalLengthInMillimeters, aspectRatio, near, far)
      console.log('Setting up camera lens with aspect ratio:', aspectRatio)
    }

    //   camera.lookAt(cameraPosition, cameraTarget, cameraUp)
    //   const [cameraPosition, cameraTarget, cameraUp] = cameraManipulator.getLookAt()
    camera.lookAtCameraManipulator(cameraManipulator)
  }, [view, prevAspectRatio, cameraManipulator, camera])

  useEffect(() => {
    if (asset == null) return
    transformManager.transformToUnitCube(asset)
  }, [asset, transformManager])

  const [viewHeight, setViewHeight] = useState<number>()
  const panGesture = Gesture.Pan()
    .onBegin((event) => {
      if (viewHeight == null) return

      const yCorrected = viewHeight - event.translationY
      cameraManipulator.grabBegin(event.translationX, yCorrected, false)
    })
    .onUpdate((event) => {
      if (viewHeight == null) return

      const yCorrected = viewHeight - event.translationY
      cameraManipulator.grabUpdate(event.translationX, yCorrected)
    })
    .maxPointers(1)
    .onEnd(() => {
      cameraManipulator.grabEnd()
    })
    .enabled(viewHeight != null)
  const previousScale = useSharedValue(1)
  const scaleMultiplier = 100
  const pinchGesture = Gesture.Pinch()
    .onBegin(({ scale }) => {
      previousScale.value = scale
    })
    .onUpdate(({ scale, focalX, focalY }) => {
      const delta = scale - previousScale.value
      cameraManipulator.scroll(focalX, focalY, -delta * scaleMultiplier)
      previousScale.value = scale
    })
  const combinedGesture = Gesture.Race(pinchGesture, panGesture)

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setViewHeight(event.nativeEvent.layout.height)
  }, [])

  return (
    <View style={{ flex: 1 }}>
      <GestureDetector gesture={combinedGesture}>
        <View onLayout={onLayout} style={styles.container}>
          <Filament style={styles.container} renderCallback={renderCallback} />
        </View>
      </GestureDetector>
    </View>
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

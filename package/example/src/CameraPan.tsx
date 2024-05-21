import { Camera, Filament, Model, useCameraManipulator } from 'react-native-filament'
import React, { useCallback, useState } from 'react'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { LayoutChangeEvent, StyleSheet, View } from 'react-native'
import { useSharedValue } from 'react-native-worklets-core'
import { useDefaultLight } from './hooks/useDefaultLight'

const modelPath = 'https://raw.githubusercontent.com/google/filament/main/third_party/models/DamagedHelmet/DamagedHelmet.glb'

function Scene() {
  useDefaultLight()

  const cameraManipulator = useCameraManipulator({
    orbitHomePosition: [0, 0, 8], // "Camera location"
    targetPosition: [0, 0, 0], // "Looking at"
  })

  // Pan gesture
  const [viewHeight, setViewHeight] = useState<number>() // As we need to invert the Y axis we must know the view height
  const panGesture = Gesture.Pan()
    .onBegin((event) => {
      if (viewHeight == null) return

      const yCorrected = viewHeight - event.translationY
      cameraManipulator?.grabBegin(event.translationX, yCorrected, false) // false means rotation instead of translation
    })
    .onUpdate((event) => {
      if (viewHeight == null) return

      const yCorrected = viewHeight - event.translationY
      cameraManipulator?.grabUpdate(event.translationX, yCorrected)
    })
    .maxPointers(1)
    .onEnd(() => {
      cameraManipulator?.grabEnd()
    })
    .enabled(viewHeight != null)

  // Scale gesture
  const previousScale = useSharedValue(1)
  const scaleMultiplier = 100
  const pinchGesture = Gesture.Pinch()
    .onBegin(({ scale }) => {
      previousScale.value = scale
    })
    .onUpdate(({ scale, focalX, focalY }) => {
      const delta = scale - previousScale.value
      cameraManipulator?.scroll(focalX, focalY, -delta * scaleMultiplier)
      previousScale.value = scale
    })
  const combinedGesture = Gesture.Race(pinchGesture, panGesture)

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    setViewHeight(event.nativeEvent.layout.height)
  }, [])

  return (
    <View onLayout={onLayout} style={styles.container}>
      <GestureDetector gesture={combinedGesture}>
        <View style={styles.container}>
          <Camera cameraManipulator={cameraManipulator} />

          <Model source={{ uri: modelPath }} transformToUnitCube />
        </View>
      </GestureDetector>
    </View>
  )
}

export function CameraPan() {
  return (
    <Filament>
      <Scene />
    </Filament>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})

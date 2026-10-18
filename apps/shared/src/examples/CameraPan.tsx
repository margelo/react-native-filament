import React from 'react'
import { StyleSheet } from 'react-native'
import { GestureDetector } from 'react-native-gesture-handler'
import { Camera, DefaultLight, FilamentScene, FilamentView, Model, useCameraManipulator, useOrbitGestures, type CameraManipulator } from 'react-native-filament'

const modelPath = 'https://raw.githubusercontent.com/google/filament/main/third_party/models/DamagedHelmet/DamagedHelmet.glb'

function OrbitView({ manipulator }: { manipulator: CameraManipulator }) {
  const gesture = useOrbitGestures(manipulator)
  return (
    <GestureDetector gesture={gesture}>
      <FilamentView style={styles.container}>
        <Camera cameraManipulator={manipulator} />
        <DefaultLight />
        <Model source={{ uri: modelPath }} transformToUnitCube />
      </FilamentView>
    </GestureDetector>
  )
}

function Scene() {
  const manipulator = useCameraManipulator({ homePosition: [0, 0, 8], targetPosition: [0, 0, 0], orbitSpeed: 0.003 })
  return manipulator == null ? null : <OrbitView manipulator={manipulator} />
}

export function CameraPan() {
  return (
    <FilamentScene>
      <Scene />
    </FilamentScene>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
})

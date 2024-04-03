import React, { useCallback } from 'react'
import { useSharedValue } from 'react-native-worklets-core'
import { Button, Platform, SafeAreaView, StyleSheet } from 'react-native'
import { Engine, Filament, Float3, useCamera, useEngine, useModel, useRenderCallback, useView } from 'react-native-filament'
import { useDefaultLight } from './hooks/useDefaultLight'
import { Config } from './config'

const penguModelPath = Platform.select({
  android: 'custom/pengu.glb',
  ios: 'pengu.glb',
})!

function blockJS(): number {
  let sum = 0
  for (let i = 0; i < 1000000000; i++) {
    sum += i
  }
  return sum
}

function Renderer({ engine }: { engine: Engine }) {
  useDefaultLight(engine)
  // const asset = useModel({
  //   engine,
  //   path: penguModelPath,
  // })

  // const view = useView(engine)
  // const camera = useCamera(engine)

  const prevAspectRatio = useSharedValue(0)
  // useRenderCallback(
  //   engine,
  //   useCallback(
  //     (_timestamp: number, _startTime: number, passedSeconds: number) => {
  //       'worklet'

  //       const aspectRatio = view.aspectRatio
  //       if (prevAspectRatio.value !== aspectRatio) {
  //         prevAspectRatio.value = aspectRatio
  //         // Setup camera lens:
  //         const { focalLengthInMillimeters, near, far } = Config.camera
  //         camera.setLensProjection(focalLengthInMillimeters, aspectRatio, near, far)
  //       }

  //       // Arrays aren't currently copied to the worklet correctly, see:
  //       // https://github.com/margelo/react-native-worklets-core/pull/147
  //       const cameraPosition: Float3 = [0, 0, 8]
  //       const cameraTarget: Float3 = [0, 0, 0]
  //       const cameraUp: Float3 = [0, 1, 0]
  //       camera.lookAt(cameraPosition, cameraTarget, cameraUp)

  //       if (asset.state === 'loading') {
  //         return
  //       }
  //       const animator = asset.animator

  //       animator.applyAnimation(0, passedSeconds)
  //       animator.updateBoneMatrices()
  //     },
  //     [asset, camera, prevAspectRatio, view]
  //   )
  // )

  return (
    <SafeAreaView style={styles.container}>
      <Filament style={styles.filamentView} engine={engine} />
      <Button
        title="Block JS thread temporarily"
        onPress={() => {
          console.log('Blocking JS thread...')
          setTimeout(() => {
            blockJS()
            console.log('JS thread unblocked!')
          }, 0)
        }}
      />
    </SafeAreaView>
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
  },
  filamentView: {
    flex: 1,
    backgroundColor: 'lightblue',
  },
})

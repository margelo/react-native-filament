import React, { useCallback } from 'react'
import { useSharedValue, useWorklet } from 'react-native-worklets-core'
import { FilamentProxy } from '../../src/native/FilamentProxy'
import { useEffect } from 'react'
import { Button, Platform, SafeAreaView, StyleSheet } from 'react-native'
import { Engine, Filament, Float3, useAsset, useEngine, useModel, useRenderCallback } from 'react-native-filament'

const context = FilamentProxy.getWorkletContext()

const penguModelPath = Platform.select({
  android: 'custom/pengu.glb',
  ios: 'pengu.glb',
})!

const indirectLightPath = Platform.select({
  android: 'custom/default_env_ibl.ktx',
  ios: 'default_env_ibl.ktx',
})!

function blockJS(): void {
  let sum = 0
  for (let i = 0; i < 1000000000; i++) {
    sum += i
  }
}

function Renderer({ engine }: { engine: Engine }) {
  const asset = useModel({
    engine,
    path: penguModelPath,
  })

  // Add light:
  const lightBuffer = useAsset({ path: indirectLightPath })

  const addLight = useWorklet(
    context,
    () => {
      'worklet'
      if (lightBuffer == null) return
      engine.setIndirectLight(lightBuffer)
      const directionalLight = engine.createLightEntity('directional', 6500, 10000, 0, -1, 0, true)
      engine.getScene().addEntity(directionalLight)
    },
    [lightBuffer]
  )

  useEffect(() => {
    addLight()
  }, [addLight])

  const prevAspectRatio = useSharedValue(0)
  useRenderCallback(
    engine,
    useCallback(
      (_timestamp: number, _startTime: number, passedSeconds: number) => {
        'worklet'

        // Camera config:
        const cameraPosition: Float3 = [0, 0, 8]
        const cameraTarget: Float3 = [0, 0, 0]
        const cameraUp: Float3 = [0, 1, 0]
        const focalLengthInMillimeters = 28
        const near = 0.1
        const far = 1000

        const camera = engine.getCamera()
        const aspectRatio = engine.getView().aspectRatio
        if (prevAspectRatio.value !== aspectRatio) {
          prevAspectRatio.value = aspectRatio
          // Setup camera lens:
          camera.setLensProjection(focalLengthInMillimeters, aspectRatio, near, far)
        }

        camera.lookAt(cameraPosition, cameraTarget, cameraUp)

        if (asset.state === 'loading') {
          return
        }
        const animator = asset.animator

        animator.applyAnimation(0, passedSeconds)
        animator.updateBoneMatrices()
      },
      [asset, engine, prevAspectRatio]
    )
  )

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

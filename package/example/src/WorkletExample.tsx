import React, { useState } from 'react'
import { Worklets, useRunInJS, useSharedValue, useWorklet } from 'react-native-worklets-core'
import { FilamentProxy } from '../../src/native/FilamentProxy'
import { useEffect } from 'react'
import { Button, Platform, StyleSheet, View } from 'react-native'
import {
  Animator,
  Engine,
  Filament,
  Float3,
  useAsset,
  useCamera,
  useModel,
  useRenderCallback,
  useScene,
  useView,
} from 'react-native-filament'
import { FilamentBuffer } from '../../src/native/FilamentBuffer'
import { reportWorkletError } from '../../src/ErrorUtils'

const context = FilamentProxy.getWorkletContext()

function useEngine() {
  const sharedEngine = useSharedValue(FilamentProxy.createEngine())
  return sharedEngine
}

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
  const [assetBuffer, setAssetBuffer] = useState<FilamentBuffer>()
  useEffect(() => {
    FilamentProxy.loadAsset(penguModelPath).then((buffer) => {
      setAssetBuffer(buffer)
    })
  }, [])

  // Adding asset to the scene
  const assetAnimator = useSharedValue<Animator | undefined>(undefined)
  const addAsset = useWorklet(
    context,
    () => {
      'worklet'
      if (assetBuffer == null) return

      const asset = engine.loadAsset(assetBuffer)
      assetAnimator.value = asset.getAnimator()
      engine.getScene().addAssetEntities(asset)

      console.log('Asset added to the scene!')
    },
    [assetBuffer]
  )

  useEffect(() => {
    addAsset()
  }, [addAsset])

  // Add light:
  const [lightBuffer, setLightBuffer] = useState<FilamentBuffer>()
  useEffect(() => {
    FilamentProxy.loadAsset(indirectLightPath).then((buffer) => {
      setLightBuffer(buffer)
    })
  }, [])

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
  useEffect(() => {
    Worklets.createRunInContextFn(() => {
      'worklet'
      engine.setRenderCallback((_timestamp, _startTime, passedSeconds) => {
        try {
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

          if (assetAnimator.value == null) {
            return
          }

          assetAnimator.value.applyAnimation(0, passedSeconds)
          assetAnimator.value.updateBoneMatrices()
        } catch (e) {
          reportWorkletError(e)
        }
      })
    }, context)()
  }, [assetAnimator, engine, prevAspectRatio])

  return (
    <View style={styles.container}>
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
    </View>
  )
}

export function WorkletExample() {
  const asyncEngine = useWorklet(
    context,
    () => {
      'worklet'
      return FilamentProxy.createEngine()
    },
    []
  )

  const [engine, setEngine] = React.useState<Engine | null>(null)

  useEffect(() => {
    const asyncEffect = async () => {
      const _engine = await asyncEngine()
      setEngine(_engine)
    }
    asyncEffect()
  }, [asyncEngine])

  if (engine == null) return null
  return <Renderer engine={engine} />
}

export function WorkletExample2() {
  const sharedEngine = useEngine()
  const engine = sharedEngine.value
  //   const scene = useScene(engine)
  //   const view = useView(engine)
  //   const camera = useCamera(engine)
  const light = useAsset({ path: indirectLightPath })
  const asset = useModel({ engine: engine, path: penguModelPath })

  useEffect(() => {
    if (light == null) return
    // create a default light
    engine.setIndirectLight(light)

    // Create a directional light for supporting shadows
    const directionalLight = engine.createLightEntity('directional', 6500, 10000, 0, -1, 0, true)
    engine.getScene().addEntity(directionalLight)
    return () => {
      engine.getScene().removeEntity(directionalLight)
    }
  }, [engine, light])

  const prevAspectRatio = useSharedValue(0)
  useRenderCallback(engine, (_timestamp, _startTime, passedSeconds) => {
    'worklet'

    const camera = sharedEngine.value.getCamera()
    const aspectRatio = sharedEngine.value.getView().aspectRatio
    if (prevAspectRatio.value !== aspectRatio) {
      prevAspectRatio.value = aspectRatio
      // Setup camera lens:
      camera.setLensProjection(focalLengthInMillimeters, aspectRatio, near, far)
    }

    camera.lookAt(cameraPosition, cameraTarget, cameraUp)

    if (asset.state === 'loading') {
      return
    }
  })

  return (
    <View style={styles.container}>
      <Filament style={styles.filamentView} engine={engine} />
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

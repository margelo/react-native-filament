/**
 * Scale an asset from 0 to its original size.
 */

import * as React from 'react'
import { useEffect, useRef } from 'react'

import { Animated, Button, Platform, StyleSheet, View } from 'react-native'
import {
  Filament,
  useEngine,
  Float3,
  useRenderCallback,
  useAsset,
  useModel,
  useView,
  useCamera,
  useScene,
  useTransformManager,
  Mat4,
} from 'react-native-filament'

const modelPath = Platform.select({
  android: 'custom/coin.glb',
  ios: 'coin.glb',
})!

const indirectLightPath = Platform.select({
  android: 'custom/default_env_ibl.ktx',
  ios: 'default_env_ibl.ktx',
})!

// Camera config:
const cameraPosition: Float3 = [0, 1, 10]
const cameraTarget: Float3 = [0, 0, 0]
const cameraUp: Float3 = [0, 1, 0]
const focalLengthInMillimeters = 28
const near = 0.1
const far = 1000

export function ScaleEffect() {
  const engine = useEngine()
  const transformManager = useTransformManager(engine)
  const view = useView(engine)
  const camera = useCamera(engine)
  const scene = useScene(engine)

  const model = useModel({ engine: engine, path: modelPath, autoAddToScene: false })
  const modelAsset = model.state === 'loaded' ? model.asset : null
  const originalTransformRef = useRef<Mat4 | null>(null)

  useEffect(() => {
    if (modelAsset == null) return
    const rootEntity = modelAsset.getRoot()
    originalTransformRef.current = transformManager.getTransform(rootEntity)

    engine.setEntityScale(rootEntity, [0, 0, 0], false)
    scene.addAssetEntities(modelAsset)
  }, [engine, modelAsset, scene, transformManager])

  const onScale = () => {
    if (modelAsset == null || originalTransformRef.current == null) return
    const rootEntity = modelAsset.getRoot()
    const animatedScale = new Animated.Value(0)

    const transform = originalTransformRef.current
    animatedScale.addListener(({ value }) => {
      transformManager.openLocalTransformTransaction()
      const scaledTransform = transform.scaling([value, value, value])
      transformManager.setTransform(rootEntity, scaledTransform)
      transformManager.commitLocalTransformTransaction()
    })

    Animated.spring(animatedScale, {
      toValue: 1,
      mass: 3,
      stiffness: 1000,
      damping: 500,
      useNativeDriver: false,
    }).start()
  }

  //#region Setup lights
  const light = useAsset({ path: indirectLightPath })
  useEffect(() => {
    if (light == null) return
    // create a default light
    engine.setIndirectLight(light)

    // Create a directional light for supporting shadows
    const directionalLight = engine.createLightEntity('directional', 6500, 10000, 0, -1, 0, true)
    scene.addEntity(directionalLight)
    return () => {
      // TODO: Remove directionalLight from scene
    }
  }, [engine, light, scene])
  //#endregion

  const prevAspectRatio = useRef(0)
  useRenderCallback(engine, () => {
    const aspectRatio = view.aspectRatio
    if (prevAspectRatio.current !== aspectRatio) {
      prevAspectRatio.current = aspectRatio
      // Setup camera lens:
      camera.setLensProjection(focalLengthInMillimeters, aspectRatio, near, far)
    }

    camera.lookAt(cameraPosition, cameraTarget, cameraUp)
  })

  return (
    <View style={styles.container}>
      <Filament style={styles.filamentView} engine={engine} />
      <Button title="Scale" onPress={onScale} />
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

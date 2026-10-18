import React, { useEffect, useState } from 'react'
import { Button, Image, StyleSheet, View } from 'react-native'
import { callback } from 'react-native-nitro-modules'
import {
  defaultIndirectLightSource,
  Filament,
  NativeFilamentView,
  runOnRenderThread,
  type Engine,
  type FilamentView,
  type MaterialInstance,
  type Texture,
  type ViewTarget,
} from 'react-native-filament'
import { imageFitTransform, type ImageFit } from './utils/imageFitTransform'

const drone = Image.resolveAssetSource(require('../assets/buster_drone.glb'))
const photo = Image.resolveAssetSource(require('../assets/background.jpg'))
const backgroundMaterial = Image.resolveAssetSource(require('../assets/background_image.filamat'))

interface Background {
  engine: Engine
  target: ViewTarget
  image: Texture
  instance: MaterialInstance
}

export function ImageExample() {
  const [view, setView] = useState<FilamentView>()
  const [background, setBackground] = useState<Background>()
  const [fit, setFit] = useState<ImageFit>('cover')

  useEffect(() => {
    if (view == null) return
    let active = true
    const starting = Filament.createEngine({}).then(async (engine) => {
      const [target, model, environment, image, material] = await Promise.all([
        engine.createViewTarget(view, {}),
        engine.loadModel({ uri: drone.uri }, {}),
        engine.loadIndirectLight(defaultIndirectLightSource, {}),
        engine.loadTexture({ uri: photo.uri }, {}),
        engine.loadMaterial({ uri: backgroundMaterial.uri }),
      ])
      const { camera, instance } = await runOnRenderThread(engine, () => {
        'worklet'
        const scene = engine.createScene()
        scene.setIndirectLight(environment)
        scene.addEntity(engine.createDirectionalLight({ direction: [0.3, -1, -0.6] }).entity)
        scene.addModel(model)
        engine.transformManager.transformToUnitCube(model.rootEntity, model.boundingBox)
        const created = material.createInstance()
        created.setTexture('image', image, {})
        created.setIntParameter('showImage', 1)
        created.setFloat3Parameter('backgroundColor', [0.1, 0.1, 0.1])
        scene.addEntity(engine.createBackground(created).entity)
        const lens = engine.createCamera()
        lens.lookAt([0, 0, 4], [0, 0, 0], [0, 1, 0])
        target.setScene(scene)
        target.setCamera(lens)
        return { camera: lens, instance: created }
      })
      const resize = target.addOnResizeListener((width, height) => {
        runOnRenderThread(engine, () => {
          'worklet'
          camera.setLensProjection(28, width / height, 0.1, 100)
        })
      })
      if (active) setBackground({ engine, target, image, instance })
      return { engine, resize }
    })
    return () => {
      active = false
      starting.then(({ engine, resize }) => {
        resize.remove()
        engine.shutdown()
      })
    }
  }, [view])

  useEffect(() => {
    if (background == null) return
    const { engine, target, image, instance } = background
    const subscription = target.addOnResizeListener((width, height) => {
      runOnRenderThread(engine, () => {
        'worklet'
        instance.setMat3Parameter('transform', imageFitTransform(image, width, height, fit))
      })
    })
    return () => subscription.remove()
  }, [background, fit])

  return (
    <View style={styles.container}>
      <NativeFilamentView style={styles.container} hybridRef={callback(setView)} />
      <Button title={`Resize mode: ${fit}`} onPress={() => setFit((value) => (value === 'cover' ? 'contain' : 'cover'))} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
})

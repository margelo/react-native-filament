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
  type Renderable,
  type Scene,
} from 'react-native-filament'
import { imageFitTransform } from './utils/imageFitTransform'

const rocket = Image.resolveAssetSource(require('../assets/rocket.glb'))
const photo = Image.resolveAssetSource(require('../assets/background.jpg'))
const backgroundMaterial = Image.resolveAssetSource(require('../assets/background_image.filamat'))
const shadowMaterial = Image.resolveAssetSource(require('../assets/transparent_shadow_material.filamat'))

interface Bounds {
  engine: Engine
  scene: Scene
  box: Renderable
}

export function BackgroundShadowsExample() {
  const [view, setView] = useState<FilamentView>()
  const [bounds, setBounds] = useState<Bounds>()
  const [showBounds, setShowBounds] = useState(true)

  useEffect(() => {
    if (view == null) return
    let active = true
    const starting = Filament.createEngine({}).then(async (engine) => {
      const [target, model, environment, image, background, shadow] = await Promise.all([
        engine.createViewTarget(view, {}),
        engine.loadModel({ uri: rocket.uri }, {}),
        engine.loadIndirectLight(defaultIndirectLightSource, { intensity: 20000 }),
        engine.loadTexture({ uri: photo.uri }, {}),
        engine.loadMaterial({ uri: backgroundMaterial.uri }),
        engine.loadMaterial({ uri: shadowMaterial.uri }),
      ])
      const setup = await runOnRenderThread(engine, () => {
        'worklet'
        target.view.shadowType = 'vsm'
        const scene = engine.createScene()
        scene.setIndirectLight(environment)
        const sun = engine.createDirectionalLight({ direction: [0.6, -1, 0.8], intensityLux: 60000, castShadows: true })
        scene.addEntity(sun.entity)

        scene.addModel(model)
        engine.transformManager.transformToUnitCube(model.rootEntity, model.boundingBox)
        const rm = engine.renderableManager
        for (const entity of model.entities) {
          if (rm.hasComponent(entity)) rm.setCastShadows(entity, true)
        }
        const [x, y, z] = model.boundingBox.halfExtent
        const scale = 1 / Math.max(x, y, z)
        const halfExtent: [number, number, number] = [x * scale, y * scale, z * scale]
        const box = engine.createDebugBox({ halfExtent, color: [1, 0.8, 0, 1] })
        scene.addEntity(box.entity)

        const shadowInstance = shadow.createInstance()
        shadowInstance.setFloatParameter('strength', 0.85)
        const ground = engine.createPlane({ width: 6, depth: 6 }, shadowInstance)
        engine.transformManager.setTranslation(ground.entity, [0, -halfExtent[1], 0])
        scene.addEntity(ground.entity)

        const backgroundInstance = background.createInstance()
        backgroundInstance.setTexture('image', image, {})
        backgroundInstance.setIntParameter('showImage', 1)
        backgroundInstance.setFloat3Parameter('backgroundColor', [0, 0, 0])
        const backdrop = engine.createBackground(backgroundInstance)
        scene.addEntity(backdrop.entity)

        const lens = engine.createCamera()
        lens.lookAt([0, 1.4, 4.6], [0, -0.2, 0], [0, 1, 0])
        target.setScene(scene)
        target.setCamera(lens)
        return { scene, box, camera: lens, backgroundInstance }
      })
      const resize = target.addOnResizeListener((width, height) => {
        runOnRenderThread(engine, () => {
          'worklet'
          setup.camera.setLensProjection(28, width / height, 0.1, 100)
          setup.backgroundInstance.setMat3Parameter('transform', imageFitTransform(image, width, height, 'cover'))
        })
      })
      if (active) setBounds({ engine, scene: setup.scene, box: setup.box })
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

  const toggleBounds = () => {
    if (bounds == null) return
    const visible = !showBounds
    setShowBounds(visible)
    runOnRenderThread(bounds.engine, () => {
      'worklet'
      if (visible) bounds.scene.addEntity(bounds.box.entity)
      else bounds.scene.removeEntity(bounds.box.entity)
    })
  }

  return (
    <View style={styles.container}>
      <NativeFilamentView style={styles.container} hybridRef={callback(setView)} />
      <Button title={showBounds ? 'Hide bounds' : 'Show bounds'} disabled={bounds == null} onPress={toggleBounds} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
})

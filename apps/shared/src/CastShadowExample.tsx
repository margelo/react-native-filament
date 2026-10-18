import React, { useEffect, useState } from 'react'
import { Button, Image, StyleSheet, View } from 'react-native'
import { callback } from 'react-native-nitro-modules'
import {
  defaultIndirectLightSource,
  Filament,
  NativeFilamentView,
  runOnRenderThread,
  type Engine,
  type Entity,
  type FilamentView,
  type ViewTarget,
} from 'react-native-filament'

const coin = Image.resolveAssetSource(require('../assets/coin.glb'))
const shadowMaterial = Image.resolveAssetSource(require('../assets/transparent_shadow_material.filamat'))

interface Loaded {
  engine: Engine
  target: ViewTarget
  coinEntities: Entity[]
}

export function CastShadowExample() {
  const [view, setView] = useState<FilamentView>()
  const [loaded, setLoaded] = useState<Loaded>()
  const [shadows, setShadows] = useState(true)
  const [ambientOcclusion, setAmbientOcclusion] = useState(false)

  useEffect(() => {
    if (view == null) return
    let active = true
    const starting = Filament.createEngine({}).then(async (engine) => {
      const [target, model, environment, shadow] = await Promise.all([
        engine.createViewTarget(view, {}),
        engine.loadModel({ uri: coin.uri }, {}),
        engine.loadIndirectLight(defaultIndirectLightSource, {}),
        engine.loadMaterial({ uri: shadowMaterial.uri }),
      ])
      const { camera, coinEntities } = await runOnRenderThread(engine, () => {
        'worklet'
        target.view.shadowType = 'vsm'
        const scene = engine.createScene()
        scene.setIndirectLight(environment)
        scene.addEntity(engine.createDirectionalLight({ direction: [0.3, -1, -0.2], castShadows: true }).entity)
        scene.addModel(model)
        engine.transformManager.setTranslation(model.rootEntity, [0, 2, 0])
        const instance = shadow.createInstance()
        instance.setFloatParameter('strength', 0.2)
        scene.addEntity(engine.createPlane({ width: 20, depth: 20 }, instance).entity)
        const lens = engine.createCamera()
        lens.lookAt([0, 3, 8], [0, 0.5, 0], [0, 1, 0])
        target.setScene(scene)
        target.setCamera(lens)
        return { camera: lens, coinEntities: model.entities.filter((entity) => engine.renderableManager.hasComponent(entity)) }
      })
      const resize = target.addOnResizeListener((width, height) => {
        runOnRenderThread(engine, () => {
          'worklet'
          camera.setLensProjection(28, width / height, 0.1, 100)
        })
      })
      if (active) setLoaded({ engine, target, coinEntities })
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
    if (loaded == null) return
    const { engine, target, coinEntities } = loaded
    runOnRenderThread(engine, () => {
      'worklet'
      for (const entity of coinEntities) {
        engine.renderableManager.setCastShadows(entity, shadows)
        engine.renderableManager.setReceiveShadows(entity, shadows)
      }
      target.view.setAmbientOcclusionOptions({ enabled: ambientOcclusion })
    })
  }, [loaded, shadows, ambientOcclusion])

  return (
    <View style={styles.background}>
      <NativeFilamentView style={styles.container} transparent hybridRef={callback(setView)} />
      <Button title={`Toggle shadow (${shadows ? 'enabled' : 'disabled'})`} onPress={() => setShadows((value) => !value)} />
      <Button title={`Toggle SSAO (${ambientOcclusion ? 'enabled' : 'disabled'})`} onPress={() => setAmbientOcclusion((value) => !value)} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1, backgroundColor: 'lightblue' },
})

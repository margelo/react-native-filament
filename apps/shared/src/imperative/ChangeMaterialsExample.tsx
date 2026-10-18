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
  type Model,
  type Texture,
} from 'react-native-filament'

const rocket = Image.resolveAssetSource(require('../../assets/rocket.glb'))
const blueBaseColor = Image.resolveAssetSource(require('../../assets/rocket_BaseColor_Blue.png'))
const skybox = Image.resolveAssetSource(require('../../assets/default_env_skybox.ktx'))

interface Loaded {
  engine: Engine
  model: Model
  blue: Texture
}

function paintBlue({ engine, model, blue }: Loaded): Promise<void> {
  return runOnRenderThread(engine, () => {
    'worklet'
    const rm = engine.renderableManager
    for (const name of ['Tip', 'Wings']) {
      const entity = model.getEntityByName(name)
      if (entity == null) continue
      for (let primitive = 0; primitive < rm.getPrimitiveCount(entity); primitive++) {
        const instance = rm.getMaterialInstanceAt(entity, primitive)
        if (instance.instanceName === 'Toy Ship') instance.setTexture('baseColorMap', blue, {})
      }
    }
  })
}

export function ChangeMaterialsExample() {
  const [view, setView] = useState<FilamentView>()
  const [loaded, setLoaded] = useState<Loaded>()

  useEffect(() => {
    if (view == null) return
    let active = true
    const starting = Filament.createEngine({}).then(async (engine) => {
      const [target, model, environment, background, blue] = await Promise.all([
        engine.createViewTarget(view, {}),
        engine.loadModel({ uri: rocket.uri }, {}),
        engine.loadIndirectLight(defaultIndirectLightSource, {}),
        engine.loadSkybox({ uri: skybox.uri }),
        engine.loadTexture({ uri: blueBaseColor.uri }, {}),
      ])
      const camera = await runOnRenderThread(engine, () => {
        'worklet'
        const scene = engine.createScene()
        scene.setIndirectLight(environment)
        scene.setSkybox(background)
        scene.addModel(model)
        engine.transformManager.transformToUnitCube(model.rootEntity, model.boundingBox)
        const lens = engine.createCamera()
        lens.lookAt([0, 0.3, 3.2], [0, 0, 0], [0, 1, 0])
        target.setScene(scene)
        target.setCamera(lens)
        return lens
      })
      const resize = target.addOnResizeListener((width, height) => {
        runOnRenderThread(engine, () => {
          'worklet'
          camera.setLensProjection(28, width / height, 0.1, 100)
        })
      })
      if (active) setLoaded({ engine, model, blue })
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

  return (
    <View style={styles.container}>
      <NativeFilamentView style={styles.container} hybridRef={callback(setView)} />
      <Button title="Paint it blue" disabled={loaded == null} onPress={() => loaded != null && paintBlue(loaded)} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
})

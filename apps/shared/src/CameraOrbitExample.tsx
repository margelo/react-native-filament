import React, { useEffect, useState } from 'react'
import { Image, StyleSheet, View, type LayoutChangeEvent } from 'react-native'
import { GestureDetector } from 'react-native-gesture-handler'
import { callback } from 'react-native-nitro-modules'
import {
  defaultIndirectLightSource,
  Filament,
  NativeFilamentView,
  runOnRenderThread,
  useOrbitGestures,
  type CameraManipulator,
  type Engine,
  type FilamentView,
} from 'react-native-filament'

const drone = Image.resolveAssetSource(require('../assets/buster_drone.glb'))

function OrbitView({ engine, manipulator }: { engine: Engine; manipulator: CameraManipulator }) {
  const [view, setView] = useState<FilamentView>()
  const gesture = useOrbitGestures(manipulator)

  useEffect(() => {
    if (view == null) return
    const starting = Promise.all([
      engine.createViewTarget(view, {}),
      engine.loadModel({ uri: drone.uri }, {}),
      engine.loadIndirectLight(defaultIndirectLightSource, {}),
    ]).then(async ([target, model, environment]) => {
      const { camera, sun } = await runOnRenderThread(engine, () => {
        'worklet'
        const scene = engine.createScene()
        const light = engine.createDirectionalLight({ direction: [0.3, -1, -0.6] })
        scene.setIndirectLight(environment)
        scene.addEntity(light.entity)
        scene.addModel(model)
        engine.transformManager.transformToUnitCube(model.rootEntity, model.boundingBox)
        const lens = engine.createCamera()
        lens.followManipulator(manipulator)
        target.setScene(scene)
        target.setCamera(lens)
        return { camera: lens, sun: light }
      })
      const resize = target.addOnResizeListener((width, height) => {
        runOnRenderThread(engine, () => {
          'worklet'
          camera.setLensProjection(28, width / height, 0.1, 100)
        })
      })
      return { sun, resize }
    })
    return () => {
      starting.then(({ resize }) => resize.remove())
    }
  }, [engine, manipulator, view])

  const onLayout = ({ nativeEvent }: LayoutChangeEvent) => manipulator.setViewport(nativeEvent.layout.width, nativeEvent.layout.height)

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.container} onLayout={onLayout}>
        <NativeFilamentView style={styles.container} hybridRef={callback(setView)} />
      </View>
    </GestureDetector>
  )
}

export function CameraOrbitExample() {
  const [orbit, setOrbit] = useState<{ engine: Engine; manipulator: CameraManipulator }>()

  useEffect(() => {
    let active = true
    const starting = Filament.createEngine({}).then((engine) => {
      if (active) setOrbit({ engine, manipulator: engine.createOrbitManipulator({ homePosition: [0, 0.6, 3.6] }) })
      return engine
    })
    return () => {
      active = false
      starting.then((engine) => engine.shutdown())
    }
  }, [])

  if (orbit == null) return null
  return <OrbitView engine={orbit.engine} manipulator={orbit.manipulator} />
}

const styles = StyleSheet.create({
  container: { flex: 1 },
})

import React, { useEffect, useState } from 'react'
import { Button, Image, StyleSheet, Text, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { callback } from 'react-native-nitro-modules'
import { scheduleOnRN } from 'react-native-worklets'
import {
  defaultIndirectLightSource,
  Filament,
  NativeFilamentView,
  runOnRenderThread,
  type FilamentView,
  type Model,
  type ViewTarget,
} from 'react-native-filament'

const rocket = Image.resolveAssetSource(require('../assets/rocket.glb'))

interface Loaded {
  target: ViewTarget
  model: Model
}

export function PickingExample() {
  const [view, setView] = useState<FilamentView>()
  const [loaded, setLoaded] = useState<Loaded>()
  const [message, setMessage] = useState('Tap a part of the rocket')

  useEffect(() => {
    if (view == null) return
    let active = true
    const starting = Filament.createEngine({}).then(async (engine) => {
      const [target, model, environment] = await Promise.all([
        engine.createViewTarget(view, {}),
        engine.loadModel({ uri: rocket.uri }, {}),
        engine.loadIndirectLight(defaultIndirectLightSource, {}),
      ])
      const camera = await runOnRenderThread(engine, () => {
        'worklet'
        const scene = engine.createScene()
        scene.setIndirectLight(environment)
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
      if (active) setLoaded({ target, model })
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

  const describePick = async (x: number, y: number) => {
    if (loaded == null) return
    const hit = await loaded.target.pick(x, y)
    if (hit == null) {
      setMessage('Nothing there')
      return
    }
    const [px, py, pz] = hit.worldPosition.map((value) => value.toFixed(2))
    setMessage(`Entity ${hit.entity} at (${px}, ${py}, ${pz})`)
  }

  const tap = Gesture.Tap().onEnd(({ x, y }) => {
    'worklet'
    scheduleOnRN(describePick, x, y)
  })

  const snapshot = async () => {
    if (loaded == null) return
    const frame = await loaded.target.takeSnapshot()
    setMessage(`Saved ${frame.width}×${frame.height} to ${await frame.saveToTemporaryFile()}`)
  }

  return (
    <View style={styles.container}>
      <GestureDetector gesture={tap}>
        <View style={styles.container}>
          <NativeFilamentView style={styles.container} hybridRef={callback(setView)} />
        </View>
      </GestureDetector>
      <Text style={styles.message}>{message}</Text>
      <Button title="Take snapshot" disabled={loaded == null} onPress={snapshot} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  message: { padding: 12, fontSize: 15 },
})

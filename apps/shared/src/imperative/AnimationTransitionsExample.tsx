import React, { useEffect, useState } from 'react'
import { Alert, Button, Image, Pressable, ScrollView, StyleSheet, View, type GestureResponderEvent } from 'react-native'
import { callback } from 'react-native-nitro-modules'
import {
  defaultIndirectLightSource,
  Filament,
  NativeFilamentView,
  runOnRenderThread,
  type AnimationInfo,
  type AnimationPlayer,
  type FilamentView,
  type ViewTarget,
} from 'react-native-filament'

const dancer = Image.resolveAssetSource(require('../../assets/hiphopgirl.glb'))
const CROSS_FADE_SECONDS = 5

interface Loaded {
  target: ViewTarget
  player: AnimationPlayer
  animations: AnimationInfo[]
}

function DancerScene() {
  const [view, setView] = useState<FilamentView>()
  const [loaded, setLoaded] = useState<Loaded>()

  useEffect(() => {
    if (view == null) return
    let active = true
    const starting = Filament.createEngine({}).then(async (engine) => {
      const [target, model, environment] = await Promise.all([
        engine.createViewTarget(view, {}),
        engine.loadModel({ uri: dancer.uri }, {}),
        engine.loadIndirectLight(defaultIndirectLightSource, {}),
      ])
      const camera = await runOnRenderThread(engine, () => {
        'worklet'
        const scene = engine.createScene()
        scene.setIndirectLight(environment)
        scene.addEntity(engine.createDirectionalLight({ direction: [0.3, -1, -0.5] }).entity)
        scene.addModel(model)
        const lens = engine.createCamera()
        lens.lookAt([0, 1, 4], [0, 1, 0], [0, 1, 0])
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
      const animator = model.getInstance(0).animator
      const player = animator.createPlayer()
      player.play(1, {})
      if (active) setLoaded({ target, player, animations: animator.animations })
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

  const pick = async (event: GestureResponderEvent) => {
    const hit = await loaded?.target.pick(event.nativeEvent.locationX, event.nativeEvent.locationY)
    if (hit != null) Alert.alert(`Model pressed by entity with ID ${hit.entity}`)
  }

  return (
    <View style={styles.container}>
      <Pressable style={styles.container} onPress={pick}>
        <NativeFilamentView style={styles.container} hybridRef={callback(setView)} />
      </Pressable>
      <ScrollView style={styles.buttons}>
        {loaded?.animations.map((animation, index) => (
          <Button
            key={animation.name}
            title={animation.name}
            onPress={() => loaded.player.play(index, { crossFadeSeconds: CROSS_FADE_SECONDS })}
          />
        ))}
      </ScrollView>
    </View>
  )
}

export function AnimationTransitionsExample() {
  const [generation, setGeneration] = useState(0)
  return (
    <View style={styles.container}>
      <DancerScene key={generation} />
      <Button title="Rerender" onPress={() => setGeneration((value) => value + 1)} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  buttons: { position: 'absolute', bottom: 0, maxHeight: 120, width: '100%' },
})

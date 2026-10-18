import React, { useEffect, useState } from 'react'
import { StyleSheet } from 'react-native'
import { callback } from 'react-native-nitro-modules'
import { Filament, NativeFilamentView, runOnRenderThread, type FilamentView } from 'react-native-filament'

export function SceneExample() {
  const [view, setView] = useState<FilamentView>()

  useEffect(() => {
    if (view == null) return
    const starting = Filament.createEngine({}).then(async (engine) => {
      const target = await engine.createViewTarget(view, {})
      await runOnRenderThread(engine, () => {
        'worklet'
        const scene = engine.createScene()
        scene.setSkybox(engine.createSkybox([0.9, 0.35, 0.05, 1]))
        const camera = engine.createCamera()
        camera.setProjection(45, target.width / target.height, 0.1, 100)
        camera.lookAt([0, 0, 4], [0, 0, 0], [0, 1, 0])
        target.setScene(scene)
        target.setCamera(camera)
      })
      return engine
    })
    return () => {
      starting.then((engine) => engine.shutdown())
    }
  }, [view])

  return <NativeFilamentView style={styles.container} hybridRef={callback(setView)} />
}

const styles = StyleSheet.create({
  container: { flex: 1 },
})

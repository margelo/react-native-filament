import React, { useEffect, useState } from 'react'
import { Image, StyleSheet } from 'react-native'
import { callback } from 'react-native-nitro-modules'
import { defaultIndirectLightSource, Filament, NativeFilamentView, runOnRenderThread, type FilamentView } from 'react-native-filament'

const avatar = Image.resolveAssetSource(require('../../assets/morphtargets.glb'))

export function MorphTargetsExample() {
  const [view, setView] = useState<FilamentView>()

  useEffect(() => {
    if (view == null) return
    const starting = Filament.createEngine({}).then(async (engine) => {
      const [target, model, environment] = await Promise.all([
        engine.createViewTarget(view, {}),
        engine.loadModel({ uri: avatar.uri }, {}),
        engine.loadIndirectLight(defaultIndirectLightSource, {}),
      ])
      const camera = await runOnRenderThread(engine, () => {
        'worklet'
        const scene = engine.createScene()
        scene.setIndirectLight(environment)
        scene.addModel(model)
        const rm = engine.renderableManager
        const faces = model.entities
          .filter((entity) => {
            try {
              return rm.getMorphTargetCount(entity) > 0
            } catch {
              return false
            }
          })
          .map((entity) => {
            const names = model.getMorphTargetNames(entity)
            return { entity, mouthOpen: names.indexOf('mouthOpen'), mouthSmile: names.indexOf('mouthSmile') }
          })
        engine.addOnFrameListener((frame) => {
          const open = 0.5 + 0.5 * Math.sin(frame.elapsedSeconds * 3)
          for (const face of faces) {
            rm.setMorphWeights(face.entity, [open], face.mouthOpen)
            rm.setMorphWeights(face.entity, [1 - open], face.mouthSmile)
          }
          return true
        })
        const lens = engine.createCamera()
        lens.lookAt([0, 1.65, 0.6], [0, 1.6, 0], [0, 1, 0])
        target.setScene(scene)
        target.setCamera(lens)
        return lens
      })
      const resize = target.addOnResizeListener((width, height) => {
        runOnRenderThread(engine, () => {
          'worklet'
          camera.setLensProjection(35, width / height, 0.05, 20)
        })
      })
      return { engine, resize }
    })
    return () => {
      starting.then(({ engine, resize }) => {
        resize.remove()
        engine.shutdown()
      })
    }
  }, [view])

  return <NativeFilamentView style={styles.container} hybridRef={callback(setView)} />
}

const styles = StyleSheet.create({
  container: { flex: 1 },
})

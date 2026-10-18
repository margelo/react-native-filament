import React, { useEffect, useState } from 'react'
import { Button, StyleSheet, Text, View } from 'react-native'
import ReactNativeBlobUtil from 'react-native-blob-util'
import { callback } from 'react-native-nitro-modules'
import { defaultIndirectLightSource, Filament, NativeFilamentView, runOnRenderThread, type FilamentView } from 'react-native-filament'

const HELMET_URL = 'https://raw.githubusercontent.com/google/filament/main/third_party/models/DamagedHelmet/DamagedHelmet.glb'

function FileModel({ fileUri }: { fileUri: string }) {
  const [view, setView] = useState<FilamentView>()

  useEffect(() => {
    if (view == null) return
    const starting = Filament.createEngine({}).then(async (engine) => {
      const [target, model, environment] = await Promise.all([
        engine.createViewTarget(view, {}),
        engine.loadModel({ uri: fileUri }, {}),
        engine.loadIndirectLight(defaultIndirectLightSource, {}),
      ])
      const camera = await runOnRenderThread(engine, () => {
        'worklet'
        const scene = engine.createScene()
        scene.setIndirectLight(environment)
        scene.addEntity(engine.createDirectionalLight({ direction: [0.3, -1, -0.6] }).entity)
        scene.addModel(model)
        engine.transformManager.transformToUnitCube(model.rootEntity, model.boundingBox)
        const lens = engine.createCamera()
        lens.lookAt([0, 0, 7], [0, 0, 0], [0, 1, 0])
        target.setScene(scene)
        target.setCamera(lens)
        return lens
      })
      const resize = target.addOnResizeListener((width, height) => {
        runOnRenderThread(engine, () => {
          'worklet'
          camera.setLensProjection(35, width / height, 0.1, 100)
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
  }, [fileUri, view])

  return <NativeFilamentView style={styles.container} hybridRef={callback(setView)} />
}

export function LoadFromFileExample() {
  const [fileUri, setFileUri] = useState<string>()
  const [status, setStatus] = useState('Downloads the glTF file first, then loads it from disk.')

  const download = async () => {
    setStatus('Downloading…')
    try {
      const response = await ReactNativeBlobUtil.config({ fileCache: true, appendExt: 'glb' }).fetch('GET', HELMET_URL)
      setFileUri(`file://${response.path()}`)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error))
    }
  }

  if (fileUri != null) return <FileModel fileUri={fileUri} />
  return (
    <View style={[styles.container, styles.centered]}>
      <Text style={styles.status}>{status}</Text>
      <Button title="Load asset" onPress={download} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  status: { marginBottom: 12, paddingHorizontal: 24, textAlign: 'center' },
})

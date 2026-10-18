import React, { useEffect, useState } from 'react'
import { Button, Image, StyleSheet, Text, View } from 'react-native'
import Video from 'react-native-video'
import {
  defaultIndirectLightSource,
  Filament,
  runOnRenderThread,
  type AnimationPlayer,
  type Engine,
  type Recorder,
} from 'react-native-filament'

const drone = Image.resolveAssetSource(require('../assets/buster_drone.glb'))

const FPS = 60
const SECONDS = 5

type Phase =
  | { name: 'preparing' }
  | { name: 'ready' }
  | { name: 'recording' }
  | { name: 'recorded'; uri: string; renderSeconds: number }
  | { name: 'failed'; message: string }

interface RecordingScene {
  recorder: Recorder
  player: AnimationPlayer
}

async function createRecordingScene(engine: Engine): Promise<RecordingScene> {
  const [model, environment] = await Promise.all([
    engine.loadModel({ uri: drone.uri }, {}),
    engine.loadIndirectLight(defaultIndirectLightSource, {}),
  ])
  const { center, halfExtent } = model.boundingBox
  const radius = Math.hypot(...halfExtent)
  const recorder = await runOnRenderThread(engine, () => {
    'worklet'
    const created = engine.createRecorder({ width: 720, height: 1280, fps: FPS })
    const scene = engine.createScene()
    scene.setIndirectLight(environment)
    scene.setSkybox(engine.createSkybox([0.25, 0.55, 0.85, 1]))
    scene.addEntity(engine.createDirectionalLight({ direction: [0.3, -1, -0.6] }).entity)
    scene.addModel(model)
    const camera = engine.createCamera()
    camera.lookAt([center[0], center[1] + radius * 0.4, center[2] + radius * 3.2], center, [0, 1, 0])
    camera.setLensProjection(28, created.width / created.height, radius * 0.05, radius * 10)
    created.setScene(scene)
    created.setCamera(camera)
    return created
  })
  const player = model.getInstance(0).animator.createPlayer()
  player.play(0, {})
  return { recorder, player }
}

export function RecordingExample() {
  const [phase, setPhase] = useState<Phase>({ name: 'preparing' })
  const [scene, setScene] = useState<RecordingScene>()

  useEffect(() => {
    let active = true
    const starting = Filament.createEngine({}).then(async (engine) => {
      const created = await createRecordingScene(engine)
      if (active) {
        setScene(created)
        setPhase({ name: 'ready' })
      }
      return engine
    })
    return () => {
      active = false
      starting.then((engine) => engine.shutdown())
    }
  }, [])

  const record = async () => {
    if (scene == null) return
    setPhase({ name: 'recording' })
    const started = Date.now()
    try {
      const uri = await scene.recorder.record(FPS * SECONDS)
      setPhase({ name: 'recorded', uri, renderSeconds: (Date.now() - started) / 1000 })
    } catch (error) {
      setPhase({ name: 'failed', message: error instanceof Error ? error.message : String(error) })
    }
  }

  return (
    <View style={styles.container}>
      {phase.name === 'recorded' ? (
        <Video style={styles.video} source={{ uri: phase.uri }} repeat controls resizeMode="contain" />
      ) : (
        <View style={[styles.video, styles.placeholder]}>
          <Text style={styles.status}>{describe(phase)}</Text>
        </View>
      )}
      {phase.name === 'recorded' && (
        <Text style={styles.stats}>
          {FPS * SECONDS} frames at 720 × 1280 encoded in {phase.renderSeconds.toFixed(2)} s (
          {((FPS * SECONDS) / phase.renderSeconds).toFixed(0)} fps)
        </Text>
      )}
      <Button title={`Record ${SECONDS} s at ${FPS} fps`} disabled={phase.name === 'preparing' || phase.name === 'recording'} onPress={record} />
    </View>
  )
}

function describe(phase: Phase): string {
  switch (phase.name) {
    case 'preparing':
      return 'Loading the scene…'
    case 'ready':
      return 'Ready to record offscreen.'
    case 'recording':
      return 'Recording…'
    case 'failed':
      return phase.message
    case 'recorded':
      return ''
  }
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  video: { flex: 1, backgroundColor: 'black' },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  status: { color: 'white', fontSize: 16 },
  stats: { padding: 8, textAlign: 'center' },
})

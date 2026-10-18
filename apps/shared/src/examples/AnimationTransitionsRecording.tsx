import React, { useState } from 'react'
import { Button, StyleSheet, Text, View } from 'react-native'
import Video from 'react-native-video'
import { Animator, Camera, DefaultLight, FilamentScene, Model, useRecorder, useSkybox, type Recorder } from 'react-native-filament'

const drone = require('../../assets/buster_drone.glb')
const FPS = 60
const DURATION = 5
const WIDTH = 720
const HEIGHT = 1280

function RecordButton({ recorder, onRecorded }: { recorder: Recorder; onRecorded: (uri: string) => void }) {
  const [recording, setRecording] = useState(false)
  const record = async () => {
    setRecording(true)
    try {
      onRecorded(await recorder.record(FPS * DURATION))
    } finally {
      setRecording(false)
    }
  }
  return <Button title={recording ? 'Recording…' : 'Start recording'} disabled={recording} onPress={record} />
}

function Renderer() {
  const [videoUri, setVideoUri] = useState<string>()
  const recorder = useRecorder({ width: WIDTH, height: HEIGHT, fps: FPS, bitRate: 2_000_000 })
  useSkybox({ colorInHex: '#88defb' })

  return (
    <View style={styles.container}>
      <Camera aspect={WIDTH / HEIGHT} far={1000} />
      <DefaultLight />
      <Model source={drone} transformToUnitCube>
        <Animator />
      </Model>
      {videoUri == null ? (
        <View style={[styles.container, styles.placeholder]}>
          <Text>Records {DURATION} s of the drone offscreen at {FPS} fps.</Text>
        </View>
      ) : (
        <Video style={styles.container} source={{ uri: videoUri }} repeat controls resizeMode="contain" />
      )}
      {recorder != null && <RecordButton recorder={recorder} onRecorded={setVideoUri} />}
    </View>
  )
}

export function AnimationTransitionsRecording() {
  return (
    <FilamentScene>
      <Renderer />
    </FilamentScene>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
})

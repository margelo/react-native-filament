import * as React from 'react'
import { useCallback } from 'react'
import { Button, StyleSheet, View } from 'react-native'
import {
  Float3,
  useModel,
  useAssetAnimator,
  getAssetFromModel,
  FilamentProvider,
  useFilamentContext,
  useResource,
  useSkybox,
  RenderCallback,
  useRecorder,
  useWorkletCallback,
} from 'react-native-filament'
import { useDefaultLight } from './hooks/useDefaultLight'
import { getAssetPath } from './utils/getAssetPasth'
import { useSharedValue } from 'react-native-worklets-core'
import Video from 'react-native-video'

const penguModelPath = getAssetPath('pengu.glb')
const pirateHatPath = getAssetPath('pirate.glb')

// Camera config:
const cameraPosition: Float3 = [0, 0, 8]
const cameraTarget: Float3 = [0, 0, 0]
const cameraUp: Float3 = [0, 1, 0]
const focalLengthInMillimeters = 28
const near = 0.1
const far = 1000

const FPS = 30
const DURATION = 1 // seconds

function Renderer() {
  const { camera, view } = useFilamentContext()
  useDefaultLight()
  useSkybox({ color: '#88defb' })

  const pengu = useModel({ path: penguModelPath })
  const penguAsset = getAssetFromModel(pengu)
  const pirateHat = useModel({ path: pirateHatPath })
  const pirateHatAsset = getAssetFromModel(pirateHat)
  const pirateHatAnimator = useResource(() => {
    if (pirateHatAsset == null || penguAsset == null) {
      return undefined
    }
    return Promise.resolve(pirateHatAsset.createAnimatorWithAnimationsFrom(penguAsset))
  }, [pirateHatAsset, penguAsset])

  const penguAnimator = useAssetAnimator(penguAsset)

  const prevAspectRatio = useSharedValue(0)
  const renderCallback: RenderCallback = useCallback(
    ({ passedSeconds }) => {
      'worklet'

      const aspectRatio = view.getAspectRatio()
      if (prevAspectRatio.value !== aspectRatio) {
        prevAspectRatio.value = aspectRatio
        // Setup camera lens:
        camera.setLensProjection(focalLengthInMillimeters, aspectRatio, near, far)
        console.log('Setting up camera lens with aspect ratio:', aspectRatio)
      }

      camera.lookAt(cameraPosition, cameraTarget, cameraUp)

      if (pirateHatAnimator == null || penguAnimator == null) {
        return
      }

      // Update the animators to play the current animation
      penguAnimator.applyAnimation(0, passedSeconds)
      pirateHatAnimator.applyAnimation(0, passedSeconds)

      penguAnimator.updateBoneMatrices()
      pirateHatAnimator.updateBoneMatrices()
    },
    [view, prevAspectRatio, camera, pirateHatAnimator, penguAnimator]
  )

  const [videoUri, setVideoUri] = React.useState<string>()
  const recorder = useRecorder({
    bitRate: 2_000_000,
    fps: FPS,
    height: 720,
    width: 480,
  })
  const { engine } = useFilamentContext()
  const startRecording = useWorkletCallback(() => {
    'worklet'

    console.log('Starting rendering')
    const framesToRender = DURATION * FPS
    const started = Date.now()
    for (let i = 0; i < framesToRender; i++) {
      const nextTimestamp = started + i * (1 / FPS)
      console.log(`Rendering frame #${i + 1} of ${framesToRender} at ${nextTimestamp}`)
      renderCallback({ passedSeconds: nextTimestamp, startTime: started })
      try {
        engine.render(started + i * (1 / FPS))
      } catch (e) {
        // ignored
        console.log(`Error rendering frame: ${i + 1}`, e.toString())
      }
    }
  }, [engine, recorder, renderCallback])

  return (
    <View style={styles.container}>
      {videoUri != null ? (
        <Video style={{ flex: 1 }} source={{ uri: videoUri }} onError={() => console.error(e)} onLoad={() => console.log('On load')} />
      ) : null}
      <Button
        onPress={async () => {
          console.log('Starting recording...')
          await recorder.startRecording()
          await startRecording()
          // TODO: issue, we can't call stop when we don't know here if all frames have been processed yet
          console.log('Stopping recording')
          const uri = await recorder.stopRecording()
          console.log('Recording stopped.')
          console.log('Video URI:', uri)
          setVideoUri(uri)
        }}
        title={'Start recording'}
      />
    </View>
  )
}

export function AnimationTransitionsRecording() {
  return (
    <FilamentProvider>
      <Renderer />
    </FilamentProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filamentView: {
    flex: 1,
  },
  btnContainer: {
    height: 200,
    width: '100%',
    position: 'absolute',
    bottom: 0,
  },
})

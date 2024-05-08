import * as React from 'react'
import { useCallback } from 'react'
import { Button, Dimensions, PixelRatio, StyleSheet, View } from 'react-native'
import {
  Float3,
  useModel,
  useAssetAnimator,
  getAssetFromModel,
  FilamentProvider,
  useFilamentContext,
  useDisposableResource,
  useSkybox,
  RenderCallback,
  useRecorder,
  useWorkletCallback,
  Filament,
} from 'react-native-filament'
import { useDefaultLight } from './hooks/useDefaultLight'
import { getAssetPath } from './utils/getAssetPasth'
import { useRunOnJS, useSharedValue } from 'react-native-worklets-core'
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

const FPS = 60
const DURATION = 3 // seconds

function Renderer() {
  const { camera, view } = useFilamentContext()
  useDefaultLight()
  useSkybox({ color: '#88defb' })

  const pengu = useModel({ path: penguModelPath })
  const penguAsset = getAssetFromModel(pengu)
  const pirateHat = useModel({ path: pirateHatPath })
  const pirateHatAsset = getAssetFromModel(pirateHat)
  const pirateHatAnimator = useDisposableResource(() => {
    if (pirateHatAsset == null || penguAsset == null) {
      return undefined
    }
    return Promise.resolve(pirateHatAsset.createAnimatorWithAnimationsFrom(penguAsset))
  }, [pirateHatAsset, penguAsset])

  const penguAnimator = useAssetAnimator(penguAsset)

  const prevAspectRatio = useSharedValue(0)
  const renderCallback = useCallback(
    (passedSeconds: number) => {
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
    height: PixelRatio.getPixelSizeForLayoutSize(Dimensions.get('screen').height),
    width: PixelRatio.getPixelSizeForLayoutSize(Dimensions.get('screen').width),
  })
  const { engine } = useFilamentContext()

  const onFinish = useRunOnJS(async () => {
    console.log('Stopping recording')
    const uri = await recorder.stopRecording()
    console.log('Recording stopped.')
    console.log('Video URI:', uri)
    setVideoUri(uri)
  }, [recorder])

  const beginRendering = useWorkletCallback(() => {
    'worklet'

    console.log('Starting rendering')
    const framesToRender = DURATION * FPS
    const started = Date.now()
    let frameIndex = 0
    let isStopping = false

    const start = performance.now()

    const listener = recorder.addOnReadyForMoreDataListener(() => {
      if (frameIndex > framesToRender) {
        if (!isStopping) {
          isStopping = true
          const end = performance.now()
          console.log(`Rendering ${framesToRender} frames took ${(end - start).toFixed(0)}ms!`)
          onFinish()
          listener.remove()
        }
        return
      }

      const nextTimestamp = started + frameIndex * (1 / FPS)
      console.log(`Rendering frame #${frameIndex + 1} of ${framesToRender} at ${nextTimestamp}`)
      const passedSeconds = nextTimestamp - started
      // Update the scene:
      renderCallback(passedSeconds)
      // Create the commands for the GPU:
      engine.render(nextTimestamp, false)
      // Wait for the GPU render to complete:
      engine.flushAndWait()
      // Render the current frame to the recorder:
      recorder.renderFrame(nextTimestamp)

      frameIndex++
    })
  }, [engine, recorder, renderCallback])

  const onStartRecording = useCallback(async () => {
    console.log('Starting recorder')
    await recorder.startRecording()

    beginRendering()
  }, [recorder, beginRendering])

  return (
    <View style={styles.container}>
      {/* <Filament style={styles.filamentView} renderCallback={renderCallback} /> */}
      {videoUri != null ? (
        <Video
          style={{ flex: 1 }}
          paused={false}
          repeat={true}
          controls={true}
          source={{ uri: videoUri }}
          onError={(e) => console.error(e)}
          onLoad={() => console.log('On load')}
          onEnd={() => console.log('On end')}
        />
      ) : null}
      <Button onPress={onStartRecording} title={'Start recording'} />
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

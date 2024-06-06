import * as React from 'react'
import { useCallback, useMemo } from 'react'
import { Button, Dimensions, PixelRatio, StyleSheet, View } from 'react-native'
import {
  Float3,
  useModel,
  useAnimator,
  getAssetFromModel,
  useFilamentContext,
  useSkybox,
  useRecorder,
  useRecorderRenderLoop,
  Camera,
  FilamentAPIContextProvider,
  BackgroundImage,
} from 'react-native-filament'
import { useRunOnJS, useSharedValue } from 'react-native-worklets-core'
import PenguGlb from '~/assets/pengu.glb'
import PirateGlb from '~/assets/pirate.glb'
import { DefaultLight } from './components/DefaultLight'
import Video from 'react-native-video'

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
  const { camera } = useFilamentContext()
  useSkybox({ color: '#88defb' })

  const pengu = useModel(PenguGlb)
  const penguAnimator = useAnimator(pengu)
  const pirateHat = useModel(PirateGlb)
  const pirateHatAsset = getAssetFromModel(pirateHat)
  const pirateHatInstance = useMemo(() => pirateHatAsset?.getInstance(), [pirateHatAsset])

  // Sync pirate hat animation with pengu
  React.useEffect(() => {
    if (penguAnimator == null || pirateHatInstance == null) return
    const id = penguAnimator.addToSyncList(pirateHatInstance)
    return () => {
      penguAnimator.removeFromSyncList(id)
    }
  }, [penguAnimator, pirateHatInstance])

  const renderCallback = useCallback(
    (passedSeconds: number) => {
      'worklet'
      camera.lookAt(cameraPosition, cameraTarget, cameraUp)

      if (penguAnimator == null) {
        return
      }

      // Update the animators to play the current animation
      penguAnimator.applyAnimation(0, passedSeconds)
      penguAnimator.updateBoneMatrices()
    },
    [camera, penguAnimator]
  )

  const framesToRender = DURATION * FPS
  // const started = Date.now()
  const started = useSharedValue(0)

  const [videoUri, setVideoUri] = React.useState<string>()

  const { engine, renderer, view } = useFilamentContext()
  const { recorder, swapChain } = useRecorder({
    bitRate: 2_000_000,
    fps: FPS,
    height: PixelRatio.getPixelSizeForLayoutSize(Dimensions.get('screen').height),
    width: PixelRatio.getPixelSizeForLayoutSize(Dimensions.get('screen').width),
  })

  const isStopping = React.useRef(false)
  const onFinish = useRunOnJS(async () => {
    if (isStopping.current) {
      return
    }
    isStopping.current = true
    console.log('Stopping recording')
    const uri = await recorder.stopRecording()
    console.log('Recording stopped.')
    console.log('Video URI:', uri)
    setVideoUri(uri)
  }, [recorder])

  useRecorderRenderLoop(recorder, ({ frameIndex }) => {
    'worklet'
    if (swapChain == null) {
      console.warn('SwapChain is null, cannot render frame. Only call startRecording after the swapChain is set.')
      return false
    }

    if (frameIndex > framesToRender) {
      // stop rendering
      onFinish()
      return false
    }
    if (started.value === 0) {
      started.value = performance.now()
    }

    const nextTimestamp = started.value + frameIndex * (1 / FPS)
    console.log(`Rendering frame #${frameIndex + 1} of ${framesToRender} at ${nextTimestamp}`)
    const passedSeconds = nextTimestamp - started.value
    // Update the scene:
    renderCallback(passedSeconds)
    // Create the commands for the GPU:
    renderer.beginFrame(swapChain, 0)
    renderer.setPresentationTime(nextTimestamp * 1000)
    renderer.render(view)
    renderer.endFrame()

    // Wait for the GPU render to complete:
    engine.flushAndWait()
    // Render the current frame to the recorder:
    recorder.renderFrame(nextTimestamp)
    return true
  })

  const onStartRecording = useCallback(async () => {
    console.log('Starting recorder')
    isStopping.current = false
    await recorder.startRecording()
  }, [recorder])

  // Configure camera
  React.useEffect(() => {
    const aspectRatio = recorder.width / recorder.height
    camera.setLensProjection(focalLengthInMillimeters, aspectRatio, near, far)
    console.log('Camera configured')
  }, [camera, recorder.height, recorder.width])

  return (
    <View style={styles.container}>
      {videoUri == null ? (
        // Render our scene that we want to record
        <>
          <Camera />
          <DefaultLight />
        </>
      ) : (
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
      )}
      <Button onPress={onStartRecording} title={'Start recording'} />
    </View>
  )
}

export function AnimationTransitionsRecording() {
  return (
    // Provide the API necessary for recording (accessing the RNF apis) in a react context
    <FilamentAPIContextProvider>
      <Renderer />
    </FilamentAPIContextProvider>
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

import * as React from 'react'
import { useCallback } from 'react'
import { Button, StyleSheet, View } from 'react-native'
import {
  Filament,
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

const penguModelPath = getAssetPath('pengu.glb')
const pirateHatPath = getAssetPath('pirate.glb')

// Camera config:
const cameraPosition: Float3 = [0, 0, 8]
const cameraTarget: Float3 = [0, 0, 0]
const cameraUp: Float3 = [0, 1, 0]
const focalLengthInMillimeters = 28
const near = 0.1
const far = 1000

const FPS = 29
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

  const recorder = useRecorder({
    bitRate: 10_000_000,
    fps: FPS,
    height: 1080,
    width: 1920,
  })
  const { engine } = useFilamentContext()
  const startRecording = useWorkletCallback(() => {
    'worklet'

    console.log('Starting recording...')
    recorder.startRecording()
    const framesToRender = DURATION * FPS
    for (let i = 0; i < framesToRender; i++) {
      console.log(`Rendering frame #${i + 1} of ${framesToRender}`)
      engine.render(Date.now())
    }
    console.log('Stopping recording')
    recorder.stopRecording()
    console.log('Recording stopped.')
  }, [engine, recorder])

  return (
    <View style={styles.container}>
      <Button
        onPress={() => {
          startRecording()
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

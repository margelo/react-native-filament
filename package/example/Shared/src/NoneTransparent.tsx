import * as React from 'react'
import { StyleSheet } from 'react-native'
import { useModel, FilamentContext, FilamentView, Camera, Skybox, Model, Animator } from 'react-native-filament'
import DroneGlb from '~/assets/buster_drone.glb'
import { DefaultLight } from './components/DefaultLight'

function Renderer() {
  const model = useModel(DroneGlb)
  // const modelAnimator = useAnimator(model)

  // const renderCallback: RenderCallback = useCallback(
  //   ({ passedSeconds }) => {
  //     'worklet'

  //     if (modelAnimator == null) {
  //       return
  //     }

  //     // Update the animators to play the current animation
  //     modelAnimator.applyAnimation(0, passedSeconds)
  //     modelAnimator.updateBoneMatrices()
  //   },
  //   [modelAnimator]
  // )

  return (
    <FilamentView style={styles.filamentView} enableTransparentRendering={false}>
      <Camera />
      <DefaultLight />
      <Skybox colorInHex="#88defb" />

      <Model source={DroneGlb}>
        <Animator />
      </Model>
    </FilamentView>
  )
}

export function NoneTransparent() {
  return (
    <FilamentContext>
      <Renderer />
    </FilamentContext>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filamentView: {
    flex: 1,
  },
})

import * as React from 'react'
import { StyleSheet } from 'react-native'
import {
  FilamentScene,
  FilamentView,
  Camera,
  Skybox,
  DefaultLight,
  RenderCallback,
  useModel,
  ModelRenderer,
  useFilamentContext,
} from 'react-native-filament'
import DroneGlb from '~/assets/buster_drone.glb'
import { useCallback } from 'react'

function Renderer() {
  const model = useModel(DroneGlb)
  const rootEntity = model.state === 'loaded' ? model.rootEntity : undefined

  const { transformManager } = useFilamentContext()
  const renderCallback: RenderCallback = useCallback(() => {
    'worklet'

    if (rootEntity == null) {
      return
    }

    transformManager.setEntityRotation(
      rootEntity,
      0.01,
      [0, 1, 0],
      true // multiply with current transform, as this is called every frame we advance the rotation
    )
  }, [rootEntity, transformManager])

  return (
    <FilamentView style={styles.filamentView} enableTransparentRendering={false} renderCallback={renderCallback}>
      <Camera />
      <DefaultLight />
      <Skybox colorInHex="#88defb" />

      <ModelRenderer model={model} transformToUnitCube scale={[3, 3, 3]} />
    </FilamentView>
  )
}

export function AnimatedRotate() {
  return (
    <FilamentScene>
      <Renderer />
    </FilamentScene>
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

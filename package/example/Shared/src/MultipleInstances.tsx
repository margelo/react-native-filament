import React, { useCallback, useMemo } from 'react'
import { StyleSheet } from 'react-native'
import {
  Camera,
  DefaultLight,
  FilamentContext,
  FilamentView,
  getAssetFromModel,
  RenderCallback,
  useFilamentContext,
  useModel,
  useWorkletEffect,
} from 'react-native-filament'
// import HipHopGirlGlb from '~/assets/hiphopgirl.glb'
import DroneGlb from '~/assets/buster_drone.glb'

function Renderer() {
  const { scene, transformManager, nameComponentManager } = useFilamentContext()

  const model = useModel(DroneGlb, { instanceCount: 4, addToScene: false })
  const asset = getAssetFromModel(model)
  useWorkletEffect(() => {
    'worklet'
    if (asset == null) return

    // This will apply to all instances
    transformManager.transformToUnitCube(asset)

    // Add all instances to the scene
    const instances = asset.getAssetInstances()
    for (let i = 0; i < instances.length; i++) {
      const instance = instances[i]!
      const root = instance.getRoot()

      // Calculate positions for a 2x2 grid
      // Assuming each instance occupies a 1x1 area, adjust the multiplier for larger sizes
      const spacingMultiplier = 4
      const x = (i % 2) * spacingMultiplier - spacingMultiplier / 2
      const y = Math.floor(i / 2) * spacingMultiplier - spacingMultiplier / 2
      const z = 0 // Keep z the same if you're not using it for depth positioning

      // Move the instance
      transformManager.setEntityPosition(root!, [x, y, z], false)

      const entities = instance.getEntities()
      scene.addEntities(entities)
    }
  })

  const allAnimators = useMemo(() => {
    if (asset == null) return undefined

    const instances = asset.getAssetInstances()
    return instances.map((instance) => instance.createAnimator(nameComponentManager))
  }, [asset, nameComponentManager])

  const renderCallback: RenderCallback = useCallback(
    ({ passedSeconds }) => {
      'worklet'

      // Animate all instances
      allAnimators?.forEach((animator) => {
        animator?.applyAnimation(0, passedSeconds)
        animator?.updateBoneMatrices()
      })
    },
    [allAnimators]
  )

  return (
    <FilamentView style={styles.filamentView} renderCallback={renderCallback}>
      <Camera />
      <DefaultLight />
    </FilamentView>
  )
}

export function MultipleInstances() {
  return (
    <FilamentContext>
      <Renderer />
    </FilamentContext>
  )
}

const styles = StyleSheet.create({
  filamentView: {
    flex: 1,
    backgroundColor: 'lightblue',
  },
})

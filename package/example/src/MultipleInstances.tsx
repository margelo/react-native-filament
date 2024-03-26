import React, { useEffect, useMemo, useRef } from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import { Filament, useAsset, useEngine, useModel, useRenderCallback } from 'react-native-filament'

const penguModelPath = Platform.select({
  android: 'custom/pengu.glb',
  ios: 'pengu.glb',
})!

const indirectLightPath = Platform.select({
  android: 'custom/default_env_ibl.ktx',
  ios: 'default_env_ibl.ktx',
})!

// Camera config:
const cameraPosition: Float3 = [0, 1, 10]
const cameraTarget: Float3 = [0, 0, 0]
const cameraUp: Float3 = [0, 1, 0]
const focalLengthInMillimeters = 28
const near = 0.1
const far = 1000

export function MultipleInstances() {
  const engine = useEngine()

  //#region Setup lights
  const light = useAsset({ path: indirectLightPath })
  useEffect(() => {
    if (light == null) return
    // create a default light
    engine.setIndirectLight(light)

    // Create a directional light for supporting shadows
    const directionalLight = engine.createLightEntity('directional', 6500, 10000, 0, -1, 0, true)
    engine.getScene().addEntity(directionalLight)
    return () => {
      // TODO: Remove directionalLight from scene
    }
  }, [engine, light])
  //#endregion

  const pengu = useModel({ engine: engine, path: penguModelPath, instanceCount: 4 })
  const penguAsset = pengu.state === 'loaded' ? pengu.asset : undefined
  useEffect(() => {
    if (penguAsset == null) return

    // This will apply to all instances
    engine.transformToUnitCube(penguAsset)

    // Add all instances to the scene
    const instances = penguAsset.getAssetInstances()
    for (let i = 0; i < instances.length; i++) {
      const instance = instances[i]
      const root = instance?.getRoot()

      // Calculate positions for a 2x2 grid
      // Assuming each instance occupies a 1x1 area, adjust the multiplier for larger sizes
      const spacingMultiplier = 4
      const x = (i % 2) * spacingMultiplier - spacingMultiplier / 2
      const y = Math.floor(i / 2) * spacingMultiplier - spacingMultiplier / 2
      const z = 0 // Keep z the same if you're not using it for depth positioning

      // Move the instance
      engine.setEntityPosition(root!, [x, y, z], true)

      engine.getScene().addEntity(root!)
    }
  }, [engine, penguAsset])

  const allAnimators = useMemo(() => {
    if (penguAsset == null) return undefined

    const instances = penguAsset.getAssetInstances()
    return instances.map((instance) => instance.getAnimator())
  }, [penguAsset])

  const prevAspectRatio = useRef(0)
  useRenderCallback(engine, (_timestamp, _startTime, passedSeconds) => {
    const view = engine.getView()
    const aspectRatio = view.aspectRatio
    if (prevAspectRatio.current !== aspectRatio) {
      prevAspectRatio.current = aspectRatio
      // Setup camera lens:
      const camera = engine.getCamera()
      camera.setLensProjection(focalLengthInMillimeters, aspectRatio, near, far)
    }

    // Animate all instances
    allAnimators?.forEach((animator, index) => {
      animator?.applyAnimation(index, passedSeconds)
      animator?.updateBoneMatrices()
    })

    engine.getCamera().lookAt(cameraPosition, cameraTarget, cameraUp)
  })

  return (
    <View style={styles.container}>
      <Filament style={styles.filamentView} engine={engine} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filamentView: {
    flex: 1,
    backgroundColor: 'lightblue',
  },
})

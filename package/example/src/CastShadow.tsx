import * as React from 'react'
import { useEffect, useRef } from 'react'

import { Platform, StyleSheet, View } from 'react-native'
import { Filament, useEngine, Float3, useRenderCallback, useAsset, useModel, useRenderableManager } from 'react-native-filament'

const penguModelPath = Platform.select({
  android: 'custom/pengu.glb',
  ios: 'pengu.glb',
})!

const indirectLightPath = Platform.select({
  android: 'custom/default_env_ibl.ktx',
  ios: 'default_env_ibl.ktx',
})!

const shadowMaterialPath = Platform.select({
  android: 'custom/TransparentShadowMaterial.matc',
  ios: 'TransparentShadowMaterial.matc',
})!

const boxPath = Platform.select({
  android: 'custom/box.glb',
  ios: 'box.glb',
})!

// Camera config:
const cameraPosition: Float3 = [0, 1, 10]
const cameraTarget: Float3 = [0, 0, 0]
const cameraUp: Float3 = [0, 1, 0]
const focalLengthInMillimeters = 28
const near = 0.1
const far = 1000

export function CastShadow() {
  const engine = useEngine()
  const renderableManager = useRenderableManager(engine)

  const pengu = useModel({ engine: engine, path: penguModelPath, castShadow: true, receiveShadow: true })
  const light = useAsset({ path: indirectLightPath })
  const shadowMaterialBuffer = useAsset({ path: shadowMaterialPath })
  //   const box = useModel({ engine: engine, path: boxPath, castShadow: true, receiveShadow: true })
  const groundShape = useModel({ engine: engine, path: boxPath, castShadow: true, receiveShadow: true })

  useEffect(() => {
    if (pengu.state === 'loading') return
    if (groundShape.state === 'loading') return

    // engine.setEntityPosition(pengu.asset.getRoot(), [0, 2, 0], false)
    engine.setEntityPosition(groundShape.asset.getRoot(), [0, -2, 0], false)
    // engine.getScene().removeAssetEntities(groundShape.asset)
    engine.setEntityScale(groundShape.asset.getRoot(), [10, 1, 10], true)
  }, [pengu, groundShape, engine])

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

  useEffect(() => {
    if (shadowMaterialBuffer == null) return
    if (groundShape.state === 'loading') return

    // Create a shadow material
    const shadowMaterial = engine.createMaterial(shadowMaterialBuffer)
    const shadowMaterialInstance = shadowMaterial.createInstance()
    const cube = groundShape.asset.getFirstEntityByName('Cube')
    if (cube == null) {
      console.warn('Cube not found')
      return
    }

    renderableManager.setMaterialInstanceAt(cube, 0, shadowMaterialInstance)
  }, [engine, groundShape, renderableManager, shadowMaterialBuffer])

  // Create Shadow plane
  //   const shadowPlane = React.useMemo(() => {
  //     if (shadowMaterialBuffer == null) return undefined

  //     const shadowMaterial = engine.createMaterial(shadowMaterialBuffer)
  //     const entity = renderableManager.createPlane(shadowMaterial)
  //     return entity
  //   }, [engine, renderableManager, shadowMaterialBuffer])
  //   useEffect(() => {
  //     if (shadowPlane == null) return

  //     // Transform it
  //     engine.setEntityPosition(shadowPlane, [0, -1, 0], true)

  //     engine.getScene().addEntity(shadowPlane)
  //   }, [engine, renderableManager, shadowMaterialBuffer, shadowPlane])

  const prevAspectRatio = useRef(0)
  const penguAnimator = pengu.state === 'loaded' ? pengu.animator : undefined
  const penguEntity = pengu.state === 'loaded' ? pengu.asset.getRoot() : undefined
  useRenderCallback(engine, (_timestamp, _startTime, passedSeconds) => {
    const view = engine.getView()
    const aspectRatio = view.aspectRatio
    if (prevAspectRatio.current !== aspectRatio) {
      prevAspectRatio.current = aspectRatio
      // Setup camera lens:
      const camera = engine.getCamera()
      camera.setLensProjection(focalLengthInMillimeters, aspectRatio, near, far)
    }

    penguAnimator?.applyAnimation(0, passedSeconds)
    penguAnimator?.updateBoneMatrices()
    if (penguEntity) {
      engine.setEntityPosition(penguEntity, [0, 0.45, 0], false)
    }

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

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

  //#region Setup shadow plane
  const shadowMaterialBuffer = useAsset({ path: shadowMaterialPath })
  const shadowMaterial = React.useMemo(() => {
    if (shadowMaterialBuffer == null) return undefined

    const material = engine.createMaterial(shadowMaterialBuffer)
    material.setDefaultParameter('strength', 0.2)
    return material
  }, [engine, shadowMaterialBuffer])

  // Create Shadow plane
  const shadowPlane = React.useMemo(() => {
    if (shadowMaterial == null) return undefined

    const entity = renderableManager.createPlane(shadowMaterial, 10, 0.0001, 10)
    renderableManager.setReceiveShadow(entity, true)
    // Note: Why is cast shadow here, it just needs to receive a shadow?!
    // Right now there seems to be a bug in filament, which would cause the shadow of the animated Pengu to be cut!
    // One solution would be to manually correct the bounding box when using the animator (because it seems like the bounding box isn't correctly
    // updated when using the animator). But, if the plane also casts a shadow, the shadow calculation extends to the bounding box of the plane,
    // thus fixing the cut shadow of the animated Pengu. The plane will never actually cast a shadow, as its using a transparent material.
    renderableManager.setCastShadow(entity, true)
    return entity
  }, [renderableManager, shadowMaterial])
  useEffect(() => {
    if (shadowPlane == null) return

    // Transform it
    engine.setEntityPosition(shadowPlane, [0, -1, 0], true)

    engine.getScene().addEntity(shadowPlane)
  }, [engine, renderableManager, shadowMaterialBuffer, shadowPlane])
  //#endregion

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
    if (penguEntity != null) {
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

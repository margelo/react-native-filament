import * as React from 'react'
import { useEffect, useRef } from 'react'

import { Button, StyleSheet, View } from 'react-native'
import {
  FilamentView,
  Float3,
  useRenderCallback,
  useBuffer,
  useModel,
  useAssetAnimator,
  getAssetFromModel,
  useConfigureAssetShadow,
  Material,
  runOnWorklet,
  Entity,
  FilamentProvider,
  useFilamentContext,
  withCleanupScope,
} from 'react-native-filament'
import { useDefaultLight } from './hooks/useDefaultLight'
import { getAssetPath } from './utils/getAssetPasth'

const penguModelPath = getAssetPath('pengu.glb')

const shadowMaterialPath = getAssetPath('TransparentShadowMaterial.matc')

// Camera config:
const cameraPosition: Float3 = [0, 1, 10]
const cameraTarget: Float3 = [0, 0, 0]
const cameraUp: Float3 = [0, 1, 0]
const focalLengthInMillimeters = 28
const near = 0.1
const far = 1000

function Renderer() {
  const { engine, camera, view, renderableManager, transformManager, scene } = useFilamentContext()
  useDefaultLight()

  const pengu = useModel({ source: penguModelPath })

  //#region Setup shadow plane
  const shadowMaterialBuffer = useBuffer({ source: shadowMaterialPath })
  const [shadowMaterial, setShadowMaterial] = React.useState<Material | undefined>(undefined)
  React.useEffect(() => {
    if (shadowMaterialBuffer == null) return undefined

    runOnWorklet(() => {
      'worklet'
      const material = engine.createMaterial(shadowMaterialBuffer)
      material.setDefaultParameter('strength', 0.2)
      return material
    })().then(setShadowMaterial)
  }, [engine, shadowMaterialBuffer])
  useEffect(() => {
    return withCleanupScope(() => {
      shadowMaterial?.release()
    })
  }, [shadowMaterial])

  // Create Shadow plane
  const [shadowPlane, setShadowPlane] = React.useState<Entity | undefined>(undefined)
  React.useEffect(() => {
    if (shadowMaterial == null) return undefined

    runOnWorklet(() => {
      'worklet'
      const entity = renderableManager.createPlane(shadowMaterial, 10, 0.0001, 10)
      renderableManager.setReceiveShadow(entity, true)
      // Note: Why is cast shadow here, it just needs to receive a shadow?!
      // Right now there seems to be a bug in filament, which would cause the shadow of the animated Pengu to be cut!
      // One solution would be to manually correct the bounding box when using the animator (because it seems like the bounding box isn't correctly
      // updated when using the animator). But, if the plane also casts a shadow, the shadow calculation extends to the bounding box of the plane,
      // thus fixing the cut shadow of the animated Pengu. The plane will never actually cast a shadow, as its using a transparent material.
      renderableManager.setCastShadow(entity, true)
      return entity
    })().then(setShadowPlane)
  }, [renderableManager, shadowMaterial])

  useEffect(() => {
    if (shadowPlane == null) return

    // Transform it
    transformManager.setEntityPosition(shadowPlane, [0, -1, 0], true)

    scene.addEntity(shadowPlane)

    return () => {
      scene.removeEntity(shadowPlane)
    }
  }, [renderableManager, scene, shadowMaterialBuffer, shadowPlane, transformManager])
  //#endregion

  const prevAspectRatio = useRef(0)
  const penguAnimator = useAssetAnimator(getAssetFromModel(pengu))
  const penguEntity = pengu.state === 'loaded' ? pengu.asset.getRoot() : undefined
  useRenderCallback(({ passedSeconds }) => {
    'worklet'

    const aspectRatio = view.getAspectRatio()
    if (prevAspectRatio.current !== aspectRatio) {
      prevAspectRatio.current = aspectRatio
      // Setup camera lens:
      camera.setLensProjection(focalLengthInMillimeters, aspectRatio, near, far)
    }

    penguAnimator?.applyAnimation(0, passedSeconds)
    penguAnimator?.updateBoneMatrices()
    if (penguEntity != null) {
      transformManager.setEntityPosition(penguEntity, [0, 0.45, 0], false)
    }

    camera.lookAt(cameraPosition, cameraTarget, cameraUp)
  })

  const [showShadow, setShowShadow] = React.useState(false)
  useConfigureAssetShadow({
    renderableManager,
    asset: getAssetFromModel(pengu),
    castShadow: showShadow,
    receiveShadow: showShadow,
  })

  return (
    <View style={styles.container}>
      <FilamentView style={styles.filamentView} />
      <Button title={`Toggle Shadow (${showShadow ? 'enabled' : 'disabled'})`} onPress={() => setShowShadow((prev) => !prev)} />
    </View>
  )
}

export function CastShadow() {
  const [isSSAOEnabled, setIsSSAOEnabled] = React.useState(false)

  return (
    <FilamentProvider ambientOcclusionOptions={{ enabled: isSSAOEnabled }}>
      <Renderer />
      <Button title={`Toggle SSAO (${isSSAOEnabled ? 'enabled' : 'disabled'})`} onPress={() => setIsSSAOEnabled((prev) => !prev)} />
    </FilamentProvider>
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

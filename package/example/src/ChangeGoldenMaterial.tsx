import * as React from 'react'
import { useCallback, useRef } from 'react'

import { Button, StyleSheet, View } from 'react-native'
import {
  Filament,
  Float3,
  useRenderCallback,
  useBuffer,
  useModel,
  FilamentProvider,
  useFilamentContext,
  useWorkletCallback,
  runOnWorklet,
  Material,
  withCleanupScope,
} from 'react-native-filament'
import { getAssetPath } from './utils/getAssetPasth'
import { useDefaultLight } from './hooks/useDefaultLight'

const penguModelPath = getAssetPath('pengu.glb')

// Camera config:
const cameraPosition: Float3 = [0, 0, 8]
const cameraTarget: Float3 = [0, 0, 0]
const cameraUp: Float3 = [0, 1, 0]
const focalLengthInMillimeters = 28
const near = 0.1
const far = 1000

function Renderer() {
  const { engine, camera, view, renderableManager } = useFilamentContext()

  useDefaultLight()

  const pengu = useModel({ source: penguModelPath })
  const baseColorBuffer = useBuffer({ source: getAssetPath('Pengu_Skin_Gold.jpg'), releaseOnUnmount: false })
  const normalBuffer = useBuffer({ source: getAssetPath('Pengu_Skin_Gold_Normal.jpg'), releaseOnUnmount: false })
  const metallicRoughnessBuffer = useBuffer({
    source: getAssetPath('Pengu_Skin_Gold_Roughness.jpg'),
    releaseOnUnmount: false,
  })
  const customMaterial = useBuffer({ source: getAssetPath('test.matc'), releaseOnUnmount: false })

  const penguAsset = pengu.state === 'loaded' ? pengu.asset : undefined
  const changeGoldenSkin = React.useEffect(() => {
    let localMaterial: Material | undefined
    runOnWorklet(() => {
      'worklet'

      if (penguAsset == null) return
      if (baseColorBuffer == null) return
      if (normalBuffer == null) return
      if (metallicRoughnessBuffer == null) return
      if (customMaterial == null) return

      const body = penguAsset.getFirstEntityByName('Round_Body')
      if (!body) {
        console.warn('Body entity not found in pengu asset')
        return
      }

      const material = engine.createMaterial(customMaterial)
      material.setDefaultTextureParameter(renderableManager, 'baseColorMap', baseColorBuffer, 'sRGB')
      material.setDefaultTextureParameter(renderableManager, 'normalMap', normalBuffer, 'sRGB')
      material.setDefaultTextureParameter(renderableManager, 'metallicRoughnessMap', metallicRoughnessBuffer, 'sRGB')
      const materialInstance = material.getDefaultInstance()

      renderableManager.setMaterialInstanceAt(body, 0, materialInstance)

      return material
    })().then((material) => {
      localMaterial = material
    })

    return withCleanupScope(() => {
      if (localMaterial) {
        localMaterial.release()
      }
    })
  }, [baseColorBuffer, customMaterial, engine, metallicRoughnessBuffer, normalBuffer, penguAsset, renderableManager])

  const prevAspectRatio = useRef(0)
  useRenderCallback(
    useCallback(() => {
      'worklet'
      const aspectRatio = view.getAspectRatio()
      if (prevAspectRatio.current !== aspectRatio) {
        prevAspectRatio.current = aspectRatio
        // Setup camera lens:
        camera.setLensProjection(focalLengthInMillimeters, aspectRatio, near, far)
      }

      camera.lookAt(cameraPosition, cameraTarget, cameraUp)
    }, [view, camera, prevAspectRatio])
  )

  return (
    <View style={styles.container}>
      <Filament style={styles.filamentView} />
      <Button
        title="Change Eyes"
        onPress={() => {
          changeGoldenSkin()
        }}
      />
    </View>
  )
}

export function ChangeGoldenMaterials() {
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
    backgroundColor: 'lightblue',
  },
})

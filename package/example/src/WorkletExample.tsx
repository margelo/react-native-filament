import React from 'react'
import { useSharedValue } from 'react-native-worklets-core'
import { Button, Platform, SafeAreaView, StyleSheet } from 'react-native'
import {
  Engine,
  Filament,
  Float3,
  getAssetFromModel,
  useAssetAnimator,
  useCamera,
  useEngine,
  useModel,
  useRenderCallback,
  useView,
  useWorkletCallback,
} from 'react-native-filament'
import { useDefaultLight } from './hooks/useDefaultLight'
import { Config } from './config'
import { getAssetPath } from './utils/getAssetPasth'

const penguModelPath = Platform.select({
  android: 'custom/pengu.glb',
  ios: 'pengu.glb',
})!

function Model({ engine }: { engine: Engine }) {
  useModel({
    engine,
    path: getAssetPath('coffeeshop.glb'),
    autoAddToScene: true,
  })
  useModel({
    engine,
    path: getAssetPath('coffeeshop_table_level03.glb'),
    autoAddToScene: true,
  })
  useModel({
    engine,
    path: getAssetPath('coffeeshop_seating_level03.glb'),
    autoAddToScene: true,
  })
  useModel({
    engine,
    path: getAssetPath('coffeeshop_plant_level03.glb'),
    autoAddToScene: true,
  })
  useModel({
    engine,
    path: getAssetPath('coffeeshop_machine_level03.glb'),
    autoAddToScene: true,
  })

  return null
}

const cameraPosition: Float3 = [0, 3, 13]
const cameraTarget: Float3 = [0, 0, 0]
const cameraUp: Float3 = [0, 1, 0]

function Renderer({ engine }: { engine: Engine }) {
  useDefaultLight(engine)
  const asset = useModel({
    engine,
    path: penguModelPath,
    autoAddToScene: true,
  })

  const view = useView(engine)
  const camera = useCamera(engine)

  const prevAspectRatio = useSharedValue(0)
  const assetAnimator = useAssetAnimator(getAssetFromModel(asset))
  useRenderCallback(
    engine,
    useWorkletCallback(
      (_timestamp: number, _startTime: number, passedSeconds: number) => {
        'worklet'

        const aspectRatio = view.getAspectRatio()
        if (prevAspectRatio.value !== aspectRatio) {
          prevAspectRatio.value = aspectRatio
          // Setup camera lens:
          const { focalLengthInMillimeters, near, far } = Config.camera
          camera.setLensProjection(focalLengthInMillimeters, aspectRatio, near, far)
          console.log('Updated camera lens!')
        }

        camera.lookAt(cameraPosition, cameraTarget, cameraUp)

        if (assetAnimator == null) {
          return
        }

        assetAnimator.applyAnimation(0, passedSeconds)
        assetAnimator.updateBoneMatrices()
      },
      [assetAnimator, camera, prevAspectRatio, view]
    )
  )

  const [showItem, setShowItem] = React.useState(true)

  return (
    <SafeAreaView style={styles.container}>
      <Filament style={styles.filamentView} engine={engine} />
      {showItem && <Model engine={engine} />}
      <Button
        title="Toggle item"
        onPress={() => {
          // setShowItem((prev) => !prev)
          setInterval(() => {
            setShowItem((prev) => !prev)
          }, 100)
        }}
      />
    </SafeAreaView>
  )
}

export function WorkletExample() {
  const engine = useEngine()

  if (engine == null) return null
  return <Renderer engine={engine} />
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

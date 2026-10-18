import React, { useCallback, useState } from 'react'
import { Button, StyleSheet, View } from 'react-native'
import ReactNativeBlobUtil from 'react-native-blob-util'
import { Camera, DefaultLight, FilamentScene, FilamentView, Model } from 'react-native-filament'

const downloadUrl = 'https://raw.githubusercontent.com/google/filament/main/third_party/models/DamagedHelmet/DamagedHelmet.glb'

function Renderer({ assetPath }: { assetPath: string }) {
  return (
    <FilamentView style={styles.container}>
      <Camera />
      <DefaultLight />
      <Model source={{ uri: assetPath }} transformToUnitCube />
    </FilamentView>
  )
}

export function LoadFromFile() {
  const [assetPath, setAssetPath] = useState<string>()
  const downloadAsset = useCallback(async () => {
    const response = await ReactNativeBlobUtil.config({ fileCache: true, appendExt: 'glb' }).fetch('GET', downloadUrl)
    setAssetPath(`file://${response.path()}`)
  }, [])

  if (assetPath == null) {
    return (
      <View style={styles.container}>
        <Button title="Load asset" onPress={downloadAsset} />
      </View>
    )
  }
  return (
    <FilamentScene>
      <Renderer assetPath={assetPath} />
    </FilamentScene>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
})

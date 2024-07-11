import * as React from 'react'
import { useCallback, useState } from 'react'
import { Button, StyleSheet, View } from 'react-native'
import { FilamentScene, FilamentView, Camera, Model, DefaultLight } from 'react-native-filament'
import RNFetchBlob from 'rn-fetch-blob'

function Renderer({ assetPath }: { assetPath: string }) {
  console.log('Renderer assetPath', assetPath)
  return (
    <FilamentView style={styles.filamentView}>
      <Camera />
      <DefaultLight />
      <Model source={{ uri: assetPath }} transformToUnitCube />
    </FilamentView>
  )
}

export function LoadFromFile() {
  const [assetPath, setAssetPath] = useState<string>()

  const downloadAsset = useCallback(() => {
    const downloadUrl = 'https://raw.githubusercontent.com/google/filament/main/third_party/models/DamagedHelmet/DamagedHelmet.glb'
    console.log('Downloading asset from', downloadUrl)
    RNFetchBlob.config({
      fileCache: true,
      appendExt: 'glb',
    })
      .fetch('GET', downloadUrl)
      .then((res) => {
        const path = res.path()
        console.log('Downloaded asset to', path)
        setAssetPath(`file://${path}`)
      })
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
  container: {
    flex: 1,
  },
  filamentView: {
    flex: 1,
  },
  btnContainer: {
    position: 'absolute',
    bottom: 0,
    maxHeight: 120,
    width: '100%',
  },
})

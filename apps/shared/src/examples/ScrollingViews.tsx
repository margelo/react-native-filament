import React from 'react'
import { FlatList, StyleSheet, Text, View } from 'react-native'
import { Camera, DefaultLight, FilamentScene, FilamentView, Model, useEngine, type Engine, type Float3 } from 'react-native-filament'

const coins = [
  { name: 'Coin', source: require('../../assets/coin.glb') },
  { name: 'Translucent coin', source: require('../../assets/coin_with_alpha.glb') },
]
const rows = Array.from({ length: 24 }, (_, index) => ({
  key: String(index),
  ...coins[index % coins.length]!,
  rotate: [Math.PI / 3, (index * Math.PI) / 6, 0] as Float3,
}))

function Row({ engine, row }: { engine: Engine; row: (typeof rows)[number] }) {
  return (
    <View style={styles.row}>
      <FilamentScene engine={engine}>
        <FilamentView style={styles.view}>
          <Camera cameraPosition={[0, 0, 4]} />
          <DefaultLight />
          <Model source={row.source} transformToUnitCube rotate={row.rotate} />
        </FilamentView>
      </FilamentScene>
      <Text style={styles.caption}>
        {row.name} #{row.key}
      </Text>
    </View>
  )
}

/** Many views in a scrolling list share one Engine; each row's scene is disposed when it scrolls away. */
export function ScrollingViews() {
  const engine = useEngine()
  if (engine == null) return <Text style={styles.caption}>Starting Filament…</Text>
  return <FlatList data={rows} renderItem={({ item }) => <Row engine={engine} row={item} />} />
}

const styles = StyleSheet.create({
  row: { borderBottomWidth: StyleSheet.hairlineWidth },
  view: { height: 180 },
  caption: { padding: 8, textAlign: 'center' },
})

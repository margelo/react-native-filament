import React from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Filament } from 'react-native-filament'
import { examples } from './examples'

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<Record<string, undefined>>>()
  return (
    <ScrollView style={styles.container}>
      <View style={styles.info}>
        <Text testID="filament-version" style={styles.title}>
          Filament {Filament.filamentVersion}
        </Text>
        <Text testID="filament-backends" style={styles.subtitle}>
          Backends: {Filament.supportedBackends.join(', ')}
        </Text>
      </View>
      {examples.map((example) => (
        <Pressable key={example.route} style={styles.row} onPress={() => navigation.navigate(example.route)}>
          <Text style={styles.rowText}>{example.title}</Text>
        </Pressable>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  info: { padding: 20, borderBottomWidth: StyleSheet.hairlineWidth },
  title: { fontSize: 22, fontWeight: '600', color: 'black' },
  subtitle: { fontSize: 16, color: '#444', marginTop: 4 },
  row: { height: 80, justifyContent: 'center', padding: 20, borderBottomWidth: StyleSheet.hairlineWidth },
  rowText: { fontSize: 20, color: 'black' },
})

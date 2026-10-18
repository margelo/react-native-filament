import React from 'react'
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Filament } from 'react-native-filament'
import { examples, type ExampleSection } from './examples'

const sections = (['React API', 'Imperative API', 'Benchmarks'] as const satisfies ExampleSection[]).map((title) => ({
  title,
  data: examples.filter((example) => example.section === title),
}))

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<Record<string, undefined>>>()
  return (
    <SectionList
      style={styles.container}
      sections={sections}
      keyExtractor={(example) => example.route}
      ListHeaderComponent={
        <View style={styles.info}>
          <Text testID="filament-version" style={styles.title}>
            Filament {Filament.filamentVersion}
          </Text>
          <Text testID="filament-backends" style={styles.subtitle}>
            Backends: {Filament.supportedBackends.join(', ')}
          </Text>
        </View>
      }
      renderSectionHeader={({ section }) => <Text style={styles.section}>{section.title}</Text>}
      renderItem={({ item }) => (
        <Pressable style={styles.row} onPress={() => navigation.navigate(item.route)}>
          <Text style={styles.rowText}>{item.title}</Text>
        </Pressable>
      )}
    />
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  info: { padding: 20, borderBottomWidth: StyleSheet.hairlineWidth },
  title: { fontSize: 22, fontWeight: '600', color: 'black' },
  subtitle: { fontSize: 16, color: '#444', marginTop: 4 },
  section: { paddingHorizontal: 20, paddingVertical: 8, fontSize: 14, fontWeight: '600', color: '#555', backgroundColor: '#f2f2f2' },
  row: { height: 80, justifyContent: 'center', padding: 20, borderBottomWidth: StyleSheet.hairlineWidth },
  rowText: { fontSize: 20, color: 'black' },
})

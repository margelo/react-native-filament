import React from 'react'
import { StyleSheet } from 'react-native'
import { Animator, Camera, DefaultLight, FilamentScene, FilamentView, Model, ModelInstance } from 'react-native-filament'

const drone = require('../../assets/buster_drone.glb')
const instances = [0, 1, 2, 3]
const spacing = 300

function Renderer() {
  return (
    <FilamentView style={styles.filamentView} transparent>
      <Camera />
      <DefaultLight />
      <Model source={drone} instanceCount={instances.length} transformToUnitCube>
        {instances.map((index) => (
          <ModelInstance
            key={index}
            index={index}
            translate={[(index % 2) * spacing - spacing / 2, Math.floor(index / 2) * spacing - spacing / 2, 0]}>
            <Animator />
          </ModelInstance>
        ))}
      </Model>
    </FilamentView>
  )
}

export function MultipleInstances() {
  return (
    <FilamentScene>
      <Renderer />
    </FilamentScene>
  )
}

const styles = StyleSheet.create({
  filamentView: { flex: 1, backgroundColor: 'lightblue' },
})

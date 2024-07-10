import React from 'react'
import { StyleSheet } from 'react-native'
import { Animator, Camera, DefaultLight, FilamentContext, FilamentView, Model, ModelInstance } from 'react-native-filament'
import DroneGlb from '~/assets/buster_drone.glb'

const instances = [0, 1, 2, 3]
const instanceCount = instances.length

function Renderer() {
  return (
    <FilamentView style={styles.filamentView}>
      <Camera />
      <DefaultLight />

      {/* We transform the root model to a unit cube, meaning all instances will be scaled to unit cubes */}
      <Model source={DroneGlb} instanceCount={instanceCount} transformToUnitCube multiplyWithCurrentTransform={false}>
        {instances.map((index) => {
          // Calculate positions for a 2x2 grid
          // Assuming each instance occupies a 1x1 area, adjust the multiplier for larger sizes
          const spacingMultiplier = 4
          const x = (index % 2) * spacingMultiplier - spacingMultiplier / 2
          const y = Math.floor(index / 2) * spacingMultiplier - spacingMultiplier / 2
          const z = 0 // Keep z the same if you're not using it for depth positioning

          return (
            <ModelInstance key={index} index={index} position={[x, y, z]}>
              <Animator />
            </ModelInstance>
          )
        })}
      </Model>
    </FilamentView>
  )
}

export function MultipleInstances() {
  return (
    <FilamentContext>
      <Renderer />
    </FilamentContext>
  )
}

const styles = StyleSheet.create({
  filamentView: {
    flex: 1,
    backgroundColor: 'lightblue',
  },
})

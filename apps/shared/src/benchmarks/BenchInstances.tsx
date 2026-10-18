import React from 'react'
import { Animator, Model, ModelInstance } from 'react-native-filament'
import { BenchmarkScene } from './BenchmarkScene'

const drone = require('../../assets/buster_drone.glb')
export const INSTANCE_COLUMNS = 10
export const INSTANCE_COUNT = 100
const SPACING = 300
const instances = Array.from({ length: INSTANCE_COUNT }, (_, index) => index)

/** 100 instances of the drone, each playing its animation. */
export function BenchInstances() {
  return (
    <BenchmarkScene scene="instances-100" cameraPosition={[0, 0, 12]}>
      <Model source={drone} instanceCount={INSTANCE_COUNT} transformToUnitCube scale={[0.2, 0.2, 0.2]}>
        {instances.map((index) => (
          <ModelInstance
            key={index}
            index={index}
            translate={[((index % INSTANCE_COLUMNS) - 4.5) * SPACING, (Math.floor(index / INSTANCE_COLUMNS) - 4.5) * SPACING, 0]}>
            <Animator />
          </ModelInstance>
        ))}
      </Model>
    </BenchmarkScene>
  )
}

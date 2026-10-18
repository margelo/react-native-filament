import React from 'react'
import { Model } from 'react-native-filament'
import { BenchmarkScene } from './BenchmarkScene'

const drone = require('../../assets/buster_drone.glb')

/** One drone that never changes, rendered on every display refresh as in 1.x. */
export function BenchStatic() {
  return (
    <BenchmarkScene scene="static">
      <Model source={drone} transformToUnitCube />
    </BenchmarkScene>
  )
}

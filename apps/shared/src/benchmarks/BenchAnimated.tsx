import React from 'react'
import { Animator, Model } from 'react-native-filament'
import { BenchmarkScene } from './BenchmarkScene'

const drone = require('../../assets/buster_drone.glb')

/** One drone playing its animation. */
export function BenchAnimated() {
  return (
    <BenchmarkScene scene="animated">
      <Model source={drone} transformToUnitCube>
        <Animator />
      </Model>
    </BenchmarkScene>
  )
}

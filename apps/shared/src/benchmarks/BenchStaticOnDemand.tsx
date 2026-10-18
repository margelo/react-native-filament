import React from 'react'
import { Model } from 'react-native-filament'
import { BenchmarkScene } from './BenchmarkScene'

const drone = require('../../assets/buster_drone.glb')

/** The static drone in `on-demand` mode: the renderer sleeps once the scene is drawn. 1.x has no equivalent. */
export function BenchStaticOnDemand() {
  return (
    <BenchmarkScene scene="static-on-demand" renderMode="on-demand">
      <Model source={drone} transformToUnitCube />
    </BenchmarkScene>
  )
}

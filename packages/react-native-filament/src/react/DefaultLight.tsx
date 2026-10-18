import React from 'react'
import { defaultIndirectLightSource } from '../assets/defaultIndirectLightSource'
import { EnvironmentalLight } from './EnvironmentalLight'
import { Light } from './Light'

/** The bundled studio environment plus a shadow-casting directional light. */
export function DefaultLight() {
  return (
    <>
      <EnvironmentalLight source={defaultIndirectLightSource} />
      <Light type="directional" intensity={10_000} colorKelvin={6_500} castShadows />
    </>
  )
}

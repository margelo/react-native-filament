import React from 'react'
import { EnvironmentalLight, Light } from 'react-native-filament'
import DefaultLightIBL from '../../assets/default_env_ibl.ktx'

export function DefaultLight() {
  return (
    <>
      <EnvironmentalLight source={DefaultLightIBL} />
      <Light type="directional" intensity={10_000} colorKelvin={6_500} castShadows={true} />
    </>
  )
}

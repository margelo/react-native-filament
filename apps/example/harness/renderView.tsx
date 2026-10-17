import React from 'react'
import { render } from 'react-native-harness'
import { callback } from 'react-native-nitro-modules'
import { NativeFilamentView, type FilamentView } from 'react-native-filament'

export function renderView(): Promise<FilamentView> {
  return new Promise((resolve) => {
    render(<NativeFilamentView style={{ width: 200, height: 200 }} hybridRef={callback(resolve)} />)
  })
}

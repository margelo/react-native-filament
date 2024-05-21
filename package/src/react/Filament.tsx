import React, { PropsWithChildren, useCallback } from 'react'
import { FilamentProvider, FilamentProviderProps } from './FilamentContext'
import { RenderCallbackContext } from './RenderCallbackContext'
import { FilamentView } from './FilamentView'
import { RenderCallback } from '../types'
import { StyleSheet } from 'react-native'

type Props = PropsWithChildren<FilamentProviderProps>

// Purpose: provide a render callback to the FilamentView by combining all render callbacks from the context
function FilamentViewWithRenderCallbacks({ children }: PropsWithChildren) {
  const renderCallbacks = RenderCallbackContext.useRenderCallbacks()
  const renderCallback: RenderCallback = useCallback(
    (frameInfo) => {
      'worklet'

      renderCallbacks.value.forEach(({ callback }) => {
        callback(frameInfo)
      })
    },
    [renderCallbacks]
  )

  return (
    <FilamentView style={styles.container} renderCallback={renderCallback}>
      {children}
    </FilamentView>
  )
}

// The public Filament component as the user imports it:
/**
 * Renders a filament view with styles of `flex: 1`.
 *
 * @example
 *
 * ```tsx
 *  <Filament>
 *    <Model source={require('./model.glb')} />
 *  </Filament>
 * ```
 */
export function Filament({ children, ...props }: Props) {
  return (
    <FilamentProvider {...props}>
      <RenderCallbackContext.RenderContextProvider>
        <FilamentViewWithRenderCallbacks>{children}</FilamentViewWithRenderCallbacks>
      </RenderCallbackContext.RenderContextProvider>
    </FilamentProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})

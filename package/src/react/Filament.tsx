import React, { PropsWithChildren, useCallback } from 'react'
import { FilamentAPIContextProvider, FilamentProviderProps } from './FilamentAPIContextProvider'
import { RenderCallbackContext } from './RenderCallbackContext'
import { FilamentView, PublicNativeProps } from './FilamentView'
import { RenderCallback } from '../types'
import { StyleSheet, ViewStyle } from 'react-native'

type ForwardProps = PublicNativeProps & {
  style?: ViewStyle
}

type Props = PropsWithChildren<FilamentProviderProps & ForwardProps>

// Purpose: provide a render callback to the FilamentView by combining all render callbacks from the context
function FilamentViewWithRenderCallbacks({ children, ...forwardProps }: PropsWithChildren<ForwardProps>) {
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
    <FilamentView renderCallback={renderCallback} {...forwardProps} style={[styles.container, forwardProps.style]}>
      {children}
    </FilamentView>
  )
}

// The public Filament component as the user imports it:
/**
 * Renders a filament view with default styles of `flex: 1`.
 *
 * @example
 *
 * ```tsx
 *  <Filament>
 *    <Model source={require('./model.glb')} />
 *  </Filament>
 * ```
 */
export function Filament({ children, enableTransparentRendering, style, ...props }: Props) {
  return (
    <FilamentAPIContextProvider {...props}>
      <RenderCallbackContext.RenderContextProvider>
        <FilamentViewWithRenderCallbacks enableTransparentRendering={enableTransparentRendering} style={style}>
          {children}
        </FilamentViewWithRenderCallbacks>
      </RenderCallbackContext.RenderContextProvider>
    </FilamentAPIContextProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})

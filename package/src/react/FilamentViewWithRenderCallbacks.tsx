import React, { PropsWithChildren, useCallback } from 'react'
import { RenderCallbackContext } from './RenderCallbackContext'
import { FilamentView, PublicNativeProps } from './FilamentView'
import { RenderCallback } from '../types'
import { StyleSheet, ViewStyle } from 'react-native'

type ForwardProps = PublicNativeProps & {
  style?: ViewStyle
  renderCallback?: RenderCallback
}

export function FilamentViewWithRenderCallbacks({
  children,
  renderCallback: renderCallbackProp,
  ...forwardProps
}: PropsWithChildren<ForwardProps>) {
  const renderCallbacks = RenderCallbackContext.useRenderCallbacks()
  const renderCallback: RenderCallback = useCallback(
    (frameInfo) => {
      'worklet'

      renderCallbackProp?.(frameInfo)

      renderCallbacks.value.forEach(({ callback }) => {
        callback(frameInfo)
      })
    },
    [renderCallbackProp, renderCallbacks]
  )

  return (
    <FilamentView renderCallback={renderCallback} {...forwardProps} style={[styles.container, forwardProps.style]}>
      {children}
    </FilamentView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})

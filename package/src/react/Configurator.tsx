import { PropsWithChildren, useEffect, useMemo } from 'react'
import {
  AmbientOcclusionOptions,
  DynamicResolutionOptions,
  FrameRateOptions,
  TemporalAntiAliasingOptions,
  View,
  optionsToJSI,
} from '../types'
import { useFilamentContext } from '../hooks/useFilamentContext'
import { makeAmbientOcclusionHostObject } from '../utilities/makeAmbientOcclusionHostObject'
import { makeDynamicResolutionHostObject } from '../utilities/makeDynamicResolutionHostObject'

export type ViewConfigProps = Partial<
  Pick<View, 'antiAliasing' | 'screenSpaceRefraction' | 'postProcessing' | 'dithering' | 'shadowing'>
> & {
  ambientOcclusionOptions?: AmbientOcclusionOptions
  dynamicResolutionOptions?: DynamicResolutionOptions
  temporalAntiAliasingOptions?: TemporalAntiAliasingOptions
}

export type RendererConfigProps = {
  frameRateOptions?: FrameRateOptions
}

export type ConfiguratorProps = PropsWithChildren<{
  rendererProps?: RendererConfigProps
  viewProps: ViewConfigProps
}>

/**
 * Takes configurations as props and applies them using the imperative API.
 * Needs to have a valid `FilamentScene` in the tree.
 *
 * @private
 */
export function Configurator({ rendererProps, viewProps, children }: ConfiguratorProps) {
  const { view, renderer } = useFilamentContext()

  // Apply view configs
  const {
    ambientOcclusionOptions,
    antiAliasing,
    dithering,
    dynamicResolutionOptions,
    postProcessing,
    screenSpaceRefraction,
    shadowing,
    temporalAntiAliasingOptions,
  } = viewProps

  const unboxedViewJS = useMemo(() => view.unbox(), [view])
  useEffect(() => {
    if (ambientOcclusionOptions != null) {
      const options = makeAmbientOcclusionHostObject(unboxedViewJS, ambientOcclusionOptions)
      unboxedViewJS.setAmbientOcclusionOptions(options)
    }
    if (dynamicResolutionOptions != null) {
      const options = makeDynamicResolutionHostObject(unboxedViewJS, dynamicResolutionOptions)
      unboxedViewJS.setDynamicResolutionOptions(options)
    }
    if (antiAliasing != null) unboxedViewJS.antiAliasing = antiAliasing
    if (dithering != null) unboxedViewJS.dithering = dithering
    if (postProcessing != null) unboxedViewJS.postProcessing = postProcessing
    if (screenSpaceRefraction != null) unboxedViewJS.screenSpaceRefraction = screenSpaceRefraction
    if (shadowing != null) unboxedViewJS.shadowing = shadowing
    if (temporalAntiAliasingOptions != null) unboxedViewJS.temporalAntiAliasingOptions = optionsToJSI(temporalAntiAliasingOptions)
  }, [
    unboxedViewJS,
    ambientOcclusionOptions,
    antiAliasing,
    dithering,
    dynamicResolutionOptions,
    postProcessing,
    screenSpaceRefraction,
    shadowing,
    temporalAntiAliasingOptions,
  ])

  // Apply renderer configs
  const { frameRateOptions } = rendererProps ?? {}
  useEffect(() => {
    if (frameRateOptions != null) {
      renderer.unbox().setFrameRateOptions(frameRateOptions)
    }
  }, [renderer, frameRateOptions])

  return children
}

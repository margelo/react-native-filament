import { PropsWithChildren, useEffect } from 'react'
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
import { makeBloomOptionsHostObject } from '../utilities/makeBloomOptionsHostObject'

export type ViewConfigProps = Partial<
  Pick<View, 'antiAliasing' | 'screenSpaceRefraction' | 'postProcessing' | 'dithering' | 'shadowing'>
> & {
  ambientOcclusionOptions?: AmbientOcclusionOptions
  dynamicResolutionOptions?: DynamicResolutionOptions
  bloomOptions?: import('../types').BloomOptions
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
    bloomOptions,
    postProcessing,
    screenSpaceRefraction,
    shadowing,
    temporalAntiAliasingOptions,
  } = viewProps
  useEffect(() => {
    if (ambientOcclusionOptions != null) {
      const options = makeAmbientOcclusionHostObject(view, ambientOcclusionOptions)
      view.setAmbientOcclusionOptions(options)
    }
    if (dynamicResolutionOptions != null) {
      const options = makeDynamicResolutionHostObject(view, dynamicResolutionOptions)
      view.setDynamicResolutionOptions(options)
    }
    if (bloomOptions != null) {
      const options = makeBloomOptionsHostObject(view, bloomOptions)
      view.setBloomOptions(options)
    }
    if (antiAliasing != null) view.antiAliasing = antiAliasing
    if (dithering != null) view.dithering = dithering
    if (postProcessing != null) view.postProcessing = postProcessing
    if (screenSpaceRefraction != null) view.screenSpaceRefraction = screenSpaceRefraction
    if (shadowing != null) view.shadowing = shadowing
    if (temporalAntiAliasingOptions != null) view.temporalAntiAliasingOptions = optionsToJSI(temporalAntiAliasingOptions)
  }, [
    view,
    ambientOcclusionOptions,
    antiAliasing,
    dithering,
    dynamicResolutionOptions,
    bloomOptions,
    postProcessing,
    screenSpaceRefraction,
    shadowing,
    temporalAntiAliasingOptions,
  ])

  // Apply renderer configs
  const { frameRateOptions } = rendererProps ?? {}
  useEffect(() => {
    if (frameRateOptions != null) {
      renderer.setFrameRateOptions(frameRateOptions)
    }
  }, [renderer, frameRateOptions])

  return children
}

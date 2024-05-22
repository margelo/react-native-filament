import { PropsWithChildren, useEffect, useMemo } from 'react'
import {
  AmbientOcclusionOptions,
  Choreographer,
  DynamicResolutionOptions,
  Engine,
  FrameRateOptions,
  TemporalAntiAliasingOptions,
  View,
  optionsToJSI,
} from '../types'
import { FilamentContext, FilamentContextType } from './FilamentContext'
import { FilamentProxy, FilamentWorkletContext } from '../native/FilamentProxy'
import { makeAmbientOcclusionHostObject } from '../utilities/makeAmbientOcclusionHostObject'
import { makeDynamicResolutionHostObject } from '../utilities/makeDynamicResolutionHostObject'
import { withCleanupScope } from '../utilities/withCleanupScope'
import { EngineProps, useEngine } from '../hooks/useEngine'
import { useDisposableResource } from '../hooks/useDisposableResource'
import { useWorklet } from 'react-native-worklets-core'
import React from 'react'

type ViewProps = Partial<Pick<View, 'antiAliasing' | 'screenSpaceRefraction' | 'postProcessing' | 'dithering' | 'shadowing'>> & {
  ambientOcclusionOptions?: AmbientOcclusionOptions
  dynamicResolutionOptions?: DynamicResolutionOptions
  temporalAntiAliasingOptions?: TemporalAntiAliasingOptions
}

type RendererProps = {
  frameRateOptions?: FrameRateOptions
}

type Props = PropsWithChildren<{
  engine: Engine
  choreographer: Choreographer
  viewProps: ViewProps
  rendererProps?: RendererProps
}>

// Internal component that actually sets the context; its set once the engine is ready and we can creates values for all APIs
function EngineAPIProvider({ children, engine, choreographer, viewProps, rendererProps }: Props) {
  const transformManager = useMemo(() => engine.createTransformManager(), [engine])
  const renderableManager = useMemo(() => engine.createRenderableManager(), [engine])
  const scene = useMemo(() => engine.getScene(), [engine])
  const lightManager = useMemo(() => engine.createLightManager(), [engine])
  const view = useMemo(() => engine.getView(), [engine])
  const camera = useMemo(() => engine.getCamera(), [engine])
  const renderer = useMemo(() => engine.createRenderer(), [engine])
  const nameComponentManager = useMemo(() => engine.createNameComponentManager(), [engine])

  const value = useMemo<FilamentContextType>(
    () => ({
      engine,
      transformManager,
      renderableManager,
      scene,
      lightManager,
      view,
      camera,
      renderer,
      nameComponentManager,
      workletContext: FilamentWorkletContext,
      _choreographer: choreographer,
    }),
    [engine, transformManager, renderableManager, scene, lightManager, view, camera, renderer, nameComponentManager, choreographer]
  )

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
  useEffect(() => {
    if (ambientOcclusionOptions != null) {
      const options = makeAmbientOcclusionHostObject(view, ambientOcclusionOptions)
      view.setAmbientOcclusionOptions(options)
    }
    if (dynamicResolutionOptions != null) {
      const options = makeDynamicResolutionHostObject(view, dynamicResolutionOptions)
      view.setDynamicResolutionOptions(options)
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

  // Cleanup:
  // The cleanup phase is one of the reasons behind putting everything beneath a context.
  // This way, we know we will call our cleanup on e.g. "view" and "engine" only once all children (hooks)
  // are done running their cleanup. A child (hook) might try to call scene.removeAsset() which would fail
  // if we'd already released the scene.
  useEffect(() => {
    return withCleanupScope(() => {
      FilamentWorkletContext.runAsync(() => {
        'worklet'

        nameComponentManager.release()
        camera.release()
        view.release()
        scene.release()
        renderer.release()
        lightManager.release()
        renderableManager.release()
        transformManager.release()
        engine.release()
      })
    })
  }, [camera, engine, lightManager, nameComponentManager, renderableManager, renderer, scene, transformManager, view])

  return <FilamentContext.Provider value={value}>{children}</FilamentContext.Provider>
}

export type FilamentProviderProps = PropsWithChildren<
  Omit<EngineProps, 'context'> &
    ViewProps &
    RendererProps & {
      fallback?: React.ReactElement
    }
>

/**
 * Context provider that contains all APIs.
 *
 * @private
 */
export function FilamentProvider({ children, fallback, config, backend, frameRateOptions, ...viewProps }: FilamentProviderProps) {
  const engine = useEngine({ config, backend, context: FilamentWorkletContext })
  const rendererProps = useMemo(() => ({ frameRateOptions }), [frameRateOptions])
  const choreographer = useDisposableResource(
    useWorklet(FilamentWorkletContext, () => {
      'worklet'
      return FilamentProxy.createChoreographer()
    })
  )

  if (engine == null || choreographer == null) return fallback ?? null
  return (
    <EngineAPIProvider engine={engine} choreographer={choreographer} viewProps={viewProps} rendererProps={rendererProps}>
      {children}
    </EngineAPIProvider>
  )
}

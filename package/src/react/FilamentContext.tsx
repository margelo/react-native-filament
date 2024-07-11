import { PropsWithChildren, useMemo } from 'react'
import { FilamentProxy, FilamentWorkletContext } from '../native/FilamentProxy'
import { EngineProps, useEngine } from '../hooks/useEngine'
import { useDisposableResource } from '../hooks/useDisposableResource'
import { useWorklet } from 'react-native-worklets-core'
import React from 'react'
import { Configurator, RendererConfigProps, ViewConfigProps } from './Configurator'
import { Context, FilamentContextType } from '../hooks/useFilamentContext'
import { RenderCallbackContext } from './RenderCallbackContext'

export type FilamentProviderProps = PropsWithChildren<
  Omit<EngineProps, 'context'> &
    ViewConfigProps &
    RendererConfigProps & {
      fallback?: React.ReactElement
    }
>

/**
 * Creates an engine and all filament APIs and provides them to the children using the react context.
 *
 * @note You only need this for doing offscreen recording. For an on-screen surface use the `Filament` component.
 */
export function FilamentContext({ children, fallback, config, backend, frameRateOptions, ...viewProps }: FilamentProviderProps) {
  // First create the engine, which we need to create (almost) all other filament APIs
  const engine = useEngine({ config, backend, context: FilamentWorkletContext })

  // Create all Filament APIs using the engine
  const transformManager = useDisposableResource(() => Promise.resolve(engine?.createTransformManager()), [engine])
  const renderableManager = useDisposableResource(() => Promise.resolve(engine?.createRenderableManager()), [engine])
  const scene = useDisposableResource(() => Promise.resolve(engine?.getScene()), [engine])
  const lightManager = useDisposableResource(() => Promise.resolve(engine?.createLightManager()), [engine])
  const view = useDisposableResource(() => Promise.resolve(engine?.getView()), [engine])
  const camera = useDisposableResource(() => Promise.resolve(engine?.getCamera()), [engine])
  const renderer = useDisposableResource(() => Promise.resolve(engine?.createRenderer()), [engine])
  const nameComponentManager = useDisposableResource(() => Promise.resolve(engine?.createNameComponentManager()), [engine])

  // Create a choreographer for this context tree
  const choreographer = useDisposableResource(
    useWorklet(FilamentWorkletContext, () => {
      'worklet'
      return FilamentProxy.createChoreographer()
    })
  )

  // Construct the context object value:
  const value = useMemo<FilamentContextType | undefined>(() => {
    if (
      transformManager == null ||
      renderableManager == null ||
      scene == null ||
      lightManager == null ||
      view == null ||
      camera == null ||
      renderer == null ||
      nameComponentManager == null ||
      choreographer == null ||
      engine == null
    ) {
      return undefined
    }

    return {
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
      choreographer: choreographer,
    }
  }, [engine, transformManager, renderableManager, scene, lightManager, view, camera, renderer, nameComponentManager, choreographer])

  const rendererProps = useMemo(() => ({ frameRateOptions }), [frameRateOptions])

  // If the APIs aren't ready yet render the fallback component (or nothing)
  if (value == null) return fallback ?? null
  return (
    <Context.Provider value={value}>
      <Configurator rendererProps={rendererProps} viewProps={viewProps}>
        <RenderCallbackContext.RenderContextProvider>{children}</RenderCallbackContext.RenderContextProvider>
      </Configurator>
    </Context.Provider>
  )
}

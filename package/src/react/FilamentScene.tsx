import { PropsWithChildren, useMemo } from 'react'
import { FilamentProxy, FilamentWorkletContext } from '../native/FilamentProxy'
import { EngineProps, useEngine } from '../hooks/useEngine'
import { useDisposableResource } from '../hooks/useDisposableResource'
import { useWorklet } from 'react-native-worklets-core'
import React from 'react'
import { Configurator, RendererConfigProps, ViewConfigProps } from './Configurator'
import { FilamentContext, FilamentContextType } from '../hooks/useFilamentContext'
import { RenderCallbackContext } from './RenderCallbackContext'

export type FilamentProviderProps = PropsWithChildren<
  Omit<EngineProps, 'context'> &
    ViewConfigProps &
    RendererConfigProps & {
      fallback?: React.ReactElement
    }
>

/**
 * The `<FilamentScene>` holds contextual values for a Filament rendering scene.
 *
 * You need to wrap your rendering scene (= a component that uses `<FilamentView>`, hooks or
 * other Filament components) with a `<FilamentScene>`.
 *
 * @note Make sure to wrap your scene in a parent component, otherwise the React context cannot be inferred.
 * @example
 * ```tsx
 * function Scene() {
 *   // in here you can use Filament's hooks and components
 *   return (
 *    <FilamentView style={styles.container}>
 *      <DefaultLight />
 *      <Model source={{ uri: modelPath }} />
 *    </FilamentView>
 *  )
 * }
 *
 * export function RocketModel() {
 *   // in here you only need to wrap the child-component with <FilamentScene>
 *   return (
 *     <FilamentScene>
 *       <Scene />
 *     </FilamentScene>
 *   )
 * }
 * ```
 */
export function FilamentScene({ children, fallback, config, backend, frameRateOptions, ...viewProps }: FilamentProviderProps) {
  // First create the engine, which we need to create (almost) all other filament APIs
  const engine = useEngine({ config, backend, context: FilamentWorkletContext })
  console.log('engine', engine)

  // Create all Filament APIs using the engine
  const transformManager = useDisposableResource(() => Promise.resolve(engine?.unbox().createTransformManager()), [engine])
  const renderableManager = useDisposableResource(() => Promise.resolve(engine?.unbox().createRenderableManager()), [engine])
  const scene = useDisposableResource(() => Promise.resolve(engine?.unbox().getScene()), [engine])
  const lightManager = useDisposableResource(() => Promise.resolve(engine?.unbox().createLightManager()), [engine])
  const view = useDisposableResource(() => Promise.resolve(engine?.unbox().getView()), [engine])
  const camera = useDisposableResource(() => Promise.resolve(engine?.unbox().getCamera()), [engine])
  const renderer = useDisposableResource(() => Promise.resolve(engine?.unbox().createRenderer()), [engine])
  const nameComponentManager = useDisposableResource(() => Promise.resolve(engine?.unbox().createNameComponentManager()), [engine])

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
    <FilamentContext.Provider value={value}>
      <Configurator rendererProps={rendererProps} viewProps={viewProps}>
        <RenderCallbackContext.RenderContextProvider>{children}</RenderCallbackContext.RenderContextProvider>
      </Configurator>
    </FilamentContext.Provider>
  )
}

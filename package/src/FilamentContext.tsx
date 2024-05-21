import React, { PropsWithChildren, useEffect, useMemo } from 'react'
import {
  AmbientOcclusionOptions,
  Camera,
  CameraManipulator,
  Choreographer,
  DynamicResolutionOptions,
  Engine,
  FrameRateOptions,
  LightManager,
  NameComponentManager,
  RenderableManager,
  Renderer,
  Scene,
  TemporalAntiAliasingOptions,
  TransformManager,
  View,
  optionsToJSI,
} from './types'
import { EngineProps, useEngine } from './hooks/useEngine'
import { IWorkletContext, useWorklet } from 'react-native-worklets-core'
import { FilamentProxy, FilamentWorkletContext } from './native/FilamentProxy'
import { InteractionManager } from 'react-native'
import { makeDynamicResolutionHostObject } from './utilities/makeDynamicResolutionHostObject'
import { makeAmbientOcclusionHostObject } from './utilities/makeAmbientOcclusionHostObject'
import { useDisposableResource } from './hooks/useDisposableResource'

export type FilamentContextType = {
  engine: Engine
  transformManager: TransformManager
  renderableManager: RenderableManager
  scene: Scene
  lightManager: LightManager
  view: View
  camera: Camera
  renderer: Renderer
  nameComponentManager: NameComponentManager
  workletContext: IWorkletContext
  cameraManipulator: CameraManipulator

  // TODO: put this in an "internal" separate context?
  /**
   * @private
   */
  _choreographer: Choreographer
}
export const FilamentContext = React.createContext<FilamentContextType | undefined>(undefined)

export function useFilamentContext() {
  const context = React.useContext(FilamentContext)
  if (context === undefined) {
    throw new Error(
      'useFilamentContext (and its hooks such as `useScene()`, components like `<Filament />` etc.) must be used within a `<FilamentProvider>` component!'
    )
  }
  return context
}
export function FilamentConsumer({ children }: { children: (value: FilamentContextType) => React.ReactNode }) {
  const context = useFilamentContext()

  return <FilamentContext.Consumer>{() => children(context)}</FilamentContext.Consumer>
}

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
  const cameraManipulator = useMemo(() => engine.createCameraManipulator(), [engine])

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
      cameraManipulator,
      workletContext: FilamentWorkletContext,
      _choreographer: choreographer,
    }),
    [
      engine,
      transformManager,
      renderableManager,
      scene,
      lightManager,
      view,
      camera,
      renderer,
      nameComponentManager,
      cameraManipulator,
      choreographer,
    ]
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
    return () => {
      // runAfterInteractions to make sure its called after all children have run their cleanup and all interactions are done
      InteractionManager.runAfterInteractions(() => {
        setTimeout(() => {
          // Cleanup in worklets context, as cleanup functions might also use the worklet context
          // and we want to queue our cleanup after all other worklets have run
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
            cameraManipulator.release()
            engine.release()
          })
        }, 0)
      })
    }
  }, [camera, cameraManipulator, engine, lightManager, nameComponentManager, renderableManager, renderer, scene, transformManager, view])

  return <FilamentContext.Provider value={value}>{children}</FilamentContext.Provider>
}

type FilamentProviderProps = PropsWithChildren<
  Omit<EngineProps, 'context'> &
    ViewProps &
    RendererProps & {
      fallback?: React.ReactElement
    }
>

/**
 * Context provider that contains all APIs.
 * You need to wrap your <Filament /> view with this provider.
 *
 * @example
 *
 * ```tsx
 * <FilamentProvider>
 *  <Filament>
 *  <YourScene /> // <- useFilamentContext() can be used here
 * </FilamentProvider>
 * ```
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

import React, { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { GestureResponderEvent, ViewProps } from 'react-native'
import { callback } from 'react-native-nitro-modules'
import { useDisposableResource } from '../hooks/useDisposableResource'
import type { FilamentView as NativeView } from '../specs/targets/FilamentView.nitro'
import type { ViewTarget } from '../specs/targets/ViewTarget.nitro'
import type { ClearOptions } from '../specs/types/ClearOptions'
import type { FrameInfo } from '../specs/types/FrameInfo'
import type { PickResult } from '../specs/types/PickResult'
import { NativeFilamentView } from '../views/NativeFilamentView'
import { useFilamentScene } from './useFilamentScene'
import { FilamentViewContext, type FilamentViewValue } from './FilamentViewContext'
import { useRenderCommit } from './useRenderCommit'
import { useReportFailure } from './useReportFailure'
import type { ViewOptions } from './ViewOptions'

export interface FilamentViewProps extends ViewProps, ViewOptions {
  /**
   * Composites with the views behind it. Uses a `TextureView` on Android.
   * @default false
   */
  transparent?: boolean
  /** How the view is cleared before each frame. */
  clearOptions?: ClearOptions
  /**
   * A worklet called on the render thread at the start of every frame. Keeps the Engine rendering in
   * `on-demand` mode while set.
   */
  renderCallback?: (frame: FrameInfo) => void
  /** Called once after the view shows its first frame. */
  onFirstFrame?: () => void
  /**
   * Highest rate in frames per second the view renders at. Frame listeners and native systems still
   * run on every frame of the Engine. @default every display refresh
   */
  targetFrameRate?: number
  children?: ReactNode
}

type ViewDefaults = Required<
  Pick<ViewOptions, 'antiAliasing' | 'dithering' | 'postProcessing' | 'shadowing' | 'shadowType' | 'screenSpaceRefraction'>
>

interface Bound {
  target: ViewTarget
  defaults: ViewDefaults
  dispose(): void
}

/**
 * Shows the scene of the closest `FilamentScene` through its camera. The Filament components inside
 * it may use the view, for example `Camera` for its aspect ratio and `Model` for `onPress`.
 */
export function FilamentView({
  transparent = false,
  clearOptions,
  renderCallback,
  onFirstFrame,
  targetFrameRate = 0,
  children,
  antiAliasing,
  dithering,
  postProcessing,
  shadowing,
  shadowType,
  screenSpaceRefraction,
  ambientOcclusionOptions,
  bloomOptions,
  temporalAntiAliasingOptions,
  dynamicResolutionOptions,
  onTouchStart,
  ...viewProps
}: FilamentViewProps) {
  const { engine, scene, camera } = useFilamentScene()
  const commit = useRenderCommit()
  const fail = useReportFailure()
  const [nativeView, setNativeView] = useState<NativeView>()
  const hybridRef = useMemo(() => callback(setNativeView), [])

  const bound = useDisposableResource<Bound>(async () => {
    if (nativeView == null) return undefined
    const target = await engine.createViewTarget(nativeView, {})
    try {
      const defaults = await commit.run((): ViewDefaults => {
        'worklet'
        target.setScene(scene)
        target.setCamera(camera)
        const { view } = target
        return {
          antiAliasing: view.antiAliasing,
          dithering: view.dithering,
          postProcessing: view.postProcessing,
          shadowing: view.shadowing,
          shadowType: view.shadowType,
          screenSpaceRefraction: view.screenSpaceRefraction,
        }
      })
      return { target, defaults, dispose: () => target.dispose() }
    } catch (error) {
      target.dispose()
      throw error
    }
  }, [engine, scene, camera, nativeView, commit])
  const target = bound?.target

  const options = {
    antiAliasing,
    dithering,
    postProcessing,
    shadowing,
    shadowType,
    screenSpaceRefraction,
    ambientOcclusionOptions,
    bloomOptions,
    temporalAntiAliasingOptions,
    dynamicResolutionOptions,
  }
  const optionsKey = JSON.stringify(options)
  useEffect(() => {
    if (bound == null) return
    const { view } = bound.target
    const applied = { ...bound.defaults, ...JSON.parse(optionsKey) } as ViewDefaults & ViewOptions
    commit
      .run(() => {
        'worklet'
        view.antiAliasing = applied.antiAliasing
        view.dithering = applied.dithering
        view.postProcessing = applied.postProcessing
        view.shadowing = applied.shadowing
        view.shadowType = applied.shadowType
        view.screenSpaceRefraction = applied.screenSpaceRefraction
        view.setAmbientOcclusionOptions(applied.ambientOcclusionOptions ?? {})
        view.setBloomOptions(applied.bloomOptions ?? {})
        view.setTemporalAntiAliasingOptions(applied.temporalAntiAliasingOptions ?? {})
        view.setDynamicResolutionOptions(applied.dynamicResolutionOptions ?? {})
      })
      .catch(fail)
  }, [bound, optionsKey, commit, fail])

  const clearKey = JSON.stringify(clearOptions ?? {})
  useEffect(() => {
    if (target == null) return
    const applied = JSON.parse(clearKey) as ClearOptions
    commit
      .run(() => {
        'worklet'
        target.setClearOptions(applied)
      })
      .catch(fail)
  }, [target, clearKey, commit, fail])

  useEffect(() => {
    if (target != null) target.targetFrameRate = targetFrameRate
  }, [target, targetFrameRate])

  useEffect(() => {
    if (renderCallback == null) return
    const subscribed = commit.run(() => {
      'worklet'
      return engine.addOnFrameListener((frame) => {
        renderCallback(frame)
        return true
      })
    })
    subscribed.catch(fail)
    return () => {
      subscribed.then(
        (subscription) => subscription.remove(),
        () => undefined
      )
    }
  }, [engine, renderCallback, commit, fail])

  const latestOnFirstFrame = useRef(onFirstFrame)
  useEffect(() => {
    latestOnFirstFrame.current = onFirstFrame
  }, [onFirstFrame])
  useEffect(() => {
    if (target == null) return
    const subscription = target.addOnFirstFrameListener(() => latestOnFirstFrame.current?.())
    return () => subscription.remove()
  }, [target])

  const pressHandlers = useRef(new Set<(result: PickResult) => void>())
  const addPressHandler = useCallback((handler: (result: PickResult) => void) => {
    pressHandlers.current.add(handler)
    return () => {
      pressHandlers.current.delete(handler)
    }
  }, [])
  const handleTouchStart = (event: GestureResponderEvent) => {
    onTouchStart?.(event)
    if (target == null || pressHandlers.current.size === 0) return
    const { locationX, locationY } = event.nativeEvent
    target.pick(locationX, locationY).then(
      (result) => {
        if (result == null) return
        pressHandlers.current.forEach((handler) => handler(result))
      },
      () => undefined
    )
  }

  const value = useMemo<FilamentViewValue | undefined>(
    () => (target == null ? undefined : { target, view: target.view, addPressHandler }),
    [target, addPressHandler]
  )

  return (
    <FilamentViewContext.Provider value={value}>
      <NativeFilamentView {...viewProps} transparent={transparent} hybridRef={hybridRef} onTouchStart={handleTouchStart} />
      {children}
    </FilamentViewContext.Provider>
  )
}

/** The native view a `ViewTarget` renders into, as `NativeFilamentView` passes it to `hybridRef`. */
export type FilamentView = NativeView

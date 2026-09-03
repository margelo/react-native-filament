import React, { createContext, DependencyList, PropsWithChildren, useCallback, useContext, useEffect, useMemo } from 'react'
import { scheduleOnRuntime } from 'react-native-worklets'
import { RenderCallback } from 'react-native-filament'
import { useFilamentContext } from '../hooks/useFilamentContext'

declare global {
  var __rnfRenderCallbacks: Record<number, Record<number, RenderCallback>> | undefined
}

let nextContextId = 0
let nextCallbackId = 0

/**
 * In react-native-filament we can only have one render callback, which we provide to the FilamentView.
 * This context allows us to have multiple render callbacks, as we call them in the render callback.
 *
 * The callbacks are kept in a registry on the Filament runtime, keyed by context and callback id.
 * Adding and removing are jobs on the Filament runtime, so they are ordered with everything else
 * scheduled there (like releasing the resources a callback uses).
 */
export type RenderContextType = {
  /**
   * The id of this context's entry in the render callback registry on the Filament runtime.
   */
  contextId: number
  addRenderCallback: (callback: RenderCallback) => () => void
}

export const makeRenderContext = () => {
  const RenderContext = createContext<RenderContextType>({
    contextId: -1,
    addRenderCallback: () => {
      throw new Error('RenderContextProvider not found')
    },
  })

  const RenderContextProvider = ({ children }: PropsWithChildren) => {
    const { workletRuntime } = useFilamentContext()
    const contextId = useMemo(() => nextContextId++, [])

    useEffect(() => {
      return () => {
        scheduleOnRuntime(
          workletRuntime,
          (id: number) => {
            'worklet'
            delete globalThis.__rnfRenderCallbacks?.[id]
          },
          contextId
        )
      }
    }, [contextId, workletRuntime])

    const addRenderCallback = useCallback(
      (callback: RenderCallback) => {
        const callbackId = nextCallbackId++
        scheduleOnRuntime(
          workletRuntime,
          (ctxId: number, id: number, renderCallback: RenderCallback) => {
            'worklet'
            const registry = (globalThis.__rnfRenderCallbacks ??= {})
            const callbacks = (registry[ctxId] ??= {})
            callbacks[id] = renderCallback
          },
          contextId,
          callbackId,
          callback
        )
        return () => {
          scheduleOnRuntime(
            workletRuntime,
            (ctxId: number, id: number) => {
              'worklet'
              delete globalThis.__rnfRenderCallbacks?.[ctxId]?.[id]
            },
            contextId,
            callbackId
          )
        }
      },
      [contextId, workletRuntime]
    )

    const contextValue = useMemo<RenderContextType>(() => ({ contextId, addRenderCallback }), [addRenderCallback, contextId])

    return <RenderContext.Provider value={contextValue}>{children}</RenderContext.Provider>
  }

  const useRenderContext = () => {
    const context = useContext(RenderContext)

    if (!context) {
      throw new Error('useRenderContext must be used within a RenderContextProvider')
    }

    return context
  }

  /**
   * Use this method to add render callbacks to the render callback chain.
   */
  const useRenderCallback = (callback: RenderCallback, deps: DependencyList) => {
    const { addRenderCallback } = useRenderContext()

    useEffect(() => {
      const remove = addRenderCallback(callback)

      return () => {
        remove()
      }
      // Explicitly skip the callback, we memoize by the provided dependencies
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...deps, addRenderCallback])

    return callback
  }

  /**
   * Calls every render callback registered in this context. Call it from the render callback
   * of the FilamentView. For the default exported context this happens automatically.
   */
  const runRenderCallbacks = (contextId: number, frameInfo: Parameters<RenderCallback>[0]) => {
    'worklet'
    const callbacks = globalThis.__rnfRenderCallbacks?.[contextId]
    if (callbacks == null) return
    for (const id in callbacks) {
      callbacks[id]?.(frameInfo)
    }
  }

  return { useRenderContext, RenderContextProvider, useRenderCallback, runRenderCallbacks }
}

export const RenderCallbackContext = makeRenderContext()

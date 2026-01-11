import React, { createContext, DependencyList, PropsWithChildren, useCallback, useContext, useEffect, useMemo } from 'react'
import { RenderCallback } from 'react-native-filament'
import { SharedValue, useSharedValue } from 'react-native-reanimated'

type RenderCallbackList = {
  callback: RenderCallback
  id: string
}[]

/**
 * In react-native-filament we can only have one render callback, which we provide to the FilamentView.
 * This context allows us to have multiple render callbacks, as we call them in the render callback.
 */
export type RenderContextType = {
  renderCallbacks: SharedValue<RenderCallbackList>
  addRenderCallback: (callback: RenderCallback) => () => void
}

export const makeRenderContext = () => {
  const RenderContext = createContext<RenderContextType>(null!)

  const RenderContextProvider = ({ children }: PropsWithChildren) => {
    const renderCallbacks = useSharedValue<RenderCallbackList>([])
    const addRenderCallback = useCallback(
      (callback: RenderCallback) => {
        const id = Math.random().toString(36).substring(7)
        const entry = { callback, id }
        renderCallbacks.set((prev) => [...prev, entry])
        return () => {
          renderCallbacks.set((prev) => prev.filter((e) => e.id !== id))
        }
      },
      [renderCallbacks]
    )

    const contextValue = useMemo<RenderContextType>(
      () => ({
        renderCallbacks,
        addRenderCallback,
      }),
      [addRenderCallback, renderCallbacks]
    )

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
   * This should be called in the render callback of the FilamentView.
   * For the default exported context this happens automatically.
   */
  const useRenderCallbacks = () => {
    const renderContext = useRenderContext()
    return renderContext.renderCallbacks
  }

  return { useRenderContext, RenderContextProvider, useRenderCallback, useRenderCallbacks }
}

export const RenderCallbackContext = makeRenderContext()

import React, { createContext, DependencyList, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { RenderCallback } from 'react-native-filament'

type RenderCallbackList = {
  callback: RenderCallback
  id: string
}[]

/**
 * In react-native-filament we can only have one render callback, which we provide to the FilamentView.
 * This context allows us to have multiple render callbacks, as we call them in the render callback.
 */
export type RenderContextType = {
  /**
   * The registered render callbacks. A new array is created whenever a callback gets added or removed,
   * which makes the FilamentView install a new frame listener with the current list.
   */
  renderCallbacks: RenderCallbackList
  addRenderCallback: (callback: RenderCallback) => () => void
}

export const makeRenderContext = () => {
  const RenderContext = createContext<RenderContextType>({
    renderCallbacks: [],
    addRenderCallback: () => {
      throw new Error('RenderContextProvider not found')
    },
  })

  const RenderContextProvider = ({ children }: PropsWithChildren) => {
    const [renderCallbacks, setRenderCallbacks] = useState<RenderCallbackList>([])
    const addRenderCallback = useCallback((callback: RenderCallback) => {
      const entry = { callback, id: Math.random().toString(36).substring(7) }
      setRenderCallbacks((list) => [...list, entry])
      return () => {
        setRenderCallbacks((list) => list.filter((e) => e !== entry))
      }
    }, [])

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

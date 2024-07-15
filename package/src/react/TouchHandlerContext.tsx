import React from 'react'
import { ViewProps } from 'react-native'

type Handler = Required<ViewProps>['onTouchStart']

let touchHandlers: Record<number, Handler> = {}
let id = 0

/**
 * Internal context for holding touch handlers which will be invoked on the FilamentView.
 * @private
 */
export const TouchHandlerContext = React.createContext({
  touchHandlers,
  addTouchHandler: (handler: Handler) => {
    const handlerId = id++
    touchHandlers[handlerId] = handler
    return () => {
      delete touchHandlers[handlerId]
    }
  },
})

export const getTouchHandlers = () => touchHandlers

import { useEffect, useRef } from 'react'
import { getWorkletDependencies, ISharedValue, IWorklet, IWorkletContext, Worklets } from 'react-native-worklets-core'
import { isWorkletSharedValue } from '../utilities/helper'
import { useFilamentContext } from './useFilamentContext'

export interface DerivedValue<Value = unknown> extends Readonly<ISharedValue<Value>> {}

export type DependencyList = Array<unknown> | undefined

// @ts-expect-error
export function useDerivedValue<Value>(
  updater: () => Value,
  dependencies?: DependencyList,
  workletContext?: IWorkletContext
): DerivedValue<Value>

export function useDerivedValue<Value>(
  updater: IWorklet<Function>,
  dependencies?: DependencyList
  //   workletContext = Worklets.defaultContext
): DerivedValue<Value> {
  const initRef = useRef<ISharedValue<Value> | null>(null)
  const inputs = getWorkletDependencies(updater)

  // build dependencies
  if (dependencies === undefined) {
    dependencies = [...inputs, updater.__workletHash]
  } else {
    dependencies.push(updater.__workletHash)
  }

  if (initRef.current == null) {
    initRef.current = Worklets.createSharedValue(updater())
  }

  const sharedValue: ISharedValue<Value> = initRef.current
  const { workletContext } = useFilamentContext()

  useEffect(() => {
    const id = Math.floor(Math.random() * 1000000)

    const fun = workletContext.createRunAsync(() => {
      'worklet'
      sharedValue.value = updater()
    })

    // Find all shared values from the closure and add listeners to them
    // Note: this might cause the listener to be called multiple times if multiple values change in the same tick
    workletContext.runAsync(() => {
      'worklet'

      if (global.__listenerRegistry == null) {
        global.__listenerRegistry = {}
      }
      global.__listenerRegistry[id] = []
      for (const input of inputs) {
        if (!isWorkletSharedValue(input)) {
          return
        }

        const removeListener = input.addListener(fun)
        global.__listenerRegistry[id]?.push(removeListener)
      }
    })

    return () => {
      workletContext.runAsync(() => {
        'worklet'
        console.log('Removing derived value listeners for id: ' + id)
        if (global.__listenerRegistry == null || global.__listenerRegistry[id] == null) {
          return
        }
        global.__listenerRegistry[id]?.forEach((removeListener) => {
          removeListener()
          console.log('Removing listener from input: ' + id)
        })
        delete global.__listenerRegistry[id]
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies)

  return sharedValue
}

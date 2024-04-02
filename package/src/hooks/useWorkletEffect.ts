import { useEffect } from 'react'
import { FilamentProxy } from '../native/FilamentProxy'

const context = FilamentProxy.getWorkletContext()

export function useWorkletEffect(workletFunction: (...args: any[]) => void, deps: any[] = []) {
  useEffect(() => {
    Worklets.createRunInContextFn(workletFunction, context)()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

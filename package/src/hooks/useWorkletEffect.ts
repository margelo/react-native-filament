import { useEffect, useMemo } from 'react'
import { FilamentProxy } from '../native/FilamentProxy'

export function useWorkletEffect(workletFunction: (...args: any[]) => void, deps: any[] = []) {
  const context = useMemo(() => FilamentProxy.getWorkletContext(), [])

  useEffect(() => {
    Worklets.createRunInContextFn(workletFunction, context)()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

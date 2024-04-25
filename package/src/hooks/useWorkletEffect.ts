import { useEffect } from 'react'
import { useFilamentContext } from '../FilamentContext'

export function useWorkletEffect(workletFunction: (...args: any[]) => void, deps: any[] = []) {
  const { _workletContext } = useFilamentContext()

  useEffect(() => {
    _workletContext.runAsync(workletFunction)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

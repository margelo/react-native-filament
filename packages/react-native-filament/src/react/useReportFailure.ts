import { useCallback, useState } from 'react'

/** Rethrows an asynchronous failure during the next render, so the closest error boundary receives it. */
export function useReportFailure(): (error: unknown) => void {
  const [, setFailure] = useState<never>()
  return useCallback((error: unknown) => {
    setFailure(() => {
      throw error
    })
  }, [])
}

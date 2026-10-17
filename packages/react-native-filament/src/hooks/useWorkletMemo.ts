import { useEffect, useState } from 'react'
import { useFilamentContext } from './useFilamentContext'
import { wrapWithErrorHandler } from '../ErrorUtils'

export function useWorkletMemo<T>(workletFunction: () => T, dependencies: any[]): T | undefined {
  const { workletContext } = useFilamentContext()
  const [value, setValue] = useState<T | undefined>(undefined)

  useEffect(
    () => {
      async function loadAsync() {
        const result = await workletContext.runAsync(wrapWithErrorHandler(workletFunction))
        setValue(result)
      }

      loadAsync()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    dependencies
  )

  return value
}

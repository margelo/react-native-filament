import { useEffect, useState } from 'react'
import { runOnRuntimeAsync } from 'react-native-worklets'
import { useFilamentContext } from './useFilamentContext'
import { wrapWithErrorHandler } from '../ErrorUtils'

export function useWorkletMemo<T>(workletFunction: () => T, dependencies: any[]): T | undefined {
  const { workletRuntime } = useFilamentContext()
  const [value, setValue] = useState<T | undefined>(undefined)

  useEffect(
    () => {
      async function loadAsync() {
        const result = await runOnRuntimeAsync(workletRuntime, wrapWithErrorHandler(workletFunction))
        setValue(result)
      }

      loadAsync()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    dependencies
  )

  return value
}

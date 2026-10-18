import { useEffect, useState, type DependencyList } from 'react'
import { useReportFailure } from '../react/useReportFailure'

interface Disposable {
  dispose(): void
}

function startCreating<T>(create: () => Promise<T> | T): Promise<T> {
  try {
    return Promise.resolve(create())
  } catch (error) {
    return Promise.reject(error)
  }
}

/**
 * Creates a native object whenever `deps` change and disposes it when they change again or the
 * component unmounts, including an object whose creation finishes after that. A failed creation is
 * thrown to the closest error boundary.
 */
export function useDisposableResource<T extends Disposable>(
  create: () => Promise<T | undefined> | T | undefined,
  deps: DependencyList
): T | undefined {
  const [resource, setResource] = useState<T>()
  const fail = useReportFailure()
  useEffect(() => {
    let active = true
    const created = startCreating(create)
    created.then(
      (value) => {
        if (active) setResource(value)
      },
      (error: unknown) => {
        if (active) fail(error)
      }
    )
    return () => {
      active = false
      setResource(undefined)
      created.then(
        (value) => value?.dispose(),
        () => undefined
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return resource
}

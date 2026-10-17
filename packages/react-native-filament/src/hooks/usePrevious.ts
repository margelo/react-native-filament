import { useEffect, useRef } from 'react'

/**
 * A hook that returns the previous value of a variable
 */
export default function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined)
  useEffect(() => {
    ref.current = value
  }, [value])
  return ref.current
}

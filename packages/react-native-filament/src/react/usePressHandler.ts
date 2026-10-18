import { useContext, useEffect, useRef } from 'react'
import type { Entity } from '../specs/types/Entity'
import { FilamentViewContext } from './FilamentViewContext'

/** Calls `onPress` when a press on the closest `FilamentView` hits one of `entities`. */
export function usePressHandler(entities: Entity[], onPress: ((entity: Entity, entities: Entity[]) => void) | undefined): void {
  const view = useContext(FilamentViewContext)
  const latest = useRef(onPress)
  useEffect(() => {
    latest.current = onPress
  }, [onPress])
  const listens = onPress != null
  useEffect(() => {
    if (view == null || !listens) return
    const members = new Set(entities)
    return view.addPressHandler(({ entity }) => {
      if (members.has(entity)) latest.current?.(entity, entities)
    })
  }, [view, entities, listens])
}

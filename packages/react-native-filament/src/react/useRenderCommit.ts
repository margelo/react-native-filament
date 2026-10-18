import { useContext } from 'react'
import { RenderCommitContext } from './RenderCommitContext'
import type { RenderCommit } from './RenderCommit'

export function useRenderCommit(): RenderCommit {
  const commit = useContext(RenderCommitContext)
  if (commit == null) {
    throw new Error('Filament hooks and components must be used inside a <FilamentScene>.')
  }
  return commit
}

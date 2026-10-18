import { createContext } from 'react'
import type { RenderCommit } from './RenderCommit'

export const RenderCommitContext = createContext<RenderCommit | undefined>(undefined)

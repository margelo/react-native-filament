import type { DependencyList } from 'react'
import type { Recorder } from '../specs/targets/Recorder.nitro'
import type { FrameInfo } from '../specs/types/FrameInfo'
import { useFrameCallback } from './useFrameCallback'

/**
 * Calls the worklet `render` on the render thread before every frame, including each frame `recorder`
 * records, where `frame.elapsedSeconds` advances by exactly `1 / fps`.
 */
export function useRecorderRenderLoop(recorder: Recorder | undefined, render: (frame: FrameInfo) => void, deps: DependencyList): void {
  useFrameCallback(render, [recorder, ...deps])
}

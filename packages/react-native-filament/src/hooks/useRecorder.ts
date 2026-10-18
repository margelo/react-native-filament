import { useFilamentScene } from '../react/useFilamentScene'
import { useRenderCommit } from '../react/useRenderCommit'
import type { Recorder } from '../specs/targets/Recorder.nitro'
import type { RecorderOptions } from '../specs/types/RecorderOptions'
import { useDisposableResource } from './useDisposableResource'

/**
 * An offscreen MP4 recorder of the scene of the closest `FilamentScene`, through its camera. Views of
 * the Engine pause while it records.
 */
export function useRecorder(options: RecorderOptions): Recorder | undefined {
  const { engine, scene, camera } = useFilamentScene()
  const commit = useRenderCommit()
  const key = JSON.stringify(options)
  return useDisposableResource(() => {
    const resolved = JSON.parse(key) as RecorderOptions
    return commit.run(() => {
      'worklet'
      const recorder = engine.createRecorder(resolved)
      recorder.setScene(scene)
      recorder.setCamera(camera)
      return recorder
    })
  }, [engine, scene, camera, commit, key])
}

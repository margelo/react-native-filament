import { useEffect } from 'react'
import type { AssetLike } from '../assets/AssetLike'
import { assetKey } from '../assets/assetKey'
import { toAssetSource } from '../assets/toAssetSource'
import { useFilamentScene } from '../react/useFilamentScene'
import { useRenderCommit } from '../react/useRenderCommit'
import { useReportFailure } from '../react/useReportFailure'
import type { IndirectLight } from '../specs/scene/IndirectLight.nitro'
import { useDisposableResource } from './useDisposableResource'

/**
 * Loads image-based lighting from a KTX1 cubemap and lights the scene with it while mounted.
 * @param intensity Brightness in lux; `undefined` uses 30,000. Changing it reloads the KTX file, and the
 * scene has no image-based lighting until the reload finishes.
 */
export function useIndirectLight(source: AssetLike, intensity: number | undefined): IndirectLight | undefined {
  const { engine, scene } = useFilamentScene()
  const commit = useRenderCommit()
  const fail = useReportFailure()
  const key = assetKey(source)
  const light = useDisposableResource(() => engine.loadIndirectLight(toAssetSource(source), { intensity }), [engine, key, intensity])
  useEffect(() => {
    if (light == null) return
    commit
      .run(() => {
        'worklet'
        scene.setIndirectLight(light)
      })
      .catch(fail)
    return () => {
      commit.post(() => {
        'worklet'
        scene.setIndirectLight(undefined)
      })
    }
  }, [light, scene, commit, fail])
  return light
}

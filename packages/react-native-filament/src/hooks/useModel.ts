import { useEffect, useMemo } from 'react'
import type { AssetLike } from '../assets/AssetLike'
import { assetKey } from '../assets/assetKey'
import { toAssetSource } from '../assets/toAssetSource'
import { useFilamentScene } from '../react/useFilamentScene'
import { useRenderCommit } from '../react/useRenderCommit'
import { useReportFailure } from '../react/useReportFailure'
import type { FilamentModel } from './FilamentModel'
import type { UseModelOptions } from './UseModelOptions'
import { useDisposableResource } from './useDisposableResource'

/**
 * Loads a glTF binary (`.glb`) and disposes it on unmount. For `require()`d models, add `glb` to
 * Metro's `assetExts`.
 */
export function useModel(source: AssetLike, { instanceCount, addToScene = true }: UseModelOptions = {}): FilamentModel {
  const { engine, scene } = useFilamentScene()
  const commit = useRenderCommit()
  const fail = useReportFailure()
  const key = assetKey(source)
  const model = useDisposableResource(() => engine.loadModel(toAssetSource(source), { instanceCount }), [engine, key, instanceCount])

  useEffect(() => {
    if (model == null || !addToScene) return
    commit
      .run(() => {
        'worklet'
        scene.addModel(model)
      })
      .catch(fail)
    return () => {
      commit.post(() => {
        'worklet'
        scene.removeModel(model)
      })
    }
  }, [model, addToScene, scene, commit, fail])

  return useMemo<FilamentModel>(
    () => (model == null ? { state: 'loading' } : { state: 'loaded', model, boundingBox: model.boundingBox, rootEntity: model.rootEntity }),
    [model]
  )
}

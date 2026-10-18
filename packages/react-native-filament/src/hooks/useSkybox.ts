import { useEffect } from 'react'
import { assetKey } from '../assets/assetKey'
import { toAssetSource } from '../assets/toAssetSource'
import { hexToLinearColor } from '../math/hexToLinearColor'
import { useFilamentScene } from '../react/useFilamentScene'
import { useRenderCommit } from '../react/useRenderCommit'
import { useReportFailure } from '../react/useReportFailure'
import type { Skybox } from '../specs/scene/Skybox.nitro'
import type { Float4 } from '../specs/types/Float4'
import type { SkyboxOptions } from './SkyboxOptions'
import { useDisposableResource } from './useDisposableResource'

/** Sets the background of the scene while mounted, or none for `undefined`. */
export function useSkybox(options: SkyboxOptions | undefined): Skybox | undefined {
  const { engine, scene } = useFilamentScene()
  const commit = useRenderCommit()
  const fail = useReportFailure()
  const source = options != null && 'source' in options ? options.source : undefined
  const color: Float4 | undefined =
    options == null
      ? undefined
      : 'color' in options
        ? options.color
        : 'colorInHex' in options
          ? hexToLinearColor(options.colorInHex)
          : undefined
  const sourceKey = source == null ? undefined : assetKey(source)
  const colorKey = color?.join()

  const skybox = useDisposableResource(() => {
    if (source != null) return engine.loadSkybox(toAssetSource(source))
    if (color == null) return undefined
    return commit.run(() => {
      'worklet'
      return engine.createSkybox(color)
    })
  }, [engine, commit, sourceKey, colorKey])

  useEffect(() => {
    if (skybox == null) return
    commit
      .run(() => {
        'worklet'
        scene.setSkybox(skybox)
      })
      .catch(fail)
    return () => {
      commit.post(() => {
        'worklet'
        scene.setSkybox(undefined)
      })
    }
  }, [skybox, scene, commit, fail])
  return skybox
}

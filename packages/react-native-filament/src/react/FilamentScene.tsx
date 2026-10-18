import React, { useEffect, useState, type ReactNode } from 'react'
import { Filament } from '../Filament'
import type { Engine } from '../specs/engine/Engine.nitro'
import type { EngineBackend } from '../specs/types/EngineBackend'
import { runOnRenderThread } from '../threading/runOnRenderThread'
import { FilamentSceneContext, type FilamentSceneValue } from './FilamentSceneContext'
import { RenderCommit } from './RenderCommit'
import { RenderCommitContext } from './RenderCommitContext'

interface SceneBaseProps {
  /** Rendered until the Engine and the scene exist. */
  fallback?: ReactNode
  children?: ReactNode
}

interface OwnedEngineProps extends SceneBaseProps {
  engine?: undefined
  /** Graphics API of the Engine this scene creates. Defaults to the first supported backend. */
  backend?: EngineBackend
}

interface BorrowedEngineProps extends SceneBaseProps {
  /**
   * An Engine to render with instead of creating one. The scene disposes only what it created and
   * never shuts the Engine down, so several scenes and views can share it.
   */
  engine: Engine
}

export type FilamentSceneProps = OwnedEngineProps | BorrowedEngineProps

interface Created {
  value: FilamentSceneValue
  commit: RenderCommit
  owned: boolean
}

async function createScene(borrowed: Engine | undefined, backend: EngineBackend | undefined): Promise<Created> {
  const engine = borrowed ?? (await Filament.createEngine({ backend }))
  try {
    const { scene, camera } = await runOnRenderThread(engine, () => {
      'worklet'
      return { scene: engine.createScene(), camera: engine.createCamera() }
    })
    const value: FilamentSceneValue = {
      engine,
      scene,
      camera,
      transformManager: engine.transformManager,
      renderableManager: engine.renderableManager,
      lightManager: engine.lightManager,
    }
    return { value, commit: new RenderCommit(engine), owned: borrowed == null }
  } catch (error) {
    if (borrowed == null) await engine.shutdown()
    throw error
  }
}

function release({ value, commit, owned }: Created): void {
  if (owned) {
    value.engine.shutdown()
    return
  }
  const { scene, camera } = value
  commit.post(() => {
    'worklet'
    scene.dispose()
    camera.dispose()
  })
}

/**
 * Provides an Engine, a scene and its camera to the Filament components and hooks below it. Creates
 * and shuts down its own Engine unless `engine` is passed.
 */
export function FilamentScene({ fallback, children, ...props }: FilamentSceneProps) {
  const borrowed = props.engine
  const backend = props.engine == null ? props.backend : undefined
  const [created, setCreated] = useState<Created>()
  const [failure, setFailure] = useState<unknown>()

  useEffect(() => {
    let active = true
    const creating = Promise.resolve().then(() => (active ? createScene(borrowed, backend) : undefined))
    creating.then(
      (next) => {
        if (active) setCreated(next)
      },
      (error: unknown) => {
        if (active) setFailure(() => error)
      }
    )
    return () => {
      active = false
      setCreated(undefined)
      creating.then(
        (current) => {
          if (current != null) release(current)
        },
        () => undefined
      )
    }
  }, [borrowed, backend])

  if (failure != null) throw failure
  if (created == null) return <>{fallback}</>
  return (
    <FilamentSceneContext.Provider value={created.value}>
      <RenderCommitContext.Provider value={created.commit}>{children}</RenderCommitContext.Provider>
    </FilamentSceneContext.Provider>
  )
}

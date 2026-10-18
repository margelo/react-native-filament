import type { Engine } from '../specs/engine/Engine.nitro'
import { runOnRenderThread } from '../threading/runOnRenderThread'

interface PendingJob {
  worklet: () => unknown
  resolve: (value: unknown) => void
  reject: (error: Error) => void
}

type Outcome = { failed: false; value: unknown } | { failed: true; message: string }

/**
 * Collects the render-thread work that effects submit while React applies one commit and runs it as
 * one render-thread job, in submission order.
 */
export class RenderCommit {
  private pending: PendingJob[] = []

  constructor(readonly engine: Engine) {}

  run<T>(worklet: () => T): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      if (this.pending.length === 0) Promise.resolve().then(() => this.flush())
      this.pending.push({ worklet, resolve: resolve as (value: unknown) => void, reject })
    })
  }

  /** Runs cleanup work, such as disposal, whose failure after the Engine shut down is expected. */
  post(worklet: () => void): void {
    this.run(worklet).catch(() => undefined)
  }

  private flush(): void {
    const jobs = this.pending
    this.pending = []
    const worklets = jobs.map((job) => job.worklet)
    runOnRenderThread(this.engine, () => {
      'worklet'
      return worklets.map((worklet): Outcome => {
        try {
          return { failed: false, value: worklet() }
        } catch (error) {
          return { failed: true, message: error instanceof Error ? error.message : String(error) }
        }
      })
    }).then(
      (outcomes) =>
        outcomes.forEach((outcome, index) => {
          const job = jobs[index]!
          if (outcome.failed) job.reject(new Error(outcome.message))
          else job.resolve(outcome.value)
        }),
      (error: Error) => jobs.forEach((job) => job.reject(error))
    )
  }
}

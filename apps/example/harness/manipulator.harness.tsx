import { afterEach, beforeEach, describe, expect, it } from 'react-native-harness'
import { scheduleOnRN } from 'react-native-worklets'
import { Filament, runOnRenderThread, type Engine, type Float3, type LookAt } from 'react-native-filament'
import { renderView } from './renderView'

function distance(a: Float3, b: Float3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
}

describe('Camera manipulator', () => {
  let engine: Engine

  beforeEach(async () => {
    engine = await Filament.createEngine({})
  })

  afterEach(async () => {
    await engine.shutdown()
  })

  async function startRendering() {
    const view = await renderView()
    const target = await engine.createViewTarget(view, {})
    await runOnRenderThread(engine, () => {
      'worklet'
      target.setScene(engine.createScene())
    })
  }

  function nextFrameLookAt(read: () => LookAt): Promise<LookAt> {
    return new Promise((resolve) => {
      runOnRenderThread(engine, () => {
        'worklet'
        const subscription = engine.addOnFrameListener(() => {
          subscription.remove()
          scheduleOnRN(resolve, read())
          return false
        })
      })
    })
  }

  it('starts at the home pose', () => {
    const manipulator = engine.createOrbitManipulator({ homePosition: [0, 1, 5], targetPosition: [0, 1, 0] })
    const pose = manipulator.getLookAt()
    expect(pose.eye).toEqual([0, 1, 5])
    expect(pose.target).toEqual([0, 1, 0])
    expect(pose.up[1]).toBeCloseTo(1, 5)
  })

  it('orbits at a constant distance, zooms with scroll and returns home', async () => {
    await startRendering()
    const manipulator = engine.createOrbitManipulator({ homePosition: [0, 0, 4] })
    manipulator.setViewport(200, 200)
    manipulator.grabBegin(100, 100, false)
    manipulator.grabUpdate(160, 100)
    manipulator.grabEnd()
    const orbited = await nextFrameLookAt(() => {
      'worklet'
      return manipulator.getLookAt()
    })
    expect(orbited.eye[0]).not.toBeCloseTo(0, 2)
    expect(distance(orbited.eye, orbited.target)).toBeCloseTo(4, 3)

    manipulator.scroll(100, 100, -20)
    const zoomed = await nextFrameLookAt(() => {
      'worklet'
      return manipulator.getLookAt()
    })
    expect(distance(zoomed.eye, zoomed.target)).toBeLessThan(4)

    manipulator.jumpToHome()
    const home = await nextFrameLookAt(() => {
      'worklet'
      return manipulator.getLookAt()
    })
    expect(home.eye[0]).toBeCloseTo(0, 4)
    expect(home.eye[2]).toBeCloseTo(4, 4)
  })

  it('pans the camera and its target together', async () => {
    await startRendering()
    const manipulator = engine.createOrbitManipulator({ homePosition: [0, 0, 4] })
    manipulator.setViewport(200, 200)
    manipulator.grabBegin(100, 100, true)
    manipulator.grabUpdate(150, 100)
    manipulator.grabEnd()
    const panned = await nextFrameLookAt(() => {
      'worklet'
      return manipulator.getLookAt()
    })
    expect(panned.target[0]).not.toBeCloseTo(0, 2)
    expect(panned.eye[0]).toBeCloseTo(panned.target[0], 4)
    expect(distance(panned.eye, panned.target)).toBeCloseTo(4, 3)
  })

  it('rejects commands past 256 per frame and always admits the end of a drag', async () => {
    const outcome = await runOnRenderThread(engine, () => {
      'worklet'
      const message = (run: () => void) => {
        try {
          run()
          return 'admitted'
        } catch (error) {
          return error instanceof Error ? error.message : String(error)
        }
      }
      const flooded = engine.createOrbitManipulator({})
      for (let anchor = 0; anchor < 256; anchor++) flooded.scroll(anchor, 0, 1)
      const dragging = engine.createOrbitManipulator({})
      dragging.grabBegin(0, 0, false)
      for (let anchor = 0; anchor < 254; anchor++) dragging.scroll(anchor, 0, 1)
      return {
        newAnchor: message(() => flooded.scroll(999, 0, 1)),
        sameAnchor: message(() => flooded.scroll(255, 0, 1)),
        grabBegin: message(() => flooded.grabBegin(0, 0, false)),
        updateWithoutRoom: message(() => dragging.grabUpdate(5, 5)),
        scrollWithReservedEnd: message(() => dragging.scroll(999, 0, 1)),
        grabEnd: message(() => dragging.grabEnd()),
      }
    })
    expect(outcome.newAnchor).toContain('FilamentQueueFullError')
    expect(outcome.sameAnchor).toBe('admitted')
    expect(outcome.grabBegin).toContain('FilamentQueueFullError')
    expect(outcome.updateWithoutRoom).toContain('FilamentQueueFullError')
    expect(outcome.scrollWithReservedEnd).toContain('FilamentQueueFullError')
    expect(outcome.grabEnd).toBe('admitted')
  })

  it('merges consecutive drag updates into one entry', async () => {
    const admitted = await runOnRenderThread(engine, () => {
      'worklet'
      const manipulator = engine.createOrbitManipulator({})
      manipulator.grabBegin(0, 0, false)
      for (let step = 0; step < 1000; step++) manipulator.grabUpdate(step, 0)
      manipulator.grabEnd()
      return true
    })
    expect(admitted).toBe(true)
  })

  it('rejects a manipulator from another engine', async () => {
    const other = await Filament.createEngine({})
    const manipulator = other.createOrbitManipulator({})
    const message = await runOnRenderThread(engine, () => {
      'worklet'
      try {
        engine.createCamera().followManipulator(manipulator)
        return 'followed'
      } catch (error) {
        return error instanceof Error ? error.message : String(error)
      }
    })
    expect(message).toContain('FilamentEngineMismatchError')
    await other.shutdown()
  })
})

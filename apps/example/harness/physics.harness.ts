import { afterEach, beforeEach, describe, expect, it } from 'react-native-harness'
import { Image } from 'react-native'
import { scheduleOnRN } from 'react-native-worklets'
import { Filament, runOnRenderThread, type Engine } from 'react-native-filament'
import { renderView } from './renderView'

const coin = Image.resolveAssetSource(require('../assets/coin.glb'))

function attempt(run: () => unknown): string {
  'worklet'
  try {
    run()
    return 'ok'
  } catch (error) {
    return error instanceof Error ? error.message : String(error)
  }
}

describe('Physics', () => {
  let engine: Engine

  beforeEach(async () => {
    engine = await Filament.createEngine({})
  })

  afterEach(async () => {
    await engine.shutdown()
  })

  it('integrates free fall in fixed steps', async () => {
    const read = await runOnRenderThread(engine, () => {
      'worklet'
      const world = engine.createPhysicsWorld({ gravity: [0, -10, 0], autoStep: false })
      const ball = world.createRigidBody({ shape: world.createSphereShape(0.5), mass: 1, position: [0, 10, 0] })
      for (let frame = 0; frame < 60; frame++) world.step(1 / 60)
      return { height: ball.getTransform()[13], velocity: ball.linearVelocity[1], gravity: world.gravity, bodies: world.bodyCount }
    })
    expect(read.height).toBeGreaterThan(4.7)
    expect(read.height).toBeLessThan(5.1)
    expect(Math.abs(read.velocity + 10)).toBeLessThan(0.01)
    expect([read.gravity, read.bodies]).toEqual([[0, -10, 0], 1])
  })

  it('rests a box on a static plane and reports the contact once to a listener that removes itself', async () => {
    const read = await runOnRenderThread(engine, () => {
      'worklet'
      const world = engine.createPhysicsWorld({ autoStep: false })
      world.createRigidBody({ shape: world.createStaticPlaneShape([0, 1, 0], 0), mass: 0, id: 'floor' })
      const box = world.createRigidBody({ shape: world.createBoxShape([0.5, 0.5, 0.5]), mass: 2, position: [0, 3, 0], id: 'box' })
      const contacts: string[] = []
      const allEvents: string[] = []
      world.addOnCollisionListener((events) => {
        for (const event of events) contacts.push(`${event.kind}:${event.bodyA.id}+${event.bodyB.id}`)
        return false
      })
      world.addOnCollisionListener((events) => {
        for (const event of events) allEvents.push(event.kind)
        return true
      })
      for (let frame = 0; frame < 240; frame++) world.step(1 / 60)
      return { height: box.getTransform()[13], contacts, allEvents, state: box.activationState }
    })
    expect(Math.abs(read.height - 0.5)).toBeLessThan(0.05)
    expect(read.contacts.length).toBe(1)
    expect(read.contacts[0]).toMatch(/^began:(floor\+box|box\+floor)$/)
    expect(read.allEvents[0]).toBe('began')
    expect(['sleeping', 'wants-sleep', 'active']).toContain(read.state)
  })

  it('moves a bound entity with its body and keeps the entity scale', async () => {
    const model = await engine.loadModel({ uri: coin.uri }, {})
    const read = await runOnRenderThread(engine, () => {
      'worklet'
      const tm = engine.transformManager
      tm.setScale(model.rootEntity, [2, 2, 2])
      const world = engine.createPhysicsWorld({ gravity: [0, 0, 0], autoStep: false })
      const body = world.createRigidBody({
        shape: world.createSphereShape(1),
        mass: 1,
        position: [1, 2, 3],
        entity: model.rootEntity,
      })
      const bound = tm.getTransform(model.rootEntity)
      body.linearVelocity = [0, 0, -6]
      for (let frame = 0; frame < 30; frame++) world.step(1 / 60)
      const moved = tm.getTransform(model.rootEntity)
      body.entity = undefined
      world.step(1 / 60)
      return {
        bound: [bound[12], bound[13], bound[14], bound[0]],
        moved: [moved[12], moved[13], moved[14], moved[0]],
        afterUnbind: tm.getTransform(model.rootEntity)[14],
        entity: body.entity,
      }
    })
    expect(read.bound).toEqual([1, 2, 3, 2])
    expect(read.moved[0]).toBeCloseTo(1, 4)
    expect(read.moved[2]).toBeCloseTo(0, 1)
    expect(read.moved[3]).toBeCloseTo(2, 4)
    expect(read.afterUnbind).toBe(read.moved[2])
    expect(read.entity).toBeUndefined()
  })

  it('steps automatically while the engine renders', async () => {
    const target = await engine.createViewTarget(await renderView(), {})
    const ball = await runOnRenderThread(engine, () => {
      'worklet'
      target.setScene(engine.createScene())
      const world = engine.createPhysicsWorld({})
      return world.createRigidBody({ shape: world.createSphereShape(0.5), mass: 1, position: [0, 100, 0] })
    })
    const height = await new Promise<number>((resolve) => {
      runOnRenderThread(engine, () => {
        'worklet'
        let frames = 0
        const subscription = engine.addOnFrameListener(() => {
          frames++
          if (frames === 20) {
            subscription.remove()
            scheduleOnRN(resolve, ball.getTransform()[13])
          }
          return true
        })
      })
    })
    expect(height).toBeLessThan(100)
  })

  it('applies impulses, damping and activation states', async () => {
    const read = await runOnRenderThread(engine, () => {
      'worklet'
      const world = engine.createPhysicsWorld({ gravity: [0, 0, 0], autoStep: false })
      const body = world.createRigidBody({ shape: world.createBoxShape([1, 1, 1]), mass: 4, friction: 0.25, restitution: 0.75 })
      body.applyCentralImpulse([8, 0, 0])
      const velocity = body.linearVelocity
      body.angularVelocity = [0, 1, 0]
      body.activationState = 'never-sleep'
      body.setDamping(0.5, 0.5)
      world.step(1 / 60)
      return {
        velocity,
        slowed: body.linearVelocity[0] < 2,
        state: body.activationState,
        materials: [body.friction, body.restitution, body.mass],
        shape: body.shape.type,
      }
    })
    expect(read.velocity).toEqual([2, 0, 0])
    expect(read.slowed).toBe(true)
    expect(read.state).toBe('never-sleep')
    expect(read.materials).toEqual([0.25, 0.75, 4])
    expect(read.shape).toBe('box')
  })

  it('disposes bodies with their world and validates arguments', async () => {
    const read = await runOnRenderThread(engine, () => {
      'worklet'
      const world = engine.createPhysicsWorld({ autoStep: false })
      const plane = world.createStaticPlaneShape([0, 1, 0], 0)
      const sphere = world.createSphereShape(1)
      const errors = [
        attempt(() => world.createRigidBody({ shape: plane, mass: 1 })),
        attempt(() => world.createRigidBody({ shape: sphere, mass: -1 })),
        attempt(() => world.createSphereShape(0)),
        attempt(() => world.createCylinderShape([1, 0, 1], 'y')),
        attempt(() => world.step(-1)),
      ]
      const first = world.createRigidBody({ shape: sphere, mass: 1 })
      const second = world.createRigidBody({ shape: sphere, mass: 1, id: 'second' })
      first.dispose()
      return { world, second, errors }
    })
    const afterBodyDispose = await runOnRenderThread(engine, () => {
      'worklet'
      const count = read.world.bodyCount
      read.world.dispose()
      return count
    })
    const afterWorldDispose = await runOnRenderThread(engine, () => {
      'worklet'
      return attempt(() => read.second.linearVelocity)
    })
    expect(read.errors[0]).toContain('static plane')
    expect(read.errors[1]).toContain('mass of at least 0')
    expect(read.errors[2]).toContain('positive radius')
    expect(read.errors[3]).toContain('positive half extents')
    expect(read.errors[4]).toContain('at least 0 seconds')
    expect(afterBodyDispose).toBe(1)
    expect(afterWorldDispose).toContain('FilamentDisposedError')
    expect(read.second.id).toBe('second')
  })
})

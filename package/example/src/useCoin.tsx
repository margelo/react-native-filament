import { DiscreteDynamicWorld, Engine, Float3, RigidBody, useBoxShape, useModel, useRigidBody } from 'react-native-filament'
import { getPath } from './getPath'
import { useEffect, useMemo, useState } from 'react'
import { BulletAPI } from '../../src/bullet/bulletApi'

const coinPath = getPath('coin.glb')

const scale = 0.3

export function useCoin(engine: Engine, world: DiscreteDynamicWorld, origin: Float3) {
  const coin = useModel({ engine: engine, path: coinPath })
  // const coinShape = useBoxShape(scale, scale, scale)
  // const coinBody = useRigidBody({
  //   mass: 0.2,
  //   origin: origin,
  //   shape: coinShape,
  //   friction: 1,
  //   damping: [0.0, 0.5],
  //   activationState: 'disable_deactivation',
  // })

  // Add the rigid body to the world once the coin is loaded
  // TODO: Combine with hooks API!
  // const isLoaded = coin.state === 'loaded'
  // useEffect(() => {
  //   if (isLoaded) {
  //     world.addRigidBody(coinBody)
  //   }
  // }, [coinBody, isLoaded, world])

  // TODO(Marc): The mesh entity returned isn't stable, ie it changes between renders, why is that?
  const meshEntity = useMemo(() => {
    return coin.state === 'loaded' ? coin.asset.renderableEntities[0] : undefined
  }, [coin])
  const hasMeshEntity = meshEntity !== undefined

  const originX = origin[0]
  const originY = origin[1]
  const originZ = origin[2]

  const [coinBody, setCoinBody] = useState<RigidBody | undefined>(undefined)

  // Set the initial transform of the coin
  useEffect(() => {
    if (hasMeshEntity) {
      console.log('APPLY TRANSFORM')
      const originalTransform = engine.transformManager.getTransform(meshEntity)
      const originalScale = originalTransform.scale

      const newScaleX = originalScale[0] * scale
      const newScaleY = originalScale[1] * scale
      const newScaleZ = originalScale[2] * scale

      // For the coins we want to reset the rotation, for that we set a new transform
      // (false will cause the transform to be set as the new local transform).
      engine.setEntityScale(meshEntity, [newScaleX, newScaleY, newScaleZ], false)

      // Set a random rotation
      const angleRad = Math.random() * Math.PI * 2
      const axis: Float3 = [Math.random(), Math.random(), Math.random()]
      engine.setEntityRotation(meshEntity, angleRad, axis, true)

      engine.setEntityPosition(meshEntity, [originX, originY, originZ], true)
      const transform = engine.transformManager.getTransform(meshEntity)

      // Create RigidBody
      const asset = (coin.state === 'loaded' ? coin.asset : undefined)!
      const halfExtent = asset.boundingBox.halfExtent
      const coinShape = BulletAPI.createCylinderShape(...halfExtent)
      coinShape.localScaling = [scale, scale, scale]
      const body = BulletAPI.createRigidBodyFromTransform(10, transform, coinShape)
      body.friction = 1
      body.setDamping(0.0, 0.5)
      body.activationState = 'disable_deactivation'
      world.addRigidBody(body)

      setCoinBody(body)
    }
  }, [engine, hasMeshEntity, originX, originY, originZ])

  return hasMeshEntity && coinBody ? ([coinBody, meshEntity] as const) : []
}

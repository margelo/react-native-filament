import { DiscreteDynamicWorld, Engine, Float3, useBoxShape, useModel, useRigidBody } from 'react-native-filament'
import { getPath } from './getPath'
import { useEffect, useMemo } from 'react'

const coinPath = getPath('coin.glb')

const scale = 0.5
const initialRotation = 0

export function useCoin(engine: Engine, world: DiscreteDynamicWorld, origin: Float3) {
  const coin = useModel({ engine: engine, path: coinPath })
  const coinShape = useBoxShape(scale, scale, scale)
  const coinBody = useRigidBody({
    mass: 0.2,
    origin: origin,
    shape: coinShape,
    friction: 1,
    damping: [0.0, 0.5],
    activationState: 'disable_deactivation',
  })

  // Add the rigid body to the world once the coin is loaded
  // TODO: Combine with hooks API!
  const isLoaded = coin.state === 'loaded'
  useEffect(() => {
    if (isLoaded) {
      world.addRigidBody(coinBody)
    }
  }, [coinBody, isLoaded, world])

  const rootEntity = coin.state === 'loaded' ? coin.asset.getRoot() : undefined
  // TODO(Marc): The mesh entity returned isn't stable, ie it changes between renders, why is that?
  const meshEntity = useMemo(() => {
    return coin.state === 'loaded' ? coin.asset.renderableEntities[0] : undefined
  }, [coin])
  const hasMeshEntity = meshEntity !== undefined

  const originX = origin[0]
  const originY = origin[1]
  const originZ = origin[2]

  // Set the initial transform of the coin
  useEffect(() => {
    if (hasMeshEntity) {
      console.log('APPLY TRANSFORM')
      // engine.setEntityRotation(meshEntity, initialRotation, [0, 1, 0], false)
      // engine.setEntityPosition(meshEntity, [0, 0, 0], true)
      engine.setEntityScale(meshEntity, [scale, scale, scale], true)
      engine.setEntityRotation(meshEntity, initialRotation, [0, 0, 0], true)
      // engine.setEntityPosition(meshEntity, [originX, originY, originZ], true)
    }
  }, [engine, hasMeshEntity, originX, originY, originZ])

  return coin.state === 'loaded' ? ([coinBody, coin.asset.getRoot()] as const) : []
}

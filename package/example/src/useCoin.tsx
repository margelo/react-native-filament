import { DiscreteDynamicWorld, Engine, Float3, useModel, useRigidBody } from 'react-native-filament'
import { getPath } from './getPath'
import { useEffect } from 'react'
import { BoxShape } from '../../src/bullet/types/Shapes'

const coinPath = getPath('coin.glb')

export function useCoin(engine: Engine, world: DiscreteDynamicWorld, origin: Float3) {
  const coin = useModel({ engine: engine, path: coinPath })
  const coinBody = useRigidBody({
    mass: 0.2,
    origin: origin,
    shape: BoxShape(0.3, 0.3, 0.3),
    friction: 1,
    damping: [0.0, 0.5],
    activationState: 'disable_deactivation',
  })

  // Add the rigid body to the world once the coin is loaded
  // TODO: Combine with hooks API!
  useEffect(() => {
    if (coin.state === 'loaded') {
      world.addRigidBody(coinBody)
    }
  }, [coin, world, coinBody])

  return coin.state === 'loaded' ? [coinBody, coin.asset.getRoot()] : []
}

import {
  CollisionCallback,
  DiscreteDynamicWorld,
  Float3,
  getAssetFromModel,
  useCylinderShape,
  useFilamentContext,
  useModel,
  useRigidBody,
} from 'react-native-filament'
import { useMemo } from 'react'
import Coin from '~/assets/coin.glb'

const scale = 0.5

// A coin with a random rotation, that will be added to the physics world
export function useCoin(world: DiscreteDynamicWorld, origin: Float3, collisionCallback?: CollisionCallback) {
  const { transformManager } = useFilamentContext()
  const coin = useModel(Coin)

  const originX = origin[0]
  const originY = origin[1]
  const originZ = origin[2]

  const coinAsset = getAssetFromModel(coin)
  const coinBoundingBox = coin.state === 'loaded' ? coin.boundingBox : undefined
  const renderableEntities = useMemo(() => coinAsset?.getRenderableEntities(), [coinAsset])

  // Takes the first entity which is the mesh and applies a random rotation, scale and position.
  // It returns the entity and its transform. The transform is needed to create the rigid body.
  const [meshEntity, meshTransform] = useMemo(() => {
    const entity = renderableEntities?.[0]
    if (entity == null) {
      return []
    }

    const originalTransform = transformManager.getTransform(entity)
    const originalScale = originalTransform.scale

    const newScaleX = originalScale[0] * scale
    const newScaleY = originalScale[1] * scale
    const newScaleZ = originalScale[2] * scale

    // For the coins we want to reset the rotation, for that we set a new transform
    // (false will cause the transform to be set as the new local transform).
    transformManager.setEntityScale(entity, [newScaleX, newScaleY, newScaleZ], false)

    // Set a random rotation
    const angleRad = Math.random() * Math.PI * 2
    const axis: Float3 = [Math.random(), Math.random(), Math.random()]
    transformManager.setEntityRotation(entity, angleRad, axis, true)

    transformManager.setEntityPosition(entity, [originX, originY, originZ], true)

    const transform = transformManager.getTransform(entity)

    return [entity, transform] as const
  }, [originX, originY, originZ, renderableEntities, transformManager])

  const circleShape = useCylinderShape(
    coinBoundingBox == null
      ? undefined
      : {
          half: coinBoundingBox.halfExtent,
          localScaling: [scale, scale, scale],
        }
  )
  const rigidBody = useRigidBody(
    circleShape == null || meshTransform == null
      ? undefined
      : {
          mass: 1,
          transform: meshTransform,
          shape: circleShape,
          friction: 1,
          damping: [0.0, 0.5],
          activationState: 'disable_deactivation',
          world: world,
          id: 'coin',
          collisionCallback: collisionCallback,
        }
  )

  return meshEntity && rigidBody ? ([rigidBody, meshEntity] as const) : []
}

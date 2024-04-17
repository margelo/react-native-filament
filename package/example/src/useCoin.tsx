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
import { getPath } from './getPath'
import { useMemo } from 'react'

const coinPath = getPath('coin.glb')

const scale = 0.3

// A coin with a random rotation, that will be added to the physics world
export function useCoin(world: DiscreteDynamicWorld, origin: Float3, collisionCallback: CollisionCallback) {
  const { transformManager, engine } = useFilamentContext()
  const coin = useModel({ path: coinPath })

  const originX = origin[0]
  const originY = origin[1]
  const originZ = origin[2]

  const coinAsset = getAssetFromModel(coin)
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
    engine.setEntityScale(entity, [newScaleX, newScaleY, newScaleZ], false)

    // Set a random rotation
    const angleRad = Math.random() * Math.PI * 2
    const axis: Float3 = [Math.random(), Math.random(), Math.random()]
    engine.setEntityRotation(entity, angleRad, axis, true)

    engine.setEntityPosition(entity, [originX, originY, originZ], true)

    const transform = transformManager.getTransform(entity)

    return [entity, transform] as const
  }, [engine, originX, originY, originZ, renderableEntities, transformManager])

  const circleShape = useCylinderShape(
    coinAsset == null
      ? undefined
      : {
          half: coinAsset.boundingBox.halfExtent,
          localScaling: [scale, scale, scale],
        }
  )
  const rigidBody = useRigidBody(
    circleShape == null || meshTransform == null
      ? undefined
      : {
          mass: 10,
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

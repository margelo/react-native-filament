# Physics API

> [!TIP]
> As physics engine Bullet is used. We simply provide a JS/JSI wrapper around it.
> So it can help to familiarize with their documentation first:
> - [Bullet_User_Manual.pdf](https://github.com/bulletphysics/bullet3/blob/master/docs/Bullet_User_Manual.pdf)

Imperative API:

- [Bullet imperative API](../package/src/bullet/types/api.ts)

Hooks:

The hooks should be used whenever possible.

- [`useWorld`](../package/src/bullet/hooks/useWorld.ts)
- [`useRigidBody`](../package/src/bullet/hooks/useRigidBody.ts)
- [`useCylinderShape`](../package/src/bullet/hooks/useCylinderShape.ts)
- [`useBoxShape`](../package/src/bullet/hooks/useBoxShape.ts)
- [`useSphereShape`](../package/src/bullet/hooks/useSphereShape.ts)
- [`useStaticPlaneShape`](../package/src/bullet/hooks/useStaticPlaneShape.ts)


**Example:**

First we need to create a physics world:

```tsx
import { useWorld } from 'react-native-filament';

function App() {
  const world = useWorld([0, -9.8, 0]);
}
```

Often times you want to create a physical body for an entity (asset) in the scene.
Here are a few helpers you likely will need to accomplish this:

**Get the bounding box of an entity:**

```tsx
const boundingBox = asset.boundingBox // returns an aabb bounding box
const halfExtents = boundingBox.halfExtents
const center = boundingBox.center
```

**Get the transform an entity:**

```tsx
const transformManager = useTransformManager(engine)
const transform = transformManager.getTransform(entity)

// Get the calculated world scale:
const [scaleX, scaleY, scaleZ] = transform.scale
```

**Create a physical shape (resembling the asset)**

```tsx
// useBoxShape expects a vector of halfExtents, so we can just pass the once from our asset
const boxShape = useBoxShape(halfExtents)

// Eventually we need to adjust the local scaling of the shape:
boxShape.localScaling = transform.scale
```

**Create a rigid body**

```tsx
const rigidBody = useRigidBody({
  id: "box",
  mass: 1,
  shape: boxShape,
  transform: transform,
  // Pass the world for the body tp be automatically added to the world:
  world: world
})
```
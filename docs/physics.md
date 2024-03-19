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
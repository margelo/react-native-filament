import { DiscreteDynamicWorld } from './DiscreteDynamicWorld'

export interface BulletAPI {
  createDiscreteDynamicWorld(gravityX: number, gravityY: number, gravityZ: number): DiscreteDynamicWorld
}

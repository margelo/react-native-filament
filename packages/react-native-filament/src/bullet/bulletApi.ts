import { FilamentProxy } from '../native/FilamentProxy'

/**
 * Note: Prefer using the bullet hooks over the imperative API!
 * The imperative API might become deprecated in the future.
 */
export const BulletAPI = FilamentProxy.createBullet()

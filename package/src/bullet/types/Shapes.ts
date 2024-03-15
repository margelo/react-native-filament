import { BulletAPI } from '../bulletApi'

export interface BaseShape {
  _type: 'BaseShape'
}

export interface Box extends BaseShape {}

export function BoxShape(halfX: number, halfY: number, halfZ: number): Box {
  return BulletAPI.createBoxShape(halfX, halfY, halfZ)
}

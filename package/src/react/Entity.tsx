import { useParentEntityContext } from './ParentEntityContex'
import { useFilamentContext } from './FilamentContext'

export type EntityProps = {
  transformToUnitCube?: boolean
}

export function Entity({ transformToUnitCube }: EntityProps) {
  const entity = useParentEntityContext()
  const { transformManager } = useFilamentContext()

  return null
}

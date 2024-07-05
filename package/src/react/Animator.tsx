import React from 'react'
import { FilamentModel } from '../hooks/useModel'
import { ParentModelAssetContext } from './ParentModelAssetContex'
import { getAssetFromModel } from '../utilities/getAssetFromModel'
import { FilamentAsset } from '../types'

type Props = {
  model?: FilamentModel
}

export function Animator({ model: propModel, ...props }: Props) {
  const parentModel = React.useContext(ParentModelAssetContext)
  const model = propModel ?? parentModel

  if (model == null) {
    throw new Error('Animator must be used inside a <Model> component (or receive a model prop)')
  }

  const asset = 'state' in model ? getAssetFromModel(model) : model

  if (asset == null) {
    // User provided model which is still loading
    return null
  }

  return <AnimatorImpl asset={asset} {...props} />
}

type ImplProps = {
  asset: FilamentAsset
}

function AnimatorImpl({ asset }: ImplProps) {
  return null
}

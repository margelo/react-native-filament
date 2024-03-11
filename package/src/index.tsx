// native base
export * from './native/FilamentProxy'
export * from './types'

// react components
export * from './Filament'

// hooks
export * from './hooks/useEngine'
export * from './hooks/useRenderCallback'

import { runTests } from './test/RunTests'
runTests()

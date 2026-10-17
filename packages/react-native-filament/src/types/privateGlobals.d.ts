export {}

declare global {
  var __listenerRegistry: Record<number, Array<() => void>> | undefined
}

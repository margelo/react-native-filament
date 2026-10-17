/**
 * Graphics API an Engine renders with.
 * - `metal`: iOS.
 * - `opengl`: OpenGL ES 3.0 or newer on Android.
 * - `vulkan`: Vulkan 1.1 or newer on Android.
 */
export type EngineBackend = 'metal' | 'opengl' | 'vulkan'

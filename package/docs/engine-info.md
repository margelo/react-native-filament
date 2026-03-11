# Engine Backend & Feature Level Info

`react-native-filament` exposes three read-only getters from the underlying Filament engine that describe the GPU backend and its capabilities. These are useful for adaptive quality, diagnostics, and telemetry.

## API

### `engine.getBackend()`

Returns the resolved graphics backend as a string:

| Value | Meaning |
|-------|---------|
| `"metal"` | Apple Metal (default on iOS/macOS) |
| `"opengl"` | OpenGL ES (default on Android) |
| `"vulkan"` | Vulkan (opt-in on Android/Linux/Windows) |
| `"default"` | Should not appear at runtime -- the engine always resolves to a concrete backend |

### `engine.getSupportedFeatureLevel()`

Returns the highest feature level the device's GPU supports, as an integer `0`-`3`:

| Level | Capabilities |
|-------|-------------|
| `0` | OpenGL ES 2.0 features only |
| `1` | OpenGL ES 3.0 features (default on most modern devices) |
| `2` | OpenGL ES 3.1 + 16 texture units + cubemap arrays |
| `3` | OpenGL ES 3.1 + 31 texture units + cubemap arrays |

On iOS with Metal, devices typically report feature level `3`. On Android the level depends on the GPU -- budget GPUs may report `1`, while mid-range and flagship GPUs report `2` or `3`.

### `engine.getActiveFeatureLevel()`

Returns the currently active feature level. This equals the supported level unless a lower level was explicitly set via `Engine.Builder.featureLevel()`.

## Example: Adaptive Quality

```tsx
import { useFilamentContext } from 'react-native-filament';
import { useEffect } from 'react';

function AdaptiveScene() {
  const { engine } = useFilamentContext();

  useEffect(() => {
    const backend = engine.getBackend();
    const featureLevel = engine.getSupportedFeatureLevel();

    console.log(`Backend: ${backend}, Feature Level: ${featureLevel}`);

    // Use feature level as a GPU capability signal:
    //   Level 0-1: budget GPU -- use lower-poly models, fewer draw calls
    //   Level 2+:  capable GPU -- enable full-quality rendering
  }, [engine]);

  return (
    // ... your scene
  );
}
```

## Example: Device Diagnostics Screen

```tsx
import { useFilamentContext } from 'react-native-filament';
import { Text, View } from 'react-native';

function DiagnosticsPanel() {
  const { engine } = useFilamentContext();

  return (
    <View>
      <Text>Backend: {engine.getBackend()}</Text>
      <Text>Supported Feature Level: {engine.getSupportedFeatureLevel()}</Text>
      <Text>Active Feature Level: {engine.getActiveFeatureLevel()}</Text>
    </View>
  );
}
```

## Background

Filament's C++ `Engine` class has always had `getBackend()`, `getSupportedFeatureLevel()`, and `getActiveFeatureLevel()` -- zero-cost const getters that return immediately. This change bridges them through the JSI layer so they are accessible from JavaScript, following the same `EngineImpl` -> `EngineWrapper` -> TypeScript pattern used by all other Engine methods.

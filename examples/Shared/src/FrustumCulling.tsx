import * as React from 'react'
import { useEffect, useState } from 'react'
import { Dimensions, StyleSheet, View, Text, TouchableOpacity } from 'react-native'
import {
  FilamentScene,
  FilamentView,
  Camera,
  ModelRenderer,
  Animator,
  DefaultLight,
  useCameraManipulator,
  useModel,
  useFilamentContext,
  getAssetFromModel,
} from 'react-native-filament'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { useSharedValue } from 'react-native-worklets-core'
import HipHopGirlGlb from '@assets/hiphopgirl.glb'
import HipHopGirlOffsetGlb from '@assets/hiphopgirl_offset.glb'

const SCALE_OPTIONS = [1, 2, 5, 10, 100, 1000]

type ModelType = 'normal' | 'offset'

const MODEL_SOURCES = {
  normal: HipHopGirlGlb,
  offset: HipHopGirlOffsetGlb,
} as const

// Camera positions for each model type
const CAMERA_POSITIONS = {
  normal: {
    orbitHomePosition: [0, 1, 5] as [number, number, number],
    targetPosition: [0, 1, 0] as [number, number, number],
  },
  offset: {
    // Offset model is at X ≈ 1 (mesh vertices baked at X≈100, scale 0.01)
    orbitHomePosition: [1, 1, 5] as [number, number, number],
    targetPosition: [1, 1, 0] as [number, number, number],
  },
}

interface TestConfig {
  scaleFactor: number
  modelType: ModelType
}

// Settings screen to select model type and scale factor
function ConfigSelector({ onSelect }: { onSelect: (config: TestConfig) => void }) {
  const [modelType, setModelType] = useState<ModelType>('normal')

  return (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorTitle}>Frustum Culling Test</Text>

      <Text style={styles.selectorDescription}>Select Model:</Text>
      <View style={styles.modelButtonRow}>
        <TouchableOpacity
          style={[styles.modelButton, modelType === 'normal' && styles.modelButtonSelected]}
          onPress={() => setModelType('normal')}
        >
          <Text style={[styles.modelButtonText, modelType === 'normal' && styles.modelButtonTextSelected]}>
            Normal (origin)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modelButton, modelType === 'offset' && styles.modelButtonSelected]}
          onPress={() => setModelType('offset')}
        >
          <Text style={[styles.modelButtonText, modelType === 'offset' && styles.modelButtonTextSelected]}>
            Offset (X=10)
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.selectorDescription, { marginTop: 24 }]}>
        Select BoundingBox Scale Factor:
      </Text>
      <View style={styles.buttonGrid}>
        {SCALE_OPTIONS.map((scale) => (
          <TouchableOpacity
            key={scale}
            style={styles.scaleButton}
            onPress={() => onSelect({ scaleFactor: scale, modelType })}
          >
            <Text style={styles.scaleButtonText}>{scale}x</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.hint}>
        {modelType === 'offset'
          ? 'Offset model tests PR #328 fix (scale from center vs origin).'
          : 'Normal model is at origin - offset model recommended for testing.'}
      </Text>
    </View>
  )
}

// Renderer component that loads and displays the model
function Renderer({ scaleFactor, modelType }: { scaleFactor: number; modelType: ModelType }) {
  const animationIndex = useSharedValue(2) // IDLE animation

  const { renderableManager } = useFilamentContext()
  const model = useModel(MODEL_SOURCES[modelType])

  // Auto-apply scale when model is loaded
  useEffect(() => {
    if (model.state !== 'loaded') return

    const asset = getAssetFromModel(model)
    if (asset == null) return

    try {
      renderableManager.scaleBoundingBox(asset, scaleFactor)
      console.log(`Scaled bounding box by factor: ${scaleFactor}`)
    } catch (e) {
      console.log('scaleBoundingBox failed:', e)
    }
  }, [model.state, renderableManager, scaleFactor])

  // Camera with gesture control - position based on model type
  const cameraPosition = CAMERA_POSITIONS[modelType]
  const cameraManipulator = useCameraManipulator({
    orbitHomePosition: cameraPosition.orbitHomePosition,
    targetPosition: cameraPosition.targetPosition,
    orbitSpeed: [0.003, 0.003],
  })

  // Pan gesture for camera rotation
  const viewHeight = Dimensions.get('window').height
  const panGesture = Gesture.Pan()
    .onBegin((event) => {
      const yCorrected = viewHeight - event.translationY
      cameraManipulator?.grabBegin(event.translationX, yCorrected, false)
    })
    .onUpdate((event) => {
      const yCorrected = viewHeight - event.translationY
      cameraManipulator?.grabUpdate(event.translationX, yCorrected)
    })
    .maxPointers(1)
    .onEnd(() => {
      cameraManipulator?.grabEnd()
    })

  // Pinch gesture for zoom
  const previousScale = useSharedValue(1)
  const scaleMultiplier = 100
  const pinchGesture = Gesture.Pinch()
    .onBegin(({ scale }) => {
      previousScale.value = scale
    })
    .onUpdate(({ scale, focalX, focalY }) => {
      const delta = scale - previousScale.value
      cameraManipulator?.scroll(focalX, focalY, -delta * scaleMultiplier)
      previousScale.value = scale
    })
  const combinedGesture = Gesture.Race(pinchGesture, panGesture)

  return (
    <View style={styles.container}>
      <GestureDetector gesture={combinedGesture}>
        <FilamentView style={styles.filamentView}>
          <Camera cameraManipulator={cameraManipulator} />
          <DefaultLight />

          <ModelRenderer model={model}>
            {model.state === 'loaded' && (
              <Animator animationIndex={animationIndex} transitionDuration={0.5} />
            )}
          </ModelRenderer>
        </FilamentView>
      </GestureDetector>

      <View style={styles.info}>
        <Text style={styles.title}>Frustum Culling Test</Text>
        <Text style={styles.instructions}>
          Rotate the camera to check if the model disappears at certain angles.
        </Text>
        <Text style={styles.controls}>
          Drag: rotate camera / Pinch: zoom
        </Text>
        {model.state !== 'loaded' ? (
          <Text style={styles.loadingText}>Loading model...</Text>
        ) : (
          <Text style={styles.scaleApplied}>
            Model: {modelType} | Scale: {scaleFactor}x
          </Text>
        )}
      </View>
    </View>
  )
}

export function FrustumCulling() {
  const [config, setConfig] = useState<TestConfig | null>(null)

  if (config === null) {
    return <ConfigSelector onSelect={setConfig} />
  }

  return (
    <View style={styles.container}>
      <FilamentScene>
        <Renderer scaleFactor={config.scaleFactor} modelType={config.modelType} />
      </FilamentScene>
      <TouchableOpacity style={styles.backButton} onPress={() => setConfig(null)}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filamentView: {
    flex: 1,
    backgroundColor: 'lightblue',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  info: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ccc',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  instructions: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  controls: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  scaleApplied: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#34C759',
    marginTop: 8,
  },
  // Selector styles
  selectorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  selectorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  selectorDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    maxWidth: 300,
  },
  scaleButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  scaleButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  hint: {
    fontSize: 12,
    color: '#888',
    marginTop: 24,
    textAlign: 'center',
  },
  modelButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
    backgroundColor: 'white',
  },
  modelButtonSelected: {
    backgroundColor: '#007AFF',
  },
  modelButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  modelButtonTextSelected: {
    color: 'white',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
})

const U_SEGMENTS = 240
const V_SEGMENTS = 72
const SCALE = 0.3

type Vec3 = [number, number, number]

/** The classic glass-bottle immersion of the Klein bottle, for 0 <= u < PI and 0 <= v < 2 PI, standing on its base. */
function bottlePoint(u: number, v: number): Vec3 {
  const [cu, su, cv, sv] = [Math.cos(u), Math.sin(u), Math.cos(v), Math.sin(v)]
  const x = (-2 / 15) * cu * (3 * cv - 30 * su + 90 * cu ** 4 * su - 60 * cu ** 6 * su + 5 * cu * cv * su)
  const y =
    (-1 / 15) *
    su *
    (3 * cv - 3 * cu ** 2 * cv - 48 * cu ** 4 * cv + 48 * cu ** 6 * cv - 60 * su + 5 * cu * cv * su - 5 * cu ** 3 * cv * su - 80 * cu ** 5 * cv * su + 80 * cu ** 7 * cv * su)
  const z = (2 / 15) * (3 + 5 * cu * su) * sv
  return [(x - 0.15) * SCALE, (y - 2.1) * SCALE, z * SCALE]
}

function hslToRgb(hue: number, saturation: number, lightness: number): Vec3 {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation
  const sector = (((hue % 360) + 360) % 360) / 60
  const second = chroma * (1 - Math.abs((sector % 2) - 1))
  const [r, g, b]: Vec3 =
    sector < 1 ? [chroma, second, 0] : sector < 2 ? [second, chroma, 0] : sector < 3 ? [0, chroma, second] : sector < 4 ? [0, second, chroma] : sector < 5 ? [second, 0, chroma] : [chroma, 0, second]
  const match = lightness - chroma / 2
  return [r + match, g + match, b + match].map((channel) => channel ** 2.2) as Vec3
}

function iridescence(u: number, v: number): Vec3 {
  return hslToRgb(200 + 70 * (1 - Math.cos(2 * u)) + 25 * Math.sin(3 * v), 0.85, 0.58)
}

/** Positions, normals, colors and indices of a Klein bottle; the v seam is shared so normals stay smooth around the tube. */
function buildMesh() {
  const columns = V_SEGMENTS
  const rows = U_SEGMENTS + 1
  const positions = new Float32Array(rows * columns * 3)
  const colors = new Float32Array(rows * columns * 4)
  for (let row = 0; row < rows; row++) {
    const u = (row / U_SEGMENTS) * Math.PI
    for (let column = 0; column < columns; column++) {
      const v = (column / columns) * 2 * Math.PI
      const index = row * columns + column
      positions.set(bottlePoint(u, v), index * 3)
      colors.set([...iridescence(u, v), 1], index * 4)
    }
  }
  const indices = new Uint32Array(U_SEGMENTS * columns * 6)
  let cursor = 0
  for (let row = 0; row < U_SEGMENTS; row++) {
    for (let column = 0; column < columns; column++) {
      const a = row * columns + column
      const b = row * columns + ((column + 1) % columns)
      const c = (row + 1) * columns + column
      const d = (row + 1) * columns + ((column + 1) % columns)
      indices.set([a, c, b, b, c, d], cursor)
      cursor += 6
    }
  }
  const normals = new Float32Array(positions.length)
  for (let i = 0; i < indices.length; i += 3) {
    const [a, b, c] = [indices[i]! * 3, indices[i + 1]! * 3, indices[i + 2]! * 3]
    const e1 = [positions[b]! - positions[a]!, positions[b + 1]! - positions[a + 1]!, positions[b + 2]! - positions[a + 2]!]
    const e2 = [positions[c]! - positions[a]!, positions[c + 1]! - positions[a + 1]!, positions[c + 2]! - positions[a + 2]!]
    const n = [e1[1]! * e2[2]! - e1[2]! * e2[1]!, e1[2]! * e2[0]! - e1[0]! * e2[2]!, e1[0]! * e2[1]! - e1[1]! * e2[0]!]
    for (const vertex of [a, b, c]) {
      normals[vertex] = normals[vertex]! + n[0]!
      normals[vertex + 1] = normals[vertex + 1]! + n[1]!
      normals[vertex + 2] = normals[vertex + 2]! + n[2]!
    }
  }
  for (let i = 0; i < normals.length; i += 3) {
    const length = Math.hypot(normals[i]!, normals[i + 1]!, normals[i + 2]!) || 1
    normals[i] = normals[i]! / length
    normals[i + 1] = normals[i + 1]! / length
    normals[i + 2] = normals[i + 2]! / length
  }
  return { positions, normals, colors, indices }
}

function bounds(positions: Float32Array) {
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (let i = 0; i < positions.length; i += 3) {
    for (let axis = 0; axis < 3; axis++) {
      min[axis] = Math.min(min[axis]!, positions[i + axis]!)
      max[axis] = Math.max(max[axis]!, positions[i + axis]!)
    }
  }
  return { min, max }
}

const pad4 = (length: number) => (length + 3) & ~3

/** A self-contained glTF binary of an iridescent, clear-coated Klein bottle that Filament's ubershader materials can render. */
export function createKleinBottleGlb(): Uint8Array {
  const { positions, normals, colors, indices } = buildMesh()
  const chunks = [positions, normals, colors, indices]
  const offsets: number[] = []
  let binLength = 0
  for (const chunk of chunks) {
    offsets.push(binLength)
    binLength = pad4(binLength + chunk.byteLength)
  }
  const vertexCount = positions.length / 3
  const gltf = {
    asset: { version: '2.0', generator: 'react-native-filament docs' },
    extensionsUsed: ['KHR_materials_clearcoat'],
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, name: 'KleinBottle' }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0, NORMAL: 1, COLOR_0: 2 }, indices: 3, material: 0 }] }],
    materials: [
      {
        name: 'Iridescent',
        doubleSided: true,
        pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1], metallicFactor: 0.55, roughnessFactor: 0.16 },
        extensions: { KHR_materials_clearcoat: { clearcoatFactor: 1, clearcoatRoughnessFactor: 0.04 } },
      },
    ],
    accessors: [
      { bufferView: 0, componentType: 5126, count: vertexCount, type: 'VEC3', ...bounds(positions) },
      { bufferView: 1, componentType: 5126, count: vertexCount, type: 'VEC3' },
      { bufferView: 2, componentType: 5126, count: vertexCount, type: 'VEC4' },
      { bufferView: 3, componentType: 5125, count: indices.length, type: 'SCALAR' },
    ],
    bufferViews: chunks.map((chunk, index) => ({
      buffer: 0,
      byteOffset: offsets[index],
      byteLength: chunk.byteLength,
      ...(index === 3 ? { target: 34963 } : { target: 34962 }),
    })),
    buffers: [{ byteLength: binLength }],
  }
  const json = new TextEncoder().encode(JSON.stringify(gltf))
  const jsonLength = pad4(json.byteLength)
  const total = 12 + 8 + jsonLength + 8 + binLength
  const glb = new Uint8Array(total)
  const view = new DataView(glb.buffer)
  view.setUint32(0, 0x46546c67, true)
  view.setUint32(4, 2, true)
  view.setUint32(8, total, true)
  view.setUint32(12, jsonLength, true)
  view.setUint32(16, 0x4e4f534a, true)
  glb.set(json, 20)
  glb.fill(0x20, 20 + json.byteLength, 20 + jsonLength)
  const binStart = 20 + jsonLength
  view.setUint32(binStart, binLength, true)
  view.setUint32(binStart + 4, 0x004e4942, true)
  chunks.forEach((chunk, index) => glb.set(new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength), binStart + 8 + offsets[index]!))
  return glb
}

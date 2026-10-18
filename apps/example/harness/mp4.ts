export interface Mp4Info {
  durationSeconds: number
  width: number
  height: number
  sampleCount: number
}

const containers = new Set(['moov', 'trak', 'mdia', 'minf', 'stbl'])

function findBoxes(view: DataView, start: number, end: number, found: Map<string, number>): void {
  let offset = start
  while (offset + 8 <= end) {
    const compactSize = view.getUint32(offset)
    const type = String.fromCharCode(view.getUint8(offset + 4), view.getUint8(offset + 5), view.getUint8(offset + 6), view.getUint8(offset + 7))
    const headerSize = compactSize === 1 ? 16 : 8
    const size = compactSize === 1 ? Number(view.getBigUint64(offset + 8)) : compactSize === 0 ? end - offset : compactSize
    if (size < headerSize) return
    if (!found.has(type)) found.set(type, offset + headerSize)
    if (containers.has(type)) findBoxes(view, offset + headerSize, offset + size, found)
    offset += size
  }
}

export function readMp4Info(bytes: ArrayBuffer): Mp4Info {
  const view = new DataView(bytes)
  const boxes = new Map<string, number>()
  findBoxes(view, 0, view.byteLength, boxes)
  const mvhd = boxes.get('mvhd')
  const tkhd = boxes.get('tkhd')
  const stsz = boxes.get('stsz')
  if (mvhd == null || tkhd == null || stsz == null) {
    throw new Error(`The MP4 is missing boxes, found ${[...boxes.keys()].join(', ')}.`)
  }
  const movieIs64Bit = view.getUint8(mvhd) === 1
  const timescale = view.getUint32(mvhd + (movieIs64Bit ? 20 : 12))
  const duration = movieIs64Bit ? Number(view.getBigUint64(mvhd + 24)) : view.getUint32(mvhd + 16)
  const sizeOffset = tkhd + (view.getUint8(tkhd) === 1 ? 88 : 76)
  return {
    durationSeconds: duration / timescale,
    width: view.getUint32(sizeOffset) / 65536,
    height: view.getUint32(sizeOffset + 4) / 65536,
    sampleCount: view.getUint32(stsz + 8),
  }
}

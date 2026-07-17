export type ImageGridOutputCount = 4 | 9 | 16 | 25

export interface ImageGridCrop {
  outputCount: ImageGridOutputCount
  gridSize: number
  index: number
  row: number
  column: number
  x: number
  y: number
  width: number
  height: number
  sourceWidth: number
  sourceHeight: number
}

const SUPPORTED_OUTPUT_COUNTS: readonly number[] = [4, 9, 16, 25]

export interface ImageGridCropSession {
  crops: readonly ImageGridCrop[]
  createFile: (crop: ImageGridCrop) => Promise<File>
  close: () => void
}

export function resolveImageGridCrops(
  sourceWidth: number,
  sourceHeight: number,
  outputCount: ImageGridOutputCount,
): ImageGridCrop[] {
  if (!SUPPORTED_OUTPUT_COUNTS.includes(outputCount)) {
    throw new TypeError('仅支持 4、9、16 或 25 宫格。')
  }
  if (
    !Number.isSafeInteger(sourceWidth) || !Number.isSafeInteger(sourceHeight) ||
    sourceWidth <= 0 || sourceHeight <= 0
  ) throw new TypeError('图片像素尺寸无效。')
  const gridSize = Math.sqrt(outputCount)
  if (sourceWidth < gridSize || sourceHeight < gridSize) {
    throw new RangeError(`图片尺寸不足以完成 ${outputCount} 宫格拆分。`)
  }
  return Array.from({ length: outputCount }, (_, offset) => {
    const row = Math.floor(offset / gridSize)
    const column = offset % gridSize
    const x = Math.floor((sourceWidth * column) / gridSize)
    const y = Math.floor((sourceHeight * row) / gridSize)
    const right = Math.floor((sourceWidth * (column + 1)) / gridSize)
    const bottom = Math.floor((sourceHeight * (row + 1)) / gridSize)
    return {
      outputCount,
      gridSize,
      index: offset + 1,
      row,
      column,
      x,
      y,
      width: right - x,
      height: bottom - y,
      sourceWidth,
      sourceHeight,
    }
  })
}

function canvasBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('无法编码图片切片。'))
    }, 'image/png')
  })
}

function assertHttpImageUrl(sourceUrl: string) {
  let parsed: URL
  try {
    parsed = new URL(sourceUrl, window.location.origin)
  } catch {
    throw new TypeError('项目图片地址无效。')
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new TypeError('项目图片地址不受支持。')
  }
  return parsed.toString()
}

async function decodeImageBlob(blob: Blob) {
  try {
    const bitmap = await createImageBitmap(blob)
    return {
      source: bitmap as CanvasImageSource,
      width: bitmap.width,
      height: bitmap.height,
      close: () => bitmap.close(),
    }
  } catch {
    const objectUrl = URL.createObjectURL(blob)
    const image = new Image()
    image.decoding = 'async'
    image.src = objectUrl
    try {
      await image.decode()
      return {
        source: image as CanvasImageSource,
        width: image.naturalWidth,
        height: image.naturalHeight,
        close: () => {
          image.src = ''
          URL.revokeObjectURL(objectUrl)
        },
      }
    } catch (error) {
      image.src = ''
      URL.revokeObjectURL(objectUrl)
      throw error
    }
  }
}

export async function openImageGridCropSession(
  sourceUrl: string,
  outputCount: ImageGridOutputCount,
): Promise<ImageGridCropSession> {
  const response = await fetch(assertHttpImageUrl(sourceUrl), {
    credentials: 'omit',
    mode: 'cors',
  })
  if (!response.ok) throw new Error(`无法读取项目图片（HTTP ${response.status}）。`)
  const decoded = await decodeImageBlob(await response.blob())
  let isClosed = false
  let isCreatingFile = false
  let crops: ImageGridCrop[]
  try {
    crops = resolveImageGridCrops(decoded.width, decoded.height, outputCount)
  } catch (error) {
    decoded.close()
    throw error
  }
  const canvas = document.createElement('canvas')

  function close() {
    if (isClosed) return
    isClosed = true
    decoded.close()
    canvas.width = 1
    canvas.height = 1
  }

  async function createFile(crop: ImageGridCrop) {
    if (isClosed) throw new Error('图片切片会话已结束。')
    if (isCreatingFile) throw new Error('图片切片必须按顺序处理。')
    const expected = crops[crop.index - 1]
    if (!expected || JSON.stringify(expected) !== JSON.stringify(crop)) {
      throw new TypeError('图片切片几何不匹配。')
    }
    isCreatingFile = true
    try {
      canvas.width = crop.width
      canvas.height = crop.height
      const context = canvas.getContext('2d', { alpha: true })
      if (!context) throw new Error('浏览器无法创建图片切片画布。')
      context.drawImage(
        decoded.source,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        crop.width,
        crop.height,
      )
      const blob = await canvasBlob(canvas)
      const digits = Math.max(2, String(crop.outputCount).length)
      return new File(
        [blob],
        `revid-grid-${crop.outputCount}-${String(crop.index).padStart(digits, '0')}.png`,
        { type: 'image/png', lastModified: Date.now() },
      )
    } finally {
      isCreatingFile = false
    }
  }

  return { crops, createFile, close }
}

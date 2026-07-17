import { expect, test } from '@playwright/test'
import {
  resolveImageGridCrops,
  type ImageGridOutputCount,
} from '../../src/modules/canvas/image-grid-split'

const OUTPUT_COUNTS: readonly ImageGridOutputCount[] = [4, 9, 16, 25]

test('4, 9, 16, and 25 crops use exact row-major integer boundaries', () => {
  for (const outputCount of OUTPUT_COUNTS) {
    const gridSize = Math.sqrt(outputCount)
    const crops = resolveImageGridCrops(103, 107, outputCount)
    expect(crops).toHaveLength(outputCount)
    expect(crops.map((crop) => crop.index)).toEqual(
      Array.from({ length: outputCount }, (_, index) => index + 1),
    )
    for (const crop of crops) {
      expect(crop).toEqual({
        outputCount,
        gridSize,
        index: crop.row * gridSize + crop.column + 1,
        row: crop.row,
        column: crop.column,
        x: Math.floor((103 * crop.column) / gridSize),
        y: Math.floor((107 * crop.row) / gridSize),
        width: Math.floor((103 * (crop.column + 1)) / gridSize) - Math.floor((103 * crop.column) / gridSize),
        height: Math.floor((107 * (crop.row + 1)) / gridSize) - Math.floor((107 * crop.row) / gridSize),
        sourceWidth: 103,
        sourceHeight: 107,
      })
    }
  }
})

test('non-divisible crop boundaries cover every source pixel once without gaps or overlap', () => {
  for (const outputCount of OUTPUT_COUNTS) {
    const gridSize = Math.sqrt(outputCount)
    const crops = resolveImageGridCrops(113, 109, outputCount)
    for (let row = 0; row < gridSize; row += 1) {
      const rowCrops = crops.filter((crop) => crop.row === row)
      expect(rowCrops[0].x).toBe(0)
      expect(rowCrops.at(-1)!.x + rowCrops.at(-1)!.width).toBe(113)
      expect(rowCrops.reduce((sum, crop) => sum + crop.width, 0)).toBe(113)
      for (let index = 1; index < rowCrops.length; index += 1) {
        expect(rowCrops[index].x).toBe(rowCrops[index - 1].x + rowCrops[index - 1].width)
      }
    }
    for (let column = 0; column < gridSize; column += 1) {
      const columnCrops = crops.filter((crop) => crop.column === column)
      expect(columnCrops[0].y).toBe(0)
      expect(columnCrops.at(-1)!.y + columnCrops.at(-1)!.height).toBe(109)
      expect(columnCrops.reduce((sum, crop) => sum + crop.height, 0)).toBe(109)
      for (let index = 1; index < columnCrops.length; index += 1) {
        expect(columnCrops[index].y).toBe(columnCrops[index - 1].y + columnCrops[index - 1].height)
      }
    }
    const covered = new Set<string>()
    for (const crop of crops) {
      for (let y = crop.y; y < crop.y + crop.height; y += 1) {
        for (let x = crop.x; x < crop.x + crop.width; x += 1) {
          const key = `${x}:${y}`
          if (covered.has(key)) throw new Error(`crop overlap at ${key}`)
          covered.add(key)
        }
      }
    }
    expect(covered.size).toBe(113 * 109)
  }
})

test('crop geometry rejects unsupported counts, fractional dimensions, and sources smaller than the grid', () => {
  expect(() => resolveImageGridCrops(100, 100, 8 as ImageGridOutputCount)).toThrow('仅支持 4、9、16 或 25 宫格。')
  expect(() => resolveImageGridCrops(100.5, 100, 4)).toThrow('图片像素尺寸无效。')
  expect(() => resolveImageGridCrops(100, 0, 4)).toThrow('图片像素尺寸无效。')
  expect(() => resolveImageGridCrops(4, 4, 25)).toThrow('图片尺寸不足以完成 25 宫格拆分。')
})

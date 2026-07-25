import { expect, test } from '@playwright/test'
import {
  resolveCanvasCardVideoBindings,
  resolveCanvasCardVideoWorkMode,
  resolveCanvasCardWorkModel,
} from '../../src/components/canvas/canvas-card-work-model'
import type { CanvasNode } from '../../src/types/canvas'

function generation(subtype: 'image' | 'video'): CanvasNode {
  return {
    id: `${subtype}-card`,
    type: 'generation',
    title: subtype === 'image' ? '图片生成' : '视频生成',
    x: 0,
    y: 0,
    width: 340,
    height: 220,
    contentData: { subtype, serialization_version: 1 },
  }
}

test('workflow matrix keeps image and video authoring modes semantically separate', () => {
  expect(resolveCanvasCardWorkModel(generation('image'), { isSelected: true }).modes.map((mode) => mode.id)).toEqual([
    'text-to-image',
    'image-to-image',
    'image-upscale',
  ])
  expect(resolveCanvasCardWorkModel(generation('video'), { isSelected: true }).modes.map((mode) => mode.id)).toEqual([
    'text-to-video',
    'first-frame-video',
    'keyframes-video',
  ])
})

test('persistent image-to-video mode wins over reference-based keyframe inference', () => {
  expect(resolveCanvasCardVideoWorkMode({
    persistedGenerationMode: 'image-to-video',
    referenceMode: 'keyframes',
    referenceRoles: ['first-frame', 'last-frame'],
  })).toBe('first-frame-video')
  expect(resolveCanvasCardVideoBindings('image-to-video', [
    { node_id: 'first', asset_id: 'asset-first', role: 'first-frame', order: 0 },
    { node_id: 'last', asset_id: 'asset-last', role: 'last-frame', order: 1 },
  ])).toEqual([
    { node_id: 'first', asset_id: 'asset-first', role: 'first-frame', order: 0 },
  ])
})

test('legacy video cards remain readable through bounded inference', () => {
  expect(resolveCanvasCardVideoWorkMode({
    persistedGenerationMode: null,
    referenceMode: 'keyframes',
    referenceRoles: ['first-frame', 'last-frame'],
  })).toBe('keyframes-video')
  expect(resolveCanvasCardVideoWorkMode({
    persistedGenerationMode: null,
    referenceMode: null,
    referenceRoles: [],
  })).toBe('text-to-video')
})

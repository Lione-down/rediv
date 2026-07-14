import { expect, test } from '@playwright/test'
import {
  GENERATION_IMAGE_LIMIT,
  GENERATION_PROMPT_LIMIT,
  resolveGenerationContext,
} from '../../src/modules/canvas/generation-context'
import type { CanvasConnection, CanvasNode } from '../../src/types/canvas'

function node(id: string, type: CanvasNode['type'], title: string, content = '', contentData: Record<string, unknown> = {}): CanvasNode {
  return { id, type, title, content, contentData, x: 0, y: 0, width: 320, height: 200 }
}

function edge(from: string, targetPort: string, overrides: Partial<CanvasConnection> = {}): CanvasConnection {
  return { id: `${from}-${targetPort}`, from, to: 'generation', sourcePort: 'out', targetPort, status: 'active', active: true, ...overrides }
}

test('connected scripts and images resolve in graph order with visible provenance', () => {
  const generation = node('generation', 'generation', '封面生成', '保持低饱和度', { subtype: 'image', serialization_version: 1 })
  const nodes = [
    node('script-a', 'script', '剧情', '人物从画面左侧入场', { subtype: 'script', serialization_version: 1 }),
    node('script-b', 'script', '摄影', '逆光中景，海雾背景', { subtype: 'prompt', serialization_version: 1 }),
    node('image-a', 'asset', '人物参考', '', { subtype: 'image', serialization_version: 1, asset_id: 'asset-a' }),
    node('image-b', 'result', '色彩参考', '', { subtype: 'image', serialization_version: 1, asset_id: 'asset-b' }),
    generation,
  ]
  const context = resolveGenerationContext(generation, nodes, [
    edge('script-a', 'prompt'), edge('image-a', 'media'), edge('script-b', 'prompt'), edge('image-b', 'media'),
  ])

  expect(context.prompt).toBe('保持低饱和度\n\n【剧情】\n人物从画面左侧入场\n\n【摄影】\n逆光中景，海雾背景')
  expect(context.textSources.map((source) => source.nodeId)).toEqual(['script-a', 'script-b'])
  expect(context.imageIds).toEqual(['asset-a', 'asset-b'])
  expect(context.mediaSources.map((source) => source.state)).toEqual(['included', 'included'])
})

test('invalid, inactive, duplicate, and overflow references cannot silently enter provider input', () => {
  const generation = node('generation', 'generation', '视频生成', '', { subtype: 'video', serialization_version: 1 })
  const images = Array.from({ length: GENERATION_IMAGE_LIMIT + 1 }, (_, index) => (
    node(`image-${index}`, 'asset', `参考 ${index}`, '', { subtype: 'image', serialization_version: 1, asset_id: `asset-${index}` })
  ))
  const missing = node('missing', 'asset', '缺少资源', '', { subtype: 'image', serialization_version: 1 })
  const video = node('video', 'asset', '视频素材', '', { subtype: 'video', serialization_version: 1, asset_id: 'video-asset' })
  const duplicate = node('duplicate', 'result', '重复图像', '', { subtype: 'image', serialization_version: 1, asset_id: 'asset-0' })
  const nodes = [...images, missing, video, duplicate, generation]
  const connections = [
    ...images.map((image) => edge(image.id, 'media')),
    edge('missing', 'media'), edge('video', 'media'), edge('duplicate', 'media'),
    edge('image-0', 'media', { id: 'inactive', status: 'inactive', active: false }),
    edge('image-1', 'prompt', { id: 'wrong-port' }),
  ]
  const context = resolveGenerationContext(generation, nodes, connections)

  expect(context.imageIds).toHaveLength(GENERATION_IMAGE_LIMIT)
  expect(context.mediaSources.map((source) => source.state)).toEqual([
    ...Array.from({ length: GENERATION_IMAGE_LIMIT }, () => 'included'),
    'limit', 'missing-asset', 'unsupported-media', 'duplicate',
  ])
})

test('prompt composition prioritizes local text and clips without adding synthetic ellipsis', () => {
  const generation = node('generation', 'generation', '图片生成', 'L'.repeat(3_990), { subtype: 'image', serialization_version: 1 })
  const script = node('script', 'script', '超长上下文', 'S'.repeat(500), { subtype: 'script', serialization_version: 1 })
  const context = resolveGenerationContext(generation, [script, generation], [edge('script', 'prompt')])

  expect(context.prompt).toHaveLength(GENERATION_PROMPT_LIMIT)
  expect(context.prompt.startsWith('L'.repeat(3_990))).toBe(true)
  expect(context.prompt.endsWith('…')).toBe(false)
})

import { expect, test } from '@playwright/test'
import {
  buildCanvasNodePresentation,
  canvasNodeVisualSize,
  isSupportedCanvasGroupNode,
} from '../../src/components/canvas/canvas-node-presentation'
import type { CanvasNode } from '../../src/types/canvas'

function node(overrides: Partial<CanvasNode>): CanvasNode {
  return {
    id: 'node-1',
    type: 'script',
    title: '节点',
    x: 0,
    y: 0,
    width: 320,
    height: 200,
    ...overrides,
  }
}

test('presentation exposes every registry port for generation nodes', () => {
  const presentation = buildCanvasNodePresentation(node({
    type: 'generation',
    contentData: { subtype: 'video', serialization_version: 1 },
  }))

  expect(presentation.typeLabel).toBe('生成任务')
  expect(presentation.inputPorts.map((port) => port.id)).toEqual(['prompt', 'media'])
  expect(presentation.outputPorts.map((port) => port.id)).toEqual(['out'])
  expect(presentation.isUnsupported).toBe(false)
  expect(presentation.chrome).toEqual({
    bodyKind: 'authoring',
    label: '节点',
    labelPlacement: 'internal',
  })
})

test('canonical authoring uses an internal hierarchy while media and groups retain external labels', () => {
  expect(buildCanvasNodePresentation(node({
    type: 'script',
    title: '剧情脚本',
    content: '第一场：雨夜。',
  })).chrome).toEqual({
    bodyKind: 'authoring',
    label: '剧情脚本',
    labelPlacement: 'internal',
  })

  expect(buildCanvasNodePresentation(node({
    type: 'result',
    title: '参考生成图像',
    contentData: { subtype: 'image', serialization_version: 1, url: '/uploads/result.png' },
  })).chrome).toEqual({
    bodyKind: 'media',
    label: '参考生成图像',
    labelPlacement: 'external',
  })

  expect(buildCanvasNodePresentation(node({
    type: 'group',
    title: '分组 3 个节点',
    contentData: { subtype: 'group', serialization_version: 1 },
  })).chrome).toEqual({
    bodyKind: 'group',
    label: '分组 3 个节点',
    labelPlacement: 'external',
  })
})

test('authoring surfaces retain the approved compact, medium, and long height tiers', () => {
  expect(canvasNodeVisualSize(node({ content: '短镜头。', height: 260 }))).toEqual({ width: 320, height: 160 })
  expect(canvasNodeVisualSize(node({ content: '中'.repeat(100), height: 260 }))).toEqual({ width: 320, height: 190 })
  expect(canvasNodeVisualSize(node({ content: '长'.repeat(180), height: 260 }))).toEqual({ width: 320, height: 220 })
})

test('presentation labels unsupported nodes and exposes no mutation ports', () => {
  const presentation = buildCanvasNodePresentation(node({
    type: 'future-storyboard',
    title: '未来分镜',
    contentData: { serialization_version: 7, payload: { keep: true } },
  }))

  expect(presentation.typeLabel).toBe('不支持的节点 · future-storyboard')
  expect(presentation.content).toContain('原始数据已保留')
  expect(presentation.inputPorts).toEqual([])
  expect(presentation.outputPorts).toEqual([])
  expect(presentation.isUnsupported).toBe(true)
  expect(presentation.chrome).toEqual({
    bodyKind: 'unsupported',
    label: '未来分镜',
    labelPlacement: 'internal',
  })
})

test('future-version group nodes retain unsupported rendering instead of group chrome', () => {
  expect(isSupportedCanvasGroupNode(node({
    type: 'group',
    contentData: { subtype: 'group', serialization_version: 1 },
  }))).toBe(true)
  expect(isSupportedCanvasGroupNode(node({
    type: 'group',
    contentData: { subtype: 'group', serialization_version: 2, future_payload: true },
  }))).toBe(false)
})

test('presentation uses real image previews and honest video placeholders', () => {
  expect(buildCanvasNodePresentation(node({
    type: 'result',
    contentData: { subtype: 'image', serialization_version: 1, url: '/uploads/result.png' },
  })).media).toEqual({ kind: 'image', url: '/uploads/result.png', label: '图片结果', aspectRatio: null })

  expect(buildCanvasNodePresentation(node({
    type: 'result',
    contentData: { subtype: 'image', serialization_version: 1, url: '/uploads/portrait.png', width: 900, height: 1600 },
  })).media).toMatchObject({ aspectRatio: 9 / 16 })

  expect(buildCanvasNodePresentation(node({
    type: 'result',
    contentData: { subtype: 'video', serialization_version: 1 },
  })).media).toEqual({ kind: 'placeholder', label: '视频结果暂未提供预览' })

  expect(buildCanvasNodePresentation(node({
    type: 'asset',
    contentData: { subtype: 'image', serialization_version: 1 },
  })).media).toEqual({ kind: 'placeholder', label: '图片素材暂未提供预览' })
})

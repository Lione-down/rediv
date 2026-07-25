import { expect, test } from '@playwright/test'
import * as canvasGeometry from '../../src/components/canvas/canvas-geometry'
import * as canvasPresentation from '../../src/components/canvas/canvas-node-presentation'
import type { GenerationRuntimePresentation } from '../../src/modules/canvas/generation-runtime-presentation'
import type { CanvasNode } from '../../src/types/canvas'

function requireContractFunction<T extends (...args: never[]) => unknown>(
  source: object,
  name: string,
  fingerprint: string,
): T {
  const candidate = (source as Record<string, unknown>)[name]
  expect(typeof candidate, fingerprint).toBe('function')
  return candidate as T
}

test('canonical card view model owns identity title body lifecycle media ports work surface and result binding', () => {
  const buildCanvasCardViewModel = requireContractFunction<
    (node: CanvasNode, options: {
      isReadOnly: boolean
      isSelected: boolean
      runtimePresentation: GenerationRuntimePresentation | null
    }) => Record<string, unknown>
  >(
    canvasPresentation,
    'buildCanvasCardViewModel',
    'T6-010 RED [canonical-card-view-model-absent]: card presentation is still split across component-local projections',
  )
  const node: CanvasNode = {
    id: 'image-card',
    type: 'generation',
    title: '主角定妆照',
    x: 120,
    y: 80,
    width: 340,
    height: 220,
    status: 'running',
    content: '保持人物身份',
    contentData: {
      subtype: 'image',
      serialization_version: 1,
      active_generation_job_id: 'job-image-card',
      result_asset_id: 'asset-image-card',
      materialized_result_node_id: 'legacy-result-node',
      url: 'https://media.revid.test/character.png',
      aspect_ratio: 1,
    },
  }
  const runtimePresentation: GenerationRuntimePresentation = {
    key: 'job:job-image-card:4:running:provider:42',
    nodeId: node.id,
    phase: 'running',
    label: '模型生成中',
    tone: 'progress',
    source: 'job',
    taskId: 'job-image-card',
    task: null,
    isTerminal: false,
    progressPercent: 42,
    progressStage: 'provider',
    isIndeterminate: false,
  }

  const card = buildCanvasCardViewModel(node, {
    isReadOnly: false,
    isSelected: true,
    runtimePresentation,
  })

  expect(card).toMatchObject({
    nodeId: 'image-card',
    kind: 'image',
    title: '主角定妆照',
    body: {
      content: '保持人物身份',
      canEdit: false,
    },
    lifecycle: {
      phase: 'running',
      label: '模型生成中',
      progressPercent: 42,
      isIndeterminate: false,
    },
    media: {
      kind: 'image',
      url: 'https://media.revid.test/character.png',
    },
    ports: {
      input: expect.any(Array),
      output: expect.any(Array),
    },
    workSurface: {
      family: 'image',
      isAvailable: true,
      isVisible: true,
    },
    result: {
      assetId: 'asset-image-card',
      compatibilityNodeId: 'legacy-result-node',
    },
  })
})

test('canonical card view model maps persisted lifecycle and legacy result asset compatibility', () => {
  const buildCanvasCardViewModel = requireContractFunction<
    (node: CanvasNode) => Record<string, unknown>
  >(
    canvasPresentation,
    'buildCanvasCardViewModel',
    'T6-010 RED [canonical-card-view-model-absent]: card presentation is still split across component-local projections',
  )
  const resultNode: CanvasNode = {
    id: 'legacy-result',
    type: 'result',
    title: '重复标题',
    x: 0,
    y: 0,
    width: 320,
    height: 180,
    status: 'success',
    contentData: {
      subtype: 'image',
      serialization_version: 1,
      asset_id: 'legacy-asset',
      url: 'https://media.revid.test/legacy.png',
    },
  }

  expect(buildCanvasCardViewModel(resultNode)).toMatchObject({
    nodeId: 'legacy-result',
    kind: 'image',
    lifecycle: {
      phase: 'succeeded',
      label: '已完成',
      tone: 'success',
    },
    result: {
      assetId: 'legacy-asset',
      compatibilityNodeId: null,
    },
  })
})

test('canonical card chrome keeps authoring type labels internal while media labels remain external', () => {
  const buildCanvasCardViewModel = requireContractFunction<
    (node: CanvasNode) => {
      chrome: { labelPlacement: 'external' | 'internal' }
    }
  >(
    canvasPresentation,
    'buildCanvasCardViewModel',
    'T6-010 RED [canonical-card-view-model-absent]: card presentation is still split across component-local projections',
  )
  const scriptNode: CanvasNode = {
    id: 'script-card',
    type: 'script',
    title: '分镜脚本',
    x: 0,
    y: 0,
    width: 320,
    height: 180,
    contentData: { subtype: 'script', serialization_version: 1 },
  }
  const imageNode: CanvasNode = {
    id: 'image-card',
    type: 'asset',
    title: '主角',
    x: 0,
    y: 0,
    width: 320,
    height: 180,
    contentData: { subtype: 'image', serialization_version: 1 },
  }

  expect(buildCanvasCardViewModel(scriptNode).chrome.labelPlacement).toBe('internal')
  expect(buildCanvasCardViewModel(imageNode).chrome.labelPlacement).toBe('external')
})

test('reference display titles stay quiet because structured tokens retain stable identity', () => {
  const resolveCanvasCardReferenceDisplayTitle = requireContractFunction<
    (node: CanvasNode, nodes: readonly CanvasNode[]) => string
  >(
    canvasPresentation,
    'resolveCanvasCardReferenceDisplayTitle',
    'T6-010 RED [duplicate-title-reference-disambiguation-absent]: references cannot distinguish duplicate display titles',
  )
  const duplicateA: CanvasNode = {
    id: 'image-source-abc123',
    type: 'asset',
    title: '主角',
    x: 0,
    y: 0,
    width: 320,
    height: 180,
    contentData: { subtype: 'image', serialization_version: 1 },
  }
  const duplicateB: CanvasNode = {
    ...duplicateA,
    id: 'result-source-def456',
    type: 'result',
  }
  const unique: CanvasNode = {
    ...duplicateA,
    id: 'scene-source-xyz789',
    title: '场景',
  }
  const fixture = [duplicateA, duplicateB, unique]

  expect(resolveCanvasCardReferenceDisplayTitle(duplicateA, fixture)).toBe('主角')
  expect(resolveCanvasCardReferenceDisplayTitle(duplicateB, fixture)).toBe('主角')
  expect(resolveCanvasCardReferenceDisplayTitle(unique, fixture)).toBe('场景')
})

test('canonical card geometry derives visible title selection composer and ports from one rectangle', () => {
  const resolveCanvasCardGeometry = requireContractFunction<
    (node: CanvasNode) => {
      visible: { left: number; top: number; width: number; height: number }
      title: { left: number; top: number; width: number; height: number }
      selection: { left: number; top: number; width: number; height: number }
      composer: { left: number; top: number; width: number; height: number }
      ports: {
        input: Array<{ portId: string; x: number; y: number }>
        output: Array<{ portId: string; x: number; y: number }>
      }
    }
  >(
    canvasGeometry,
    'resolveCanvasCardGeometry',
    'T6-010 RED [canonical-card-geometry-absent]: visible rectangles and ports do not share one exported authority',
  )
  const node: CanvasNode = {
    id: 'portrait-card',
    type: 'generation',
    title: '竖版人物',
    x: 100,
    y: 200,
    width: 340,
    height: 220,
    contentData: {
      subtype: 'image',
      serialization_version: 1,
      materialized_result_node_id: 'legacy-result',
      url: 'https://media.revid.test/portrait.png',
      aspect_ratio: 0.5,
    },
  }

  const geometry = resolveCanvasCardGeometry(node)

  expect(geometry.visible).toEqual({ left: 100, top: 200, width: 170, height: 340 })
  expect(geometry.title).toEqual({ left: 100, top: 178, width: 170, height: 18 })
  expect(geometry.selection).toEqual({ left: 99, top: 199, width: 172, height: 342 })
  expect(geometry.composer).toEqual({ left: 100, top: 548, width: 170, height: 76 })
  expect(geometry.ports.input.every((port) => port.x === geometry.visible.left)).toBe(true)
  expect(geometry.ports.output.every(
    (port) => port.x === geometry.visible.left + geometry.visible.width,
  )).toBe(true)
  expect(geometry.ports.input).toEqual([
    { portId: 'prompt', x: geometry.visible.left, y: geometry.visible.top + geometry.visible.height / 3 },
    { portId: 'media', x: geometry.visible.left, y: geometry.visible.top + geometry.visible.height * 2 / 3 },
  ])
  expect(geometry.ports.output).toEqual([
    {
      portId: 'out',
      x: geometry.visible.left + geometry.visible.width,
      y: geometry.visible.top + geometry.visible.height / 2,
    },
  ])
})

test('attached work surface clamps inside the actual stage rectangle and panel insets', () => {
  const resolveCanvasAttachedSurfacePlacement = requireContractFunction<
    (input: {
      nodeSurfaceRect: { left: number; top: number; width: number; height: number }
      stageRect: { left: number; top: number; width: number; height: number }
      insets: { top: number; right: number; bottom: number; left: number }
      surfaceHeight: number
      preferredWidth: number
      gap: number
    }) => {
      left: number
      top: number
      width: number
      anchorX: number
      placement: 'above' | 'below'
    }
  >(
    canvasGeometry,
    'resolveCanvasAttachedSurfacePlacement',
    'T6-010 RED [stage-bounded-attached-surface-absent]: attached surfaces still clamp against window dimensions',
  )

  const placement = resolveCanvasAttachedSurfacePlacement({
    nodeSurfaceRect: { left: 300, top: 360, width: 320, height: 200 },
    stageRect: { left: 0, top: 0, width: 900, height: 600 },
    insets: { top: 50, right: 20, bottom: 30, left: 240 },
    surfaceHeight: 176,
    preferredWidth: 660,
    gap: 16,
  })

  expect(placement).toEqual({
    left: 256,
    top: 168,
    width: 608,
    anchorX: 204,
    placement: 'above',
  })
})

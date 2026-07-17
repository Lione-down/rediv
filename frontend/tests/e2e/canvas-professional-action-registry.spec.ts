import { expect, test } from '@playwright/test'
import {
  PROFESSIONAL_CANVAS_ACTIONS,
  resolveProfessionalCanvasAction,
  resolveProfessionalCanvasActions,
  resolveProjectImageSplitTarget,
  type ProfessionalCanvasActionContext,
} from '../../src/modules/canvas/professional-action-registry'
import type { Asset } from '../../src/types/asset'
import type { CanvasNode } from '../../src/types/canvas'

const PROJECT_ID = 'project-actions'
const CANVAS_ID = 'canvas-actions'
const USER_ID = 'user-actions'

function imageAsset(overrides: Partial<Asset> = {}): Asset {
  return {
    id: 'asset-uploaded-image',
    user_id: USER_ID,
    project_id: PROJECT_ID,
    origin_canvas_id: 'another-canvas-in-project',
    canvas_node_id: null,
    type: 'image',
    url: 'https://media.revid.test/grid-source.svg',
    content_text: '城市夜景参考',
    source: 'upload',
    source_model: null,
    source_task_id: null,
    status: 'active',
    created_at: '2026-07-17T00:00:00Z',
    updated_at: '2026-07-17T00:00:00Z',
    ...overrides,
  }
}

function imageNode(overrides: Partial<CanvasNode> = {}): CanvasNode {
  return {
    id: 'node-uploaded-image',
    type: 'asset',
    title: '城市夜景参考',
    x: 160,
    y: 140,
    width: 320,
    height: 240,
    contentData: {
      subtype: 'image',
      serialization_version: 1,
      asset_id: 'asset-uploaded-image',
      project_id: PROJECT_ID,
      origin_canvas_id: 'another-canvas-in-project',
      url: 'https://media.revid.test/grid-source.svg',
    },
    ...overrides,
  }
}

function context(overrides: Partial<ProfessionalCanvasActionContext> = {}): ProfessionalCanvasActionContext {
  return {
    assets: [imageAsset()],
    canvasId: CANVAS_ID,
    canvasReady: true,
    isBusy: false,
    isReadOnly: false,
    isWorkflowView: true,
    projectId: PROJECT_ID,
    selectedNodes: [],
    userId: USER_ID,
    ...overrides,
  }
}

test('professional action definitions keep stable category and intent order', () => {
  expect(PROFESSIONAL_CANVAS_ACTIONS.map((action) => [action.id, action.category, action.intent])).toEqual([
    ['canvas.create-script', 'create', { type: 'create-node', nodeType: 'script', subtype: 'script' }],
    ['canvas.create-note', 'create', { type: 'create-node', nodeType: 'note', subtype: 'annotation' }],
    ['canvas.create-image-generation', 'create', { type: 'create-node', nodeType: 'generation', subtype: 'image' }],
    ['canvas.create-video-generation', 'create', { type: 'create-node', nodeType: 'generation', subtype: 'video' }],
    ['image.split-4', 'image', { type: 'split-image-grid', outputCount: 4 }],
    ['image.split-9', 'image', { type: 'split-image-grid', outputCount: 9 }],
    ['image.split-16', 'image', { type: 'split-image-grid', outputCount: 16 }],
    ['image.split-25', 'image', { type: 'split-image-grid', outputCount: 25 }],
  ])
})
test('registry resolution is deterministic, searchable, and fail closed for unknown actions', () => {
  const selectedContext = context({ selectedNodes: [imageNode()] })
  const first = resolveProfessionalCanvasActions(selectedContext)
  const second = resolveProfessionalCanvasActions(selectedContext)
  expect(second).toEqual(first)
  expect(first.filter((action) => action.eligibility.eligible).map((action) => action.id)).toEqual(
    PROFESSIONAL_CANVAS_ACTIONS.map((action) => action.id),
  )
  expect(resolveProfessionalCanvasActions(selectedContext, '九宫格').map((action) => action.id)).toEqual(['image.split-9'])
  expect(resolveProfessionalCanvasActions(selectedContext, 'video node').map((action) => action.id)).toEqual(['canvas.create-video-generation'])
  expect(resolveProfessionalCanvasActions(selectedContext, '25 split').map((action) => action.id)).toEqual(['image.split-25'])
  expect(resolveProfessionalCanvasAction(selectedContext, 'missing.action')).toBeNull()
})

test('image split target accepts only one canonical active uploaded project image', () => {
  const validContext = context({ selectedNodes: [imageNode()] })
  expect(resolveProjectImageSplitTarget(validContext)).toEqual({
    asset: imageAsset(),
    node: imageNode(),
  })

  const invalidContexts: ProfessionalCanvasActionContext[] = [
    context({ selectedNodes: [] }),
    context({ selectedNodes: [imageNode(), imageNode({ id: 'second-image' })] }),
    context({ selectedNodes: [imageNode({ type: 'result' })] }),
    context({ selectedNodes: [imageNode({ isLocked: true })] }),
    context({ selectedNodes: [imageNode({ parentNodeId: 'group-a' })] }),
    context({ selectedNodes: [imageNode({ contentData: { ...imageNode().contentData, serialization_version: 2 } })] }),
    context({ selectedNodes: [imageNode({ contentData: { ...imageNode().contentData, subtype: 'video' } })] }),
    context({ selectedNodes: [imageNode({ contentData: { ...imageNode().contentData, project_id: 'foreign-project' } })] }),
    context({ selectedNodes: [imageNode({ contentData: { ...imageNode().contentData, url: 'https://media.revid.test/stale.svg' } })] }),
    context({ assets: [imageAsset({ source: 'generation', source_task_id: 'task-a' })], selectedNodes: [imageNode()] }),
    context({ assets: [imageAsset({ project_id: 'foreign-project' })], selectedNodes: [imageNode()] }),
    context({ assets: [imageAsset({ user_id: 'foreign-user' })], selectedNodes: [imageNode()] }),
    context({ assets: [imageAsset({ type: 'video' })], selectedNodes: [imageNode()] }),
    context({ assets: [imageAsset({ status: 'failed' })], selectedNodes: [imageNode()] }),
    context({ assets: [imageAsset({ url: null })], selectedNodes: [imageNode()] }),
  ]
  for (const invalid of invalidContexts) expect(resolveProjectImageSplitTarget(invalid)).toBeNull()
})

test('eligibility rejects readonly, non-workflow, unavailable, busy, and stale contexts with reasons', () => {
  const invalidContexts = [
    context({ isReadOnly: true }),
    context({ isWorkflowView: false }),
    context({ canvasReady: false }),
    context({ isBusy: true }),
    context({ projectId: '' }),
    context({ canvasId: '' }),
  ]
  for (const invalid of invalidContexts) {
    const resolved = resolveProfessionalCanvasActions(invalid)
    expect(resolved.every((action) => !action.eligibility.eligible)).toBe(true)
    expect(resolved.every((action) => Boolean(action.eligibility.reason))).toBe(true)
  }

  const withoutImage = resolveProfessionalCanvasActions(context())
  expect(withoutImage.slice(0, 4).every((action) => action.eligibility.eligible)).toBe(true)
  expect(withoutImage.slice(4).every((action) => (
    !action.eligibility.eligible && action.eligibility.reason === '请选择一个可用的项目上传图片。'
  ))).toBe(true)
})

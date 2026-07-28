import { expect, test } from '@playwright/test'
import {
  PROFESSIONAL_CANVAS_ACTIONS,
  resolveProfessionalCanvasAction,
  resolveProfessionalCanvasActions,
  resolveProjectImageSplitTarget,
  resolveShotSchemaSource,
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

function scriptNode(overrides: Partial<CanvasNode> = {}): CanvasNode {
  return {
    id: 'script-source',
    type: 'script',
    title: '故事脚本',
    x: 160,
    y: 140,
    width: 320,
    height: 200,
    content: '人物走入黄昏海岸。海浪在身后翻涌。',
    contentData: {
      subtype: 'script',
      serialization_version: 1,
      text: '人物走入黄昏海岸。海浪在身后翻涌。',
    },
    ...overrides,
  }
}

function generationNode(overrides: Partial<CanvasNode> = {}): CanvasNode {
  return {
    id: 'generation-image',
    type: 'generation',
    title: '图片生成',
    x: 360,
    y: 140,
    width: 320,
    height: 200,
    content: '黄昏城市天际线',
    contentData: { subtype: 'image', serialization_version: 1 },
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
    ['script.generate-draft', 'script', { type: 'open-script-authoring', intent: 'script_draft' }],
    ['script.refine', 'script', { type: 'open-script-authoring', intent: 'script_refine' }],
    ['script.create-shot-graph', 'script', { type: 'create-shot-graph' }],
    ['script.create-cinematic-shot-graph', 'script', { type: 'create-cinematic-shot-graph', skillId: 'revid.cinema-script', skillVersion: 1 }],
    ['video.edit-preflight', 'video', { type: 'open-video-edit-preflight', templateId: 'video-edit-preflight', templateVersion: 1 }],
    ['audio.generation-preflight', 'audio', { type: 'open-audio-generation-preflight', templateId: 'audio-generation-preflight', templateVersion: 1 }],
    ['agent-skill.canvas-context', 'agent-skill', { type: 'open-agent-skill-preflight', skillId: 'revid.canvas-context', skillVersion: 1 }],
    ['storyboard.plot-board-4', 'storyboard', { type: 'create-storyboard-recipe', recipeId: 'plot-board-4', recipeVersion: 1 }],
    ['storyboard.shot-board-9', 'storyboard', { type: 'create-storyboard-recipe', recipeId: 'shot-board-9', recipeVersion: 1 }],
    ['storyboard.shot-board-16', 'storyboard', { type: 'create-storyboard-recipe', recipeId: 'shot-board-16', recipeVersion: 1 }],
    ['storyboard.shot-board-25', 'storyboard', { type: 'create-storyboard-recipe', recipeId: 'shot-board-25', recipeVersion: 1 }],
    ['storyboard.character-turnaround', 'storyboard', { type: 'create-storyboard-recipe', recipeId: 'character-turnaround', recipeVersion: 1 }],
    ['storyboard.scene-reference-views', 'storyboard', { type: 'create-storyboard-recipe', recipeId: 'scene-reference-views', recipeVersion: 1 }],
    ['image-operation.expand', 'image-operation', { type: 'create-image-operation', operationId: 'expand', operationVersion: 1 }],
    ['image-operation.inpaint', 'image-operation', { type: 'create-image-operation', operationId: 'inpaint', operationVersion: 1 }],
    ['image-operation.erase', 'image-operation', { type: 'create-image-operation', operationId: 'erase', operationVersion: 1 }],
    ['image-operation.cutout', 'image-operation', { type: 'create-image-operation', operationId: 'cutout', operationVersion: 1 }],
    ['image-operation.upscale', 'image-operation', { type: 'create-image-operation', operationId: 'upscale', operationVersion: 1 }],
    ['image-operation.region', 'image-operation', { type: 'create-image-operation', operationId: 'region', operationVersion: 1 }],
    ['image-operation.fusion', 'image-operation', { type: 'create-image-operation', operationId: 'fusion', operationVersion: 1 }],
    ['image.split-4', 'image', { type: 'split-image-grid', outputCount: 4 }],
    ['image.split-9', 'image', { type: 'split-image-grid', outputCount: 9 }],
    ['image.split-16', 'image', { type: 'split-image-grid', outputCount: 16 }],
    ['image.split-25', 'image', { type: 'split-image-grid', outputCount: 25 }],
  ])
})

test('script authoring actions require one exact editable script and refine requires content', () => {
  const populated = context({ selectedNodes: [scriptNode()] })
  const blank = context({ selectedNodes: [scriptNode({ content: '', contentData: { subtype: 'script', serialization_version: 1, text: '' } })] })
  expect(resolveProfessionalCanvasAction(populated, 'script.generate-draft')?.eligibility).toEqual({ eligible: true })
  expect(resolveProfessionalCanvasAction(populated, 'script.refine')?.eligibility).toEqual({ eligible: true })
  expect(resolveProfessionalCanvasAction(blank, 'script.generate-draft')?.eligibility).toEqual({ eligible: true })
  expect(resolveProfessionalCanvasAction(blank, 'script.refine')?.eligibility.eligible).toBe(false)
})

test('video edit preflight action requires an editable project-owned video source', () => {
  const video = generationNode({
    id: 'video-result', type: 'result', contentData: { subtype: 'video', serialization_version: 1, asset_id: 'asset-image', project_id: PROJECT_ID, url: 'https://cdn.example.com/image.png' },
  })
  const assets = [{ ...imageAsset(), id: 'asset-image', type: 'video' as const, url: 'https://cdn.example.com/image.png' }]
  const valid = context({ assets, selectedNodes: [video] })
  expect(resolveProfessionalCanvasAction(valid, 'video.edit-preflight')?.eligibility).toEqual({ eligible: true })
  expect(resolveProfessionalCanvasAction(context({ selectedNodes: [video] }), 'video.edit-preflight')?.eligibility).toEqual({
    eligible: false, reason: '请选择当前项目中可用的视频素材或结果节点。',
  })
})

test('audio preflight action requires one bounded script or paired audio/video sources', () => {
  const script = context({ selectedNodes: [scriptNode()] })
  expect(resolveProfessionalCanvasAction(script, 'audio.generation-preflight')?.eligibility).toEqual({ eligible: true })
  expect(resolveProfessionalCanvasAction(context(), 'audio.generation-preflight')?.eligibility).toEqual({
    eligible: false, reason: '请选择一条可用脚本，或一条音频和一条视频素材。',
  })
})

test('Agent/Skill context preflight requires a bounded editable current-Canvas selection', () => {
  const valid = context({ selectedNodes: [scriptNode()] })
  expect(resolveProfessionalCanvasAction(valid, 'agent-skill.canvas-context')?.eligibility).toEqual({ eligible: true })
  for (const invalid of [
    context(),
    context({ selectedNodes: [scriptNode({ isLocked: true })] }),
    context({ selectedNodes: Array.from({ length: 26 }, (_, index) => scriptNode({ id: `script-${index}` })) }),
    context({ selectedNodes: [scriptNode({ id: '' })] }),
  ]) {
    expect(resolveProfessionalCanvasAction(invalid, 'agent-skill.canvas-context')?.eligibility).toEqual({
      eligible: false, reason: '请选择 1 至 25 个当前画布可用节点。',
    })
  }
})
test('registry resolution is deterministic, searchable, and fail closed for unknown actions', () => {
  const selectedContext = context({ selectedNodes: [imageNode()] })
  const first = resolveProfessionalCanvasActions(selectedContext)
  const second = resolveProfessionalCanvasActions(selectedContext)
  expect(second).toEqual(first)
  expect(first.filter((action) => action.eligibility.eligible).map((action) => action.id)).toEqual([
    'canvas.create-script', 'canvas.create-note', 'canvas.create-image-generation', 'canvas.create-video-generation',
    'agent-skill.canvas-context',
    'image.split-4', 'image.split-9', 'image.split-16', 'image.split-25',
  ])
  expect(resolveProfessionalCanvasActions(selectedContext, '九宫格')
    .filter((action) => action.eligibility.eligible).map((action) => action.id)).toEqual(['image.split-9'])
  expect(resolveProfessionalCanvasActions(selectedContext, 'video node').map((action) => action.id)).toEqual(['canvas.create-video-generation'])
  expect(resolveProfessionalCanvasActions(selectedContext, '25 split').map((action) => action.id)).toEqual(['image.split-25'])
  expect(resolveProfessionalCanvasActions(context({ selectedNodes: [scriptNode()] }), 'shot storyboard')
    .filter((action) => action.eligibility.eligible).map((action) => action.id)).toEqual([
      'script.create-shot-graph', 'script.create-cinematic-shot-graph', 'audio.generation-preflight',
      'storyboard.shot-board-9', 'storyboard.shot-board-16', 'storyboard.shot-board-25',
    ])
  expect(resolveProfessionalCanvasActions(context({ selectedNodes: [scriptNode()] }), 'agnes script')
    .filter((action) => action.eligibility.eligible).map((action) => action.id)).toEqual([
      'script.generate-draft', 'script.refine', 'script.create-cinematic-shot-graph',
    ])
  expect(resolveProfessionalCanvasAction(selectedContext, 'missing.action')).toBeNull()
})

test('shot graph source accepts only one exact bounded canonical script', () => {
  const valid = context({ selectedNodes: [scriptNode()] })
  expect(resolveShotSchemaSource(valid)).toEqual(scriptNode())
  expect(resolveProfessionalCanvasAction(valid, 'script.create-shot-graph')?.eligibility).toEqual({ eligible: true })

  const invalid = [
    context({ selectedNodes: [] }),
    context({ selectedNodes: [scriptNode(), scriptNode({ id: 'script-b' })] }),
    context({ selectedNodes: [scriptNode({ isLocked: true })] }),
    context({ selectedNodes: [scriptNode({ parentNodeId: 'group-a' })] }),
    context({ selectedNodes: [scriptNode({ type: 'note' })] }),
    context({ selectedNodes: [scriptNode({ contentData: { subtype: 'prompt', serialization_version: 1, text: '画面' } })] }),
    context({ selectedNodes: [scriptNode({ contentData: { subtype: 'script', serialization_version: 2, text: '画面' } })] }),
    context({ selectedNodes: [scriptNode({ content: '', contentData: { subtype: 'script', serialization_version: 1, text: '' } })] }),
    context({ selectedNodes: [scriptNode({ content: 'x'.repeat(12001), contentData: { subtype: 'script', serialization_version: 1, text: 'x'.repeat(12001) } })] }),
  ]
  for (const candidate of invalid) {
    expect(resolveShotSchemaSource(candidate)).toBeNull()
    expect(resolveProfessionalCanvasAction(candidate, 'script.create-shot-graph')?.eligibility).toEqual({
      eligible: false,
      reason: '请选择一个可用的脚本节点。',
    })
  }
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
  expect(withoutImage.filter((action) => action.category === 'create').every((action) => action.eligibility.eligible)).toBe(true)
  expect(withoutImage.find((action) => action.id === 'script.create-shot-graph')?.eligibility).toEqual({
    eligible: false, reason: '请选择一个可用的脚本节点。',
  })
  expect(withoutImage.filter((action) => action.category === 'image').every((action) => (
    !action.eligibility.eligible && action.eligibility.reason === '请选择一个可用的项目上传图片。'
  ))).toBe(true)
})

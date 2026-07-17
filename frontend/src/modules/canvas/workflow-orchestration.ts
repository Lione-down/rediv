import type { CanvasConnection, CanvasNode } from '../../types/canvas'
import {
  resolveGenerationRequestContext,
  type GenerationCapabilities,
} from './generation-parameters'

export const WORKFLOW_ORCHESTRATION_CONTRACT_VERSION = 1
const WORKFLOW_TEMPLATE_ID = 'canvas-generation-batch'

export type WorkflowMediaType = 'image' | 'video'
export type WorkflowMockRunState = 'running' | 'paused' | 'cancelled' | 'succeeded'
export type WorkflowMockStepState = 'queued' | 'running' | 'paused' | 'cancelled' | 'succeeded'

export interface WorkflowTemplateReference {
  id: string
  version: number
}

export interface WorkflowTemplate extends WorkflowTemplateReference {
  contract_version: 1
  execution_mode: 'mock'
  title: string
}

export interface WorkflowQuotaEstimate {
  image: number
  video: number
  total: number
}

export interface WorkflowPreflightError {
  code:
    | 'capability_unavailable'
    | 'dependency_cycle'
    | 'duplicate_selection'
    | 'foreign_endpoint'
    | 'invalid_canvas_scope'
    | 'invalid_generation_node'
    | 'invalid_template'
    | 'missing_selection'
    | 'quota_insufficient'
  message: string
}

export interface WorkflowPreflightStep {
  node_id: string
  media_type: WorkflowMediaType
  order: number
  depends_on: string[]
}

export interface WorkflowPreflight {
  canvas_id: string
  contract_version: 1
  errors: WorkflowPreflightError[]
  estimate: WorkflowQuotaEstimate
  execution_mode: 'mock'
  executable: boolean
  fingerprint: string
  project_id: string
  steps: WorkflowPreflightStep[]
  template: WorkflowTemplateReference
}

export interface WorkflowPreflightInput {
  capabilities: GenerationCapabilities | null
  canvasId: string
  connections: readonly CanvasConnection[]
  nodes: readonly CanvasNode[]
  projectId: string
  quotas: { image: number; text: number; video: number }
  selectedNodeIds: readonly string[]
  template: WorkflowTemplateReference
}

export interface WorkflowMockRunStep extends WorkflowPreflightStep {
  state: WorkflowMockStepState
}

export interface WorkflowMockRun {
  canvas_id: string
  contract_version: 1
  execution_mode: 'mock'
  fingerprint: string
  project_id: string
  state: WorkflowMockRunState
  steps: WorkflowMockRunStep[]
  template: WorkflowTemplateReference
}

export interface WorkflowMockStorage {
  getItem(key: string): string | null
  removeItem(key: string): void
  setItem(key: string, value: string): void
}

const CANVAS_GENERATION_BATCH_TEMPLATE: WorkflowTemplate = {
  contract_version: WORKFLOW_ORCHESTRATION_CONTRACT_VERSION,
  id: WORKFLOW_TEMPLATE_ID,
  version: 1,
  execution_mode: 'mock',
  title: '画布生成批处理',
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && Boolean(value.trim())
}

function sortedUnique(values: readonly string[]) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right))
}

function sameStringList(left: readonly string[], right: readonly string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function planFingerprint(input: {
  canvasId: string
  projectId: string
  steps: readonly WorkflowPreflightStep[]
  template: WorkflowTemplateReference
}) {
  return JSON.stringify({
    canvas_id: input.canvasId,
    project_id: input.projectId,
    steps: input.steps.map((step) => ({
      depends_on: step.depends_on,
      media_type: step.media_type,
      node_id: step.node_id,
      order: step.order,
    })),
    template: input.template,
  })
}

function error(code: WorkflowPreflightError['code'], message: string): WorkflowPreflightError {
  return { code, message }
}

function mediaTypeForNode(node: CanvasNode): WorkflowMediaType | null {
  if (node.type !== 'generation' || node.isLocked) return null
  const subtype = node.contentData?.subtype
  return subtype === 'image' || subtype === 'video' ? subtype : null
}

function emptyEstimate(): WorkflowQuotaEstimate {
  return { image: 0, video: 0, total: 0 }
}

function failedPreflight(
  input: WorkflowPreflightInput,
  errors: WorkflowPreflightError[],
): WorkflowPreflight {
  return {
    canvas_id: input.canvasId,
    contract_version: WORKFLOW_ORCHESTRATION_CONTRACT_VERSION,
    errors,
    estimate: emptyEstimate(),
    execution_mode: 'mock',
    executable: false,
    fingerprint: '',
    project_id: input.projectId,
    steps: [],
    template: { id: input.template.id, version: input.template.version },
  }
}

function upstreamGenerationDependencies(
  nodeId: string,
  selected: ReadonlySet<string>,
  incoming: ReadonlyMap<string, string[]>,
): string[] {
  const dependencies = new Set<string>()
  const visited = new Set<string>([nodeId])
  const pending = [...(incoming.get(nodeId) ?? [])]
  while (pending.length) {
    const current = pending.pop()!
    if (current === nodeId) {
      if (selected.has(current)) dependencies.add(current)
      continue
    }
    if (visited.has(current)) continue
    visited.add(current)
    if (selected.has(current)) dependencies.add(current)
    for (const upstream of incoming.get(current) ?? []) pending.push(upstream)
  }
  return sortedUnique([...dependencies])
}

function topologicalSteps(
  selectedIds: readonly string[],
  mediaById: ReadonlyMap<string, WorkflowMediaType>,
  incoming: ReadonlyMap<string, string[]>,
): WorkflowPreflightStep[] | null {
  const selected = new Set(selectedIds)
  const dependencies = new Map(selectedIds.map((nodeId) => [
    nodeId,
    upstreamGenerationDependencies(nodeId, selected, incoming),
  ]))
  const remaining = new Set(selectedIds)
  const completed = new Set<string>()
  const steps: WorkflowPreflightStep[] = []
  while (remaining.size) {
    const next = [...remaining]
      .filter((nodeId) => (dependencies.get(nodeId) ?? []).every((dependency) => completed.has(dependency)))
      .sort((left, right) => left.localeCompare(right))[0]
    if (!next) return null
    remaining.delete(next)
    completed.add(next)
    steps.push({
      node_id: next,
      media_type: mediaById.get(next)!,
      order: steps.length + 1,
      depends_on: dependencies.get(next) ?? [],
    })
  }
  return steps
}

function quotaEstimate(steps: readonly WorkflowPreflightStep[]): WorkflowQuotaEstimate {
  const image = steps.filter((step) => step.media_type === 'image').length
  const video = steps.filter((step) => step.media_type === 'video').length
  return { image, video, total: image + video }
}

export function resolveWorkflowTemplate(id: string, version: number): WorkflowTemplate | null {
  if (id !== CANVAS_GENERATION_BATCH_TEMPLATE.id || version !== CANVAS_GENERATION_BATCH_TEMPLATE.version) return null
  return { ...CANVAS_GENERATION_BATCH_TEMPLATE }
}

export function preflightWorkflowBatch(input: WorkflowPreflightInput): WorkflowPreflight {
  const template = resolveWorkflowTemplate(input.template.id, input.template.version)
  if (!template) return failedPreflight(input, [error('invalid_template', '工作流模板版本不可用。')])
  if (!isNonEmptyString(input.projectId) || !isNonEmptyString(input.canvasId)) {
    return failedPreflight(input, [error('invalid_canvas_scope', '项目或画布范围无效。')])
  }
  if (!input.capabilities) return failedPreflight(input, [error('capability_unavailable', '生成 capability 尚未加载，批处理已阻止。')])
  if (!input.selectedNodeIds.length) return failedPreflight(input, [error('missing_selection', '请选择至少一个生成节点。')])
  if (new Set(input.selectedNodeIds).size !== input.selectedNodeIds.length) {
    return failedPreflight(input, [error('duplicate_selection', '批处理选择包含重复节点。')])
  }

  const nodes = new Map<string, CanvasNode>()
  for (const node of input.nodes) {
    if (!isNonEmptyString(node.id) || nodes.has(node.id)) {
      return failedPreflight(input, [error('foreign_endpoint', '画布节点集合无效。')])
    }
    nodes.set(node.id, node)
  }
  const incoming = new Map<string, string[]>()
  for (const connection of input.connections) {
    if (!nodes.has(connection.from) || !nodes.has(connection.to)) {
      return failedPreflight(input, [error('foreign_endpoint', '连接包含当前画布外的端点。')])
    }
    const sources = incoming.get(connection.to) ?? []
    sources.push(connection.from)
    incoming.set(connection.to, sources)
  }

  const selectedIds = sortedUnique(input.selectedNodeIds)
  const mediaById = new Map<string, WorkflowMediaType>()
  for (const nodeId of selectedIds) {
    const node = nodes.get(nodeId)
    const mediaType = node ? mediaTypeForNode(node) : null
    if (!node || !mediaType) {
      return failedPreflight(input, [error('invalid_generation_node', '批处理只支持当前画布中的可用图片或视频生成节点。')])
    }
    const context = resolveGenerationRequestContext(
      node,
      mediaType,
      input.nodes,
      input.connections,
      input.capabilities,
    )
    if (context.parameterError || (!context.isRecipe && !context.prompt)) {
      return failedPreflight(input, [error('invalid_generation_node', context.parameterError || '生成节点缺少可执行提示词。')])
    }
    if (context.imageOperation?.id === 'region') {
      return failedPreflight(input, [error('invalid_generation_node', '区域标记不会创建生成任务，不能加入批处理。')])
    }
    mediaById.set(nodeId, mediaType)
  }

  const steps = topologicalSteps(selectedIds, mediaById, incoming)
  if (!steps) return failedPreflight(input, [error('dependency_cycle', '批处理依赖存在循环，当前执行已阻止。')])
  const estimate = quotaEstimate(steps)
  if (!Number.isInteger(input.quotas.image) || !Number.isInteger(input.quotas.video) ||
    input.quotas.image < estimate.image || input.quotas.video < estimate.video) {
    return failedPreflight(input, [error('quota_insufficient', '现有 quota 不足以覆盖批处理估算，当前执行已阻止。')])
  }
  return {
    canvas_id: input.canvasId,
    contract_version: WORKFLOW_ORCHESTRATION_CONTRACT_VERSION,
    errors: [],
    estimate,
    execution_mode: template.execution_mode,
    executable: true,
    fingerprint: planFingerprint({ canvasId: input.canvasId, projectId: input.projectId, steps, template }),
    project_id: input.projectId,
    steps,
    template: { id: template.id, version: template.version },
  }
}

function cloneRun(run: WorkflowMockRun | null) {
  return run ? JSON.parse(JSON.stringify(run)) as WorkflowMockRun : null
}

function storageKey(identity: Pick<WorkflowPreflight, 'canvas_id' | 'project_id'>) {
  return `revid:workflow-orchestration:v1:${identity.project_id}:${identity.canvas_id}`
}

function hasExactSteps(run: WorkflowMockRun, plan: WorkflowPreflight) {
  return run.steps.length === plan.steps.length && run.steps.every((step, index) => {
    const expected = plan.steps[index]
    return step.node_id === expected.node_id && step.media_type === expected.media_type &&
      step.order === expected.order && sameStringList(step.depends_on, expected.depends_on)
  })
}

function parseStoredRun(raw: string | null, plan: WorkflowPreflight): WorkflowMockRun | null {
  if (!raw) return null
  try {
    const value: unknown = JSON.parse(raw)
    if (!isRecord(value) || value.contract_version !== WORKFLOW_ORCHESTRATION_CONTRACT_VERSION ||
      value.execution_mode !== 'mock' || value.project_id !== plan.project_id ||
      value.canvas_id !== plan.canvas_id || value.fingerprint !== plan.fingerprint ||
      !isRecord(value.template) || value.template.id !== plan.template.id ||
      value.template.version !== plan.template.version || !Array.isArray(value.steps) ||
      !['running', 'paused', 'cancelled', 'succeeded'].includes(String(value.state))) return null
    const run = value as unknown as WorkflowMockRun
    if (!run.steps.every((step) => isRecord(step) &&
      ['queued', 'running', 'paused', 'cancelled', 'succeeded'].includes(String(step.state)))) return null
    const runningCount = run.steps.filter((step) => step.state === 'running').length
    const pausedCount = run.steps.filter((step) => step.state === 'paused').length
    if ((run.state === 'running' && runningCount !== 1) ||
      (run.state === 'paused' && pausedCount !== 1) ||
      ((run.state === 'cancelled' || run.state === 'succeeded') && (runningCount || pausedCount))) return null
    return hasExactSteps(run, plan) ? cloneRun(run) : null
  } catch {
    return null
  }
}

function assertExecutableMockPlan(plan: WorkflowPreflight) {
  if (!plan.executable || plan.execution_mode !== 'mock' || plan.errors.length) {
    throw new Error('工作流预检未通过，无法启动 mock 批处理。')
  }
}

export function createWorkflowMockRunController(storage: WorkflowMockStorage) {
  let run: WorkflowMockRun | null = null

  function persist() {
    if (run) storage.setItem(storageKey(run), JSON.stringify(run))
  }

  function current() {
    return cloneRun(run)
  }

  function currentFor(plan: WorkflowPreflight) {
    if (!run || run.project_id !== plan.project_id || run.canvas_id !== plan.canvas_id ||
      run.fingerprint !== plan.fingerprint) return null
    return current()
  }

  function start(plan: WorkflowPreflight) {
    assertExecutableMockPlan(plan)
    run = {
      canvas_id: plan.canvas_id,
      contract_version: WORKFLOW_ORCHESTRATION_CONTRACT_VERSION,
      execution_mode: 'mock',
      fingerprint: plan.fingerprint,
      project_id: plan.project_id,
      state: 'running',
      steps: plan.steps.map((step, index) => ({ ...step, state: index === 0 ? 'running' : 'queued' })),
      template: { ...plan.template },
    }
    persist()
    return current()!
  }

  function advance() {
    if (!run || run.state !== 'running') return current()
    const activeIndex = run.steps.findIndex((step) => step.state === 'running')
    if (activeIndex < 0) return current()
    run.steps[activeIndex].state = 'succeeded'
    const next = run.steps.find((step) => step.state === 'queued')
    if (next) next.state = 'running'
    else run.state = 'succeeded'
    persist()
    return current()
  }

  function cancel() {
    if (!run || !['running', 'paused'].includes(run.state)) return current()
    run.state = 'cancelled'
    for (const step of run.steps) {
      if (step.state === 'running' || step.state === 'paused' || step.state === 'queued') step.state = 'cancelled'
    }
    persist()
    return current()
  }

  function recover(plan: WorkflowPreflight) {
    assertExecutableMockPlan(plan)
    const restored = parseStoredRun(storage.getItem(storageKey(plan)), plan)
    if (!restored || restored.state !== 'running') return null
    run = restored
    run.state = 'paused'
    for (const step of run.steps) if (step.state === 'running') step.state = 'paused'
    persist()
    return current()
  }

  function resume(plan: WorkflowPreflight) {
    assertExecutableMockPlan(plan)
    if (!run || run.state !== 'paused' || run.fingerprint !== plan.fingerprint) {
      throw new Error('没有可恢复的 mock 批处理。')
    }
    run.state = 'running'
    const paused = run.steps.find((step) => step.state === 'paused')
    if (paused) paused.state = 'running'
    else run.steps.find((step) => step.state === 'queued')!.state = 'running'
    persist()
    return current()!
  }

  return { advance, cancel, current, currentFor, recover, resume, start }
}

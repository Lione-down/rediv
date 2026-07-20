import { toRaw, type ComputedRef } from 'vue'
import { resolveShotSchemaSource, type ProfessionalCanvasActionContext } from '../../../modules/canvas/professional-action-registry'
import { createShotGraphInsertCommand } from '../../../modules/canvas/shot-graph'
import { requestMockShotSchema } from '../../../modules/canvas/shot-schema-service'
import { request } from '../../../api/request'
import {
  loadCinematicSkillCapabilities,
  loadCinematicSkillSources,
  requestCinematicSkillPreflight,
  type CinematicGenerationHandoff,
} from '../../../modules/canvas/cinematic-skills'
import { createGenerationClientRequestId, requestCanvasGeneration } from '../../../modules/canvas/generation-service'
import { parseShotSchemaDocument } from '../../../modules/canvas/shot-schema'
import { useProjectResourceStore } from '../../../modules/canvas/project-resource-store'
import { useAuthStore } from '../../../store/auth'
import { useCanvasStore } from '../../../store/canvas'
import type { CanvasNode } from '../../../types/canvas'
import {
  buildCinematicDirectorHandoff,
  requestCinematicDirectorPreflight,
  type CinematicDirectorPreflightInput,
} from '../../../modules/canvas/cinematic-director-preflight'
import { parseCinematicDirectorBrief, type CinematicDirectorBrief } from '../../../modules/canvas/cinematic-director'
import { parseCinematicSequenceState } from '../../../modules/canvas/cinematic-sequence'
import {
  createApplyCinematicSequenceCommand,
  resolveNextUnresolvedCinematicClip,
} from '../../../modules/canvas/cinematic-sequence-command'

interface CanvasShotSchemaOptions {
  canvasId: ComputedRef<string>
  projectId: ComputedRef<string>
}

function snapshotNode(node: CanvasNode) {
  return structuredClone(toRaw(node))
}

function sourceText(node: CanvasNode) {
  const value = node.content ?? node.contentData?.text
  return typeof value === 'string' ? value.trim() : ''
}

export function useCanvasShotSchema(options: CanvasShotSchemaOptions) {
  const canvasStore = useCanvasStore()
  const authStore = useAuthStore()
  const resourceStore = useProjectResourceStore()

  function currentSource() {
    const projectId = options.projectId.value
    const canvasId = options.canvasId.value
    if (
      !canvasStore.hasLoaded || canvasStore.activeProjectId !== projectId ||
      canvasStore.activeCanvasId !== canvasId
    ) return null
    return resolveShotSchemaSource({
      assets: [],
      canvasId,
      canvasReady: true,
      isBusy: false,
      isReadOnly: false,
      isWorkflowView: true,
      projectId,
      selectedNodes: canvasStore.selectedNodes,
      userId: 'current-user',
    } satisfies ProfessionalCanvasActionContext)
  }

  async function commitShotGraph(sourceSnapshot: CanvasNode, script: string, schema: ReturnType<typeof parseShotSchemaDocument>) {
    const projectId = options.projectId.value
    const canvasId = options.canvasId.value
    const current = currentSource()
    if (
      !current || current.id !== sourceSnapshot.id || sourceText(current) !== script ||
      options.projectId.value !== projectId || options.canvasId.value !== canvasId
    ) throw new Error('脚本上下文已变化，请重新执行。')
    const command = createShotGraphInsertCommand({
      sourceNode: sourceSnapshot,
      schema,
      existingNodes: canvasStore.nodes,
    })
    if (!command) throw new Error('脚本上下文已变化，请重新执行。')
    await canvasStore.dispatchCommand({ source: 'toolbar', command })
    return command.nodes.at(-1)?.id ?? null
  }

  async function createShotGraph(requestedShotCount?: number) {
    const projectId = options.projectId.value
    const canvasId = options.canvasId.value
    const source = currentSource()
    if (!source) throw new Error('请选择一个可用的脚本节点。')
    const sourceSnapshot = snapshotNode(source)
    const script = sourceText(sourceSnapshot)
    const schema = await requestMockShotSchema({
      projectId, canvasId, sourceScriptNodeId: sourceSnapshot.id, script, requestedShotCount,
    })
    return commitShotGraph(sourceSnapshot, script, schema)
  }

  async function createCinematicShotGraph(requestedShotCount?: number) {
    const projectId = options.projectId.value
    const canvasId = options.canvasId.value
    const source = currentSource()
    if (!source) throw new Error('请选择一个可用的脚本节点。')
    const sourceSnapshot = snapshotNode(source)
    const script = sourceText(sourceSnapshot)
    const shotCount = requestedShotCount ?? 8
    if (authStore.quotas.text < 1) throw new Error('text quota 不足，cinematic script Skill 已阻止。')
    let schema
    {
      const [capabilities, sources] = await Promise.all([
        loadCinematicSkillCapabilities(projectId, canvasId, request),
        loadCinematicSkillSources(projectId, canvasId, request),
      ])
      const provider = capabilities.providers.find((candidate) => candidate.id === 'agnes')
      const model = provider?.models.find((candidate) => candidate.media_type === 'text')
      const sourceBinding = sources.items.find((candidate) => candidate.node_id === sourceSnapshot.id)
      if (!provider || !model || !sourceBinding) throw new Error('cinematic script Skill capability 或脚本来源当前不可用。')
      const userInstruction = `${script}\n请求镜头数量：${shotCount}`
      const generationParameters = { image_ids: [], requested_shot_count: shotCount, aspect_ratio: '16:9' }
      const preflight = await requestCinematicSkillPreflight({
        projectId,
        canvasId,
        canvasRevision: sources.canvas_revision,
        skillId: 'revid.cinema-script',
        skillVersion: 1,
        providerId: provider.id,
        modelId: model.id,
        userInstruction,
        mentions: [{
          node_id: sourceBinding.node_id,
          display_title: sourceBinding.title,
          role: 'story',
          instruction: '作为可编辑叙事来源，保持角色设定并拆分为可生成镜头',
          source_revision: sourceBinding.source_revision,
        }],
        generationParameters,
      }, request)
      const handoff: CinematicGenerationHandoff = {
        skill_id: 'revid.cinema-script',
        skill_version: 1,
        canvas_revision: sources.canvas_revision,
        provider_id: provider.id,
        model_id: model.id,
        user_instruction: userInstruction,
        mentions: [{
          node_id: sourceBinding.node_id,
          role: 'story',
          instruction: '作为可编辑叙事来源，保持角色设定并拆分为可生成镜头',
          source_revision: sourceBinding.source_revision,
        }],
        generation_parameters: generationParameters,
        submitted_preflight: preflight,
      }
      const canonicalPrompt = preflight.canonical_request.optimized_prompt
      if (typeof canonicalPrompt !== 'string') throw new Error('cinematic script Skill preflight 无效。')
      const response = await requestCanvasGeneration({
        mediaType: 'text', clientRequestId: createGenerationClientRequestId(),
        projectId, originCanvasId: canvasId, canvasNodeId: sourceSnapshot.id,
        prompt: canonicalPrompt, cinematicHandoff: handoff,
      }, authStore, request)
      if (!response.content || !response.asset) throw new Error('cinematic script Skill 响应缺少 strict shot document。')
      schema = parseShotSchemaDocument(JSON.parse(response.content))
      resourceStore.upsertAsset(response.asset)
      resourceStore.upsertTask(response.generation_task)
    }
    return commitShotGraph(sourceSnapshot, script, schema)
  }

  async function createCinematicSequencePlan(
    rawDirectorBrief: CinematicDirectorBrief,
    requestedClipCount = 8,
  ) {
    const projectId = options.projectId.value
    const canvasId = options.canvasId.value
    const source = currentSource()
    if (!source) throw new Error('请选择一个可用的脚本节点。')
    if (!Number.isInteger(requestedClipCount) || requestedClipCount < 1 || requestedClipCount > 25) {
      throw new Error('sequence clip 数量必须在 1 到 25 之间。')
    }
    const sourceSnapshot = snapshotNode(source)
    const script = sourceText(sourceSnapshot)
    const directorBrief = parseCinematicDirectorBrief(rawDirectorBrief)
    if (directorBrief.source_script_node_id !== sourceSnapshot.id) {
      throw new Error('director brief 与当前脚本不匹配。')
    }
    if (authStore.quotas.text < 1) throw new Error('text quota 不足，sequence planning 已阻止。')
    const [capabilities, sources] = await Promise.all([
      loadCinematicSkillCapabilities(projectId, canvasId, request),
      loadCinematicSkillSources(projectId, canvasId, request),
    ])
    const provider = capabilities.providers.find((candidate) => candidate.id === 'agnes')
    const model = provider?.models.find((candidate) => candidate.media_type === 'text')
    const sourceBinding = sources.items.find((candidate) => candidate.node_id === sourceSnapshot.id)
    if (!provider || !model || !sourceBinding || sourceBinding.source_revision !== directorBrief.source_revision) {
      throw new Error('director brief 或脚本来源已变化，请重新规划。')
    }
    const preflightInput: CinematicDirectorPreflightInput = {
      projectId, canvasId, canvasRevision: sources.canvas_revision,
      skillId: 'revid.cinema-script', providerId: provider.id, modelId: model.id,
      userInstruction: `把明确 director brief 规划为 ${requestedClipCount} 个连续 clip，只返回严格 sequence JSON。`,
      mentions: [{
        node_id: sourceBinding.node_id, role: 'story', instruction: '保持原始剧情顺序',
        must_not_transfer: [], source_revision: sourceBinding.source_revision,
      }],
      generationParameters: {
        image_ids: [], requested_shot_count: requestedClipCount, aspect_ratio: '16:9',
      },
      workflowMode: 'standalone_clip', directorBrief, sequenceContext: null, retakeContext: null,
    }
    const preflight = await requestCinematicDirectorPreflight(preflightInput, request)
    if (!preflight.ready_for_handoff) throw new Error('sequence planning preflight 尚未满足执行条件。')
    const response = await requestCanvasGeneration({
      mediaType: 'text', clientRequestId: createGenerationClientRequestId(),
      projectId, originCanvasId: canvasId, canvasNodeId: sourceSnapshot.id,
      prompt: preflight.canonical_request.optimized_prompt as string,
      cinematicHandoff: buildCinematicDirectorHandoff(preflightInput, preflight),
    }, authStore, request)
    if (!response.content || !response.asset) throw new Error('sequence planning 响应不完整。')
    const sequence = parseCinematicSequenceState(JSON.parse(response.content))
    const current = currentSource()
    if (!current || current.id !== sourceSnapshot.id || sourceText(current) !== script) {
      throw new Error('脚本上下文已变化，请重新规划。')
    }
    const command = createApplyCinematicSequenceCommand(sourceSnapshot, script, sequence)
    if (!command || sequence.source_revision !== sourceBinding.source_revision) {
      throw new Error('sequence planning 来源校验失败。')
    }
    await canvasStore.dispatchCommand({ source: 'toolbar', command })
    resourceStore.upsertAsset(response.asset)
    resourceStore.upsertTask(response.generation_task)
    return resolveNextUnresolvedCinematicClip(sequence)?.clip_id ?? null
  }

  return { createCinematicSequencePlan, createCinematicShotGraph, createShotGraph }
}

import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Page } from '@playwright/test'
import { createMockGenerationRequestParameters } from './canvas-generation-parameters-fixture'
import {
  API_ORIGIN, FIRST_CANVAS_ID, GENERATED_VIDEO_BASE64, GENERATION_CAPABILITIES,
  NOW, PROJECT_ID, SECOND_CANVAS_ID, applyDocumentPatch,
  cinematicScriptGenerationResponse, corsHeaders, documentResponse, fulfillJson,
  generationResponse, generationTask, instantiateTemplate, T6_GENERATION_CAPABILITIES,
  type ResourceMockState,
} from './canvas-resource-generation-state-fixture'

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

function scriptAuthoringGenerationResponse(state: ResourceMockState, canvasId: string, requestBody: Record<string, unknown>) {
  const intent = requestBody.intent === 'script_refine' ? 'script_refine' : 'script_draft'
  const locale = requestBody.locale === 'en-US' ? 'en-US' : 'zh-CN'
  const sourceNodeId = String(requestBody.canvas_node_id)
  const canvasRevision = Number(requestBody.canvas_revision)
  const taskId = `task-authoring-${state.generationCount + 1}`
  const assetId = `asset-authoring-${state.generationCount + 1}`
  const content = intent === 'script_refine'
    ? '黄昏海岸。主角在潮声中走入画面，停下并望向远处灯塔。'
    : '雨夜车站。摄影师穿过人群，寻找装着失踪胶卷的银色手提箱。'
  state.generationCount += 1
  const lineage = {
    contract_version: 1, intent, locale, source_node_id: sourceNodeId,
    source_task_id: taskId, source_model: 'agnes-2.0-flash', canvas_revision: canvasRevision,
  }
  const requestSnapshot = {
    ...lineage,
    ...(Array.isArray(requestBody.reference_asset_ids)
      ? { reference_asset_ids: requestBody.reference_asset_ids }
      : {}),
  }
  const task = generationTask({
    id: taskId, origin_canvas_id: canvasId, canvas_node_id: sourceNodeId, media_type: 'text',
    model: 'agnes-2.0-flash', status: 'succeeded', result_asset_id: assetId,
    provider_request_id: `request-${taskId}`, client_request_id: requestBody.client_request_id,
    request_fingerprint: 'c'.repeat(64), request_parameters: { script_authoring: requestSnapshot },
  })
  const asset = {
    id: assetId, user_id: 'user-resource', project_id: PROJECT_ID, origin_canvas_id: canvasId,
    canvas_node_id: sourceNodeId, type: 'prompt', url: null, content_text: content,
    source: 'generation', source_model: 'agnes-2.0-flash', source_task_id: taskId, status: 'active',
    created_at: NOW, updated_at: NOW,
  }
  state.tasks = [task, ...state.tasks]
  state.assets = [asset, ...state.assets]
  state.quotas = { ...state.quotas, text: state.quotas.text - 1 }
  state.quotaRevision += 1
  return { content, asset, generation_task: task, quotas: state.quotas, quota_revision: state.quotaRevision, script_authoring: lineage }
}

function shotSchemaResponse(
  state: ResourceMockState,
  canvasId: string,
  requestBody: Record<string, unknown>,
) {
  const requestedShotCount = Number(requestBody.requested_shot_count ?? 2)
  const shotCount = Number.isSafeInteger(requestedShotCount) && requestedShotCount >= 2 && requestedShotCount <= 25
    ? requestedShotCount
    : 2
  const narratives = ['人物走入黄昏海岸。', '海浪在人物身后翻涌。']
  const shots = Array.from({ length: shotCount }, (_, offset) => {
    const index = offset + 1
    const narrative = narratives[offset % narratives.length]
    return {
      shot_id: `shot-${String(index).padStart(2, '0')}`,
      index,
      title: `镜头 ${String(index).padStart(2, '0')}`,
      narrative,
      image_prompt: narrative,
    }
  })
  return {
    contract_version: 1,
    schema_id: 'revid.shot-sequence',
    provider: state.shotSchemaOutcome === 'malformed' ? 'agnes' : 'mock',
    model: 'revid-shot-mock-v1',
    project_id: PROJECT_ID,
    canvas_id: canvasId,
    source_script_node_id: requestBody.source_script_node_id,
    aspect_ratio: '16:9',
    shot_count: shots.length,
    shots,
  }
}

export async function installResourceMockApi(page: Page, state: ResourceMockState) {
  await page.route('https://media.revid.test/**', async (route) => {
    const pathname = new URL(route.request().url()).pathname
    if (state.capturedFrames[pathname]) {
      const contentType = pathname.endsWith('.svg') ? 'image/svg+xml' : 'image/png'
      return route.fulfill({ status: 200, headers: { 'content-type': contentType, 'access-control-allow-origin': '*' }, body: state.capturedFrames[pathname] })
    }
    const isBroken = pathname.includes('broken')
    const isVideo = pathname.endsWith('.mp4')
    if (pathname === '/forbidden.mp4') return route.fulfill({ status: 403, headers: { 'content-type': 'video/mp4', 'access-control-allow-origin': '*' }, body: Buffer.from('expired') })
    if (pathname === '/unsupported.mp4') return route.fulfill({ status: 200, headers: { 'content-type': 'video/mp4', 'access-control-allow-origin': '*' }, body: Buffer.from('not-a-supported-codec') })
    if (pathname === '/scenario.mp4') {
      const body = readFileSync(resolve(process.cwd(), 'tests', 'fixtures', 'dynamic-frame-source.mp4'))
      const range = route.request().headers().range
      if (!range?.startsWith('bytes=')) return route.fulfill({ status: 200, headers: { 'content-type': 'video/mp4', 'content-length': String(body.length), 'accept-ranges': 'bytes', 'access-control-allow-origin': '*' }, body })
      const [startText, endText] = range.slice('bytes='.length).split('-', 2)
      const start = Number(startText)
      const end = endText ? Math.min(Number(endText), body.length - 1) : body.length - 1
      return route.fulfill({
        status: 206,
        headers: { 'content-type': 'video/mp4', 'content-length': String(end - start + 1), 'content-range': `bytes ${start}-${end}/${body.length}`, 'accept-ranges': 'bytes', 'access-control-allow-origin': '*' },
        body: body.subarray(start, end + 1),
      })
    }
    const dimensions = pathname.includes('portrait-736x1312')
      ? { width: 736, height: 1312, label: 'PORTRAIT 736:1312' }
      : pathname.includes('parity-reference')
      ? { width: 225, height: 300, label: 'REFERENCE 3:4' }
      : pathname.includes('parity-output')
        ? { width: 225, height: 300, label: 'OUTPUT 3:4' }
        : pathname.includes('square')
          ? { width: 240, height: 240, label: 'SQUARE 1:1' }
          : pathname.includes('portrait')
            ? { width: 180, height: 320, label: 'PORTRAIT 9:16' }
            : { width: 320, height: 180, label: 'LANDSCAPE 16:9' }
    if (pathname.includes('portrait-736x1312')) await new Promise((resolveDelay) => setTimeout(resolveDelay, 3000))
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${dimensions.width}" height="${dimensions.height}" viewBox="0 0 ${dimensions.width} ${dimensions.height}"><rect width="100%" height="100%" rx="12" fill="#6242df"/><path d="M0 0h32v32H0zM${dimensions.width - 32} 0h32v32h-32zM0 ${dimensions.height - 32}h32v32H0zM${dimensions.width - 32} ${dimensions.height - 32}h32v32h-32z" fill="#d8ccff"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="sans-serif" font-size="16">${dimensions.label}</text></svg>`
    return route.fulfill({
    status: isBroken ? 404 : 200,
    headers: { 'content-type': isBroken ? 'image/png' : isVideo ? 'video/mp4' : 'image/svg+xml', 'access-control-allow-origin': '*' },
    body: isBroken ? Buffer.from('not-an-image') : isVideo
      ? Buffer.from(GENERATED_VIDEO_BASE64, 'base64')
      : Buffer.from(svg),
  })})
  await page.route(`${API_ORIGIN}/**`, async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const method = request.method()
    const path = url.pathname
    const body = request.postData() && !request.headers()['content-type']?.includes('multipart/form-data')
      ? request.postDataJSON() as Record<string, unknown>
      : undefined
    if (method === 'OPTIONS') return route.fulfill({ status: 204, headers: corsHeaders() })
    state.requests.push({ method, path, query: url.search, body })

    if (method === 'GET' && path === '/me') return fulfillJson(route, { user: { id: 'user-resource', username: 'creator', email: 'creator@example.com', nickname: '创作者', avatar_url: '', role: 'user', status: 'active', generation_status: 'enabled', created_at: NOW, updated_at: NOW, last_login_at: NOW }, quotas: state.quotas, quota_revision: state.quotaRevision })
    if (method === 'GET' && path === '/projects') return fulfillJson(route, { items: [{ id: PROJECT_ID, user_id: 'user-resource', name: '短片工作室', created_at: NOW }], total: 1 })
    if (method === 'GET' && path === `/api/projects/${PROJECT_ID}/canvases`) return fulfillJson(route, { items: state.canvases, order_revision: 0 })
    const documentMatch = path.match(new RegExp(`^/api/projects/${PROJECT_ID}/canvases/([^/]+)/document$`))
    if (method === 'GET' && documentMatch) {
      state.events.push(`document-loaded:${documentMatch[1]}`)
      return fulfillJson(route, documentResponse(state, documentMatch[1]))
    }
    if (method === 'PATCH' && documentMatch && body) {
      state.events.push(`document-patched:${documentMatch[1]}`)
      return fulfillJson(route, applyDocumentPatch(state, documentMatch[1], body))
    }
    const viewportMatch = path.match(new RegExp(`^/api/projects/${PROJECT_ID}/canvases/([^/]+)/viewport$`))
    if (method === 'PATCH' && viewportMatch) {
      const activeCanvas = state.canvases.find((item) => item.id === viewportMatch[1])!
      Object.assign(activeCanvas, {
        viewport_x: body?.x ?? body?.viewport_x ?? 0,
        viewport_y: body?.y ?? body?.viewport_y ?? 0,
        viewport_zoom: body?.zoom ?? body?.viewport_zoom ?? 1,
      })
      return fulfillJson(route, activeCanvas)
    }
    if (method === 'GET' && path === '/assets') {
      if (url.searchParams.get('project_id') !== PROJECT_ID) return fulfillJson(route, { detail: 'project_id required' }, 400)
      return fulfillJson(route, { items: state.assets, total: state.assets.length, page: 1, page_size: 100 })
    }
    if (method === 'POST' && path === '/assets/upload') {
      const buffer = request.postDataBuffer() ?? Buffer.alloc(0)
      state.uploads.push({ byteLength: buffer.byteLength, contentType: request.headers()['content-type'] ?? '', payload: buffer.toString('latin1') })
      await state.uploadGate
      if (state.uploadOutcome === 'failure') {
        return fulfillJson(route, { detail: 'mock frame upload rejected' }, 503)
      }
      if (state.uploadFailureAt === state.uploads.length) {
        return fulfillJson(route, { detail: 'mock image upload rejected' }, 503)
      }
      const pngStart = buffer.indexOf(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
      const pngEndMarker = Buffer.from([0, 0, 0, 0, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82])
      const pngEnd = buffer.indexOf(pngEndMarker, pngStart)
      if (pngStart < 0 || pngEnd < 0) return fulfillJson(route, { detail: 'mock upload did not contain a complete PNG' }, 422)
      const assetSequence = state.uploads.length
      const capturedPath = `/captured-frame-${assetSequence}.png`
      state.capturedFrames[capturedPath] = buffer.subarray(pngStart, pngEnd + pngEndMarker.length)
      const isGridCrop = buffer.includes(Buffer.from('revid-grid-'))
      const asset = {
        id: `asset-captured-frame-${assetSequence}`, user_id: 'user-resource', project_id: PROJECT_ID,
        origin_canvas_id: FIRST_CANVAS_ID, canvas_node_id: null, type: 'image',
        url: `https://media.revid.test${capturedPath}`,
        content_text: isGridCrop ? '本地图片切片' : '视频截取帧', source: 'upload',
        source_model: null, source_task_id: null, status: 'active', created_at: NOW, updated_at: NOW,
      }
      state.assets.unshift(asset)
      return fulfillJson(route, asset, 201)
    }
    if (method === 'GET' && path === '/templates') return fulfillJson(route, { items: state.templates, total: state.templates.length })
    if (method === 'GET' && path === '/api/generation-tasks') {
      if (url.searchParams.get('project_id') !== PROJECT_ID) return fulfillJson(route, { detail: 'project_id required' }, 400)
      if (state.taskListOutcome === 'failure') return fulfillJson(route, { detail: 'mock task list unavailable' }, 503)
      return fulfillJson(route, { items: state.tasks, total: state.tasks.length, page: 1, page_size: 100 })
    }
    const boundGenerationTaskMatch = path.match(/^\/api\/generation-tasks\/([^/]+)$/)
    if (method === 'GET' && boundGenerationTaskMatch) {
      const task = state.tasks.find((candidate) => candidate.id === boundGenerationTaskMatch[1])
      return task
        ? fulfillJson(route, task)
        : fulfillJson(route, { detail: 'mock generation task missing' }, 404)
    }
    const generationJobResultMatch = path.match(/^\/api\/v2\/generation-jobs\/([^/]+)\/result$/)
    if (method === 'GET' && generationJobResultMatch) {
      const result = state.generationJobResults[generationJobResultMatch[1]]
      return result
        ? fulfillJson(route, result)
        : fulfillJson(route, { detail: 'mock generation job result unavailable' }, 409)
    }
    const generationJobRecoveryMatch = path.match(new RegExp(
      `^/api/v2/projects/${PROJECT_ID}/canvases/([^/]+)/nodes/([^/]+)/generation-jobs/by-client-request/([^/]+)$`,
    ))
    if (method === 'GET' && generationJobRecoveryMatch) {
      const [, canvasId, nodeId, clientRequestId] = generationJobRecoveryMatch
      const task = state.tasks.find((candidate) => candidate.client_request_id === clientRequestId)
      return task
        ? fulfillJson(route, {
            job_id: task.id,
            project_id: PROJECT_ID,
            canvas_id: canvasId,
            node_id: nodeId,
            media_type: task.media_type,
            status: task.status,
            model_id: task.model,
            quota_revision: null,
            version: 1,
          })
        : fulfillJson(route, { detail: 'mock generation job recovery missing' }, 404)
    }
    const cinematicLineageMatch = path.match(new RegExp(
      `^/api/v2/projects/${PROJECT_ID}/canvases/([^/]+)/nodes/([^/]+)/generation-jobs/([^/]+)/cinematic-lineage$`,
    ))
    if (method === 'GET' && cinematicLineageMatch) {
      const [, canvasId, nodeId, jobId] = cinematicLineageMatch
      const task = state.tasks.find((candidate) => (
        candidate.id === jobId &&
        candidate.origin_canvas_id === canvasId &&
        candidate.canvas_node_id === nodeId
      ))
      const requestParameters = task?.request_parameters as Record<string, unknown> | null
      const handoff = requestParameters?.cinematic_handoff as Record<string, unknown> | undefined
      return task
        ? fulfillJson(route, {
            job_id: jobId,
            project_id: PROJECT_ID,
            canvas_id: canvasId,
            node_id: nodeId,
            cinematic_skill: requestParameters?.cinematic_skill ?? handoff?.skill ?? null,
            version: 1,
          })
        : fulfillJson(route, { detail: 'mock cinematic lineage missing' }, 404)
    }
    const generationJobStatusMatch = path.match(/^\/api\/v2\/generation-jobs\/([^/]+)$/)
    if (method === 'GET' && generationJobStatusMatch) {
      const job = state.generationJobs[generationJobStatusMatch[1]]
      return job
        ? fulfillJson(route, job)
        : fulfillJson(route, { detail: 'mock generation job missing' }, 404)
    }
    const generationJobDeltaMatch = path.match(
      new RegExp(`^/api/v2/projects/${PROJECT_ID}/generation-jobs$`),
    )
    if (method === 'GET' && generationJobDeltaMatch) {
      const canvasId = url.searchParams.get('canvas_id')
      const items = Object.values(state.generationJobs).filter((job) => (
        state.generationJobCanvasIds[String(job.job_id)] === canvasId
      ))
      return fulfillJson(route, {
        items,
        next_cursor: `cursor-${canvasId ?? 'missing'}`,
      })
    }
    if (method === 'GET' && path === '/api/generation-capabilities') {
      return state.capabilitiesOutcome === 'success'
        ? fulfillJson(route, state.capabilityVersion === 6 ? T6_GENERATION_CAPABILITIES : GENERATION_CAPABILITIES)
        : fulfillJson(route, { detail: 'mock capability unavailable' }, 503)
    }
    const cinematicSkillMatch = path.match(new RegExp(
      `^/api/projects/${PROJECT_ID}/canvases/([^/]+)/agent-skills/(cinematic-capabilities|cinematic-sources|cinematic-preflight)$`,
    ))
    if (cinematicSkillMatch && method === 'GET' && cinematicSkillMatch[2] === 'cinematic-capabilities') {
      return fulfillJson(route, {
        contract_version: 1,
        providers: [{
          id: 'agnes', capability_version: 1, billing_responsibility: 'platform',
          requires_acknowledgement: state.cinematicRequiresAcknowledgement,
          models: [
            { id: 'agnes-2.0-flash', media_type: 'text', user_selectable: true, automatic_routing: false, accepted_reference_media: ['text'], accepted_reference_roles: ['story'], max_references: 25, supported_controls: ['shot-count'] },
            { id: 'agnes-image-2.1-flash', media_type: 'image', user_selectable: true, automatic_routing: false, accepted_reference_media: ['image', 'text'], accepted_reference_roles: ['general', 'context', 'style', 'identity', 'wardrobe', 'scene', 'product'], max_references: 8, supported_controls: ['aspect-ratio', 'shot-controls'] },
            { id: 'agnes-video-v2.0', media_type: 'video', user_selectable: true, automatic_routing: false, accepted_reference_media: ['image', 'text'], accepted_reference_roles: ['general', 'context', 'first-frame', 'last-frame'], max_references: 8, supported_controls: ['duration', 'reference-mode', 'shot-controls', 'temporal'] },
          ],
        }],
      })
    }
    if (cinematicSkillMatch && method === 'GET' && cinematicSkillMatch[2] === 'cinematic-sources') {
      const canvasId = cinematicSkillMatch[1]
      const activeCanvas = state.canvases.find((item) => item.id === canvasId)!
      return fulfillJson(route, {
        canvas_revision: activeCanvas.graph_revision,
        items: state.documents[canvasId].nodes.map((item) => {
          const content = item.content as Record<string, unknown>
          return {
            node_id: item.id,
            title: content.title,
            node_type: item.node_type,
            subtype: content.subtype,
            source_revision: 'a'.repeat(64),
          }
        }),
      })
    }
    if (cinematicSkillMatch && method === 'POST' && cinematicSkillMatch[2] === 'cinematic-preflight') {
      const canvasId = cinematicSkillMatch[1]
      const mentions = Array.isArray(body?.mentions) ? body.mentions as Array<Record<string, unknown>> : []
      const references = mentions.map((mention) => {
        const source = state.documents[canvasId].nodes.find((item) => item.id === mention.node_id)!
        const content = source.content as Record<string, unknown>
        const mediaType = content.subtype === 'image' ? 'image' : 'text'
        return {
          node_id: mention.node_id,
          role: mention.role,
          instruction: mention.instruction,
          source_revision: mention.source_revision,
          media_type: mediaType,
          asset_id: mediaType === 'image' ? content.asset_id : null,
          text: mediaType === 'text' ? content.text ?? null : null,
        }
      })
      const nativeImageIds = Array.isArray((body?.generation_parameters as Record<string, unknown> | undefined)?.image_ids)
        ? (body?.generation_parameters as Record<string, unknown>).image_ids as unknown[]
        : []
      const mentionedImageIds = references.flatMap((reference) => reference.asset_id ? [reference.asset_id] : [])
      if (body?.skill_version === 2) {
        const directorReferences = references.map((reference, index) => ({
          ...reference,
          must_not_transfer: (mentions[index]?.must_not_transfer as unknown[] | undefined) ?? [],
        }))
        const parameters = body?.generation_parameters as Record<string, unknown> ?? {}
        const supportedControlMapping = Object.fromEntries(Object.keys(parameters).flatMap((key) => {
          const mapping: Record<string, string> = {
            aspect_ratio: 'aspect-ratio', shot_controls: 'shot-controls', reference_mode: 'reference-mode',
            duration_seconds: 'duration', requested_shot_count: 'shot-count', image_ids: 'native-image-references',
          }
          return mapping[key] ? [[key, mapping[key]]] : []
        }))
        const canonicalRequest = {
          skill_id: body?.skill_id,
          skill_version: 2,
          policy_version: 2,
          workflow_mode: body?.workflow_mode,
          scope: { project_id: PROJECT_ID, canvas_id: canvasId, canvas_revision: body?.canvas_revision },
          provider: { provider_id: body?.provider_id, model_id: body?.model_id, capability_version: 1 },
          user_instruction: body?.user_instruction,
          instruction_precedence: [
            'current_user_instruction', 'reference_transfer', 'accepted_canon',
            'current_node_parameters', 'director_policy', 'provider_defaults',
          ].map((source, index) => ({ rank: index + 1, source })),
          director_brief: body?.director_brief ?? null,
          director_coherence: 'standalone_fast_lane',
          references: directorReferences,
          sequence_context: null,
          retake_context: body?.retake_context ?? null,
          image_ids: [...nativeImageIds, ...mentionedImageIds.filter((imageId) => !nativeImageIds.includes(imageId))],
          parameters,
          supported_control_mapping: supportedControlMapping,
          optimized_prompt: `当前明确指令：${body?.user_instruction}\n导演政策：保持显式指令且不改变 provider/model。`,
          constraint_envelope: {},
          warnings: [], conflicts: [], recommendations: [],
        }
        const exactRequest = canonicalJson(canonicalRequest)
        return fulfillJson(route, {
          contract_version: 2,
          skill: { id: body?.skill_id, version: 2 },
          workflow_mode: body?.workflow_mode,
          project_id: PROJECT_ID,
          canvas_id: canvasId,
          canvas_revision: body?.canvas_revision,
          provider_id: body?.provider_id,
          model_id: body?.model_id,
          capability_version: 1,
          director_coherence: 'standalone_fast_lane',
          references: directorReferences,
          warnings: [], conflicts: [], recommendations: [], ready_for_handoff: true,
          canonical_request: canonicalRequest,
          canonical_request_json: exactRequest,
          exact_request: exactRequest,
          request_digest: createHash('sha256').update(exactRequest).digest('hex'),
          requires_acknowledgement: state.cinematicRequiresAcknowledgement,
        })
      }
      const canonicalRequest = {
        skill_id: body?.skill_id,
        skill_version: body?.skill_version,
        provider_id: body?.provider_id,
        model_id: body?.model_id,
        optimized_prompt: body?.skill_id === 'revid.cinema-script'
          ? `用户指令：${body?.user_instruction}\nSkill 约束：仅返回 revid.shot-sequence contract_version 2 JSON。`
          : `用户指令：${body?.user_instruction}`,
        references,
        image_ids: [...nativeImageIds, ...mentionedImageIds.filter((imageId) => !nativeImageIds.includes(imageId))],
        parameters: body?.generation_parameters ?? {},
      }
      const exactRequest = JSON.stringify(canonicalRequest)
      return fulfillJson(route, {
        contract_version: 1,
        skill: { id: body?.skill_id, version: body?.skill_version },
        project_id: PROJECT_ID,
        canvas_id: canvasId,
        canvas_revision: body?.canvas_revision,
        provider_id: body?.provider_id,
        model_id: body?.model_id,
        capability_version: 1,
        references,
        summary: {
          preserved_attributes: references.map((reference) => reference.role),
          allowed_changes: [], conflicts: [],
        },
        canonical_request: canonicalRequest,
        canonical_request_json: exactRequest,
        exact_request: exactRequest,
        request_digest: 'b'.repeat(64),
        requires_acknowledgement: state.cinematicRequiresAcknowledgement,
      })
    }
    if (path === '/api/provider-cost-acknowledgements/agnes') {
      if (method === 'POST') state.cinematicAcknowledgementActive = true
      if (method === 'DELETE') state.cinematicAcknowledgementActive = false
      if (['GET', 'POST', 'DELETE'].includes(method)) return fulfillJson(route, {
        user_id: 'user-resource', provider_id: 'agnes',
        acknowledged_until: state.cinematicAcknowledgementActive ? '2026-07-19T08:00:00Z' : null,
        cancelled_at: method === 'DELETE' ? NOW : null,
        active: state.cinematicAcknowledgementActive,
      })
    }
    const agentSkillMatch = path.match(new RegExp(`^/api/projects/${PROJECT_ID}/canvases/([^/]+)/agent-skills(?:/(preflight))?$`))
    if (agentSkillMatch && method === 'GET' && !agentSkillMatch[2]) {
      return fulfillJson(route, {
        contract_version: 1,
        execution_modes: ['mock-only', 'unavailable'],
        skills: [{
          id: 'revid.canvas-context', version: 1, execution_mode: 'mock-only',
          intent: 'canvas-context', requires_acknowledgement: false,
        }],
        provider: { available: false }, quota: { available: false }, task: { available: false },
      })
    }
    if (agentSkillMatch && method === 'POST' && agentSkillMatch[2] === 'preflight') {
      const selectedNodeIds = Array.isArray(body?.selected_node_ids) ? body.selected_node_ids : []
      return fulfillJson(route, {
        contract_version: 1,
        skill: {
          id: 'revid.canvas-context', version: 1, execution_mode: 'mock-only',
          intent: 'canvas-context', requires_acknowledgement: false,
        },
        project_id: PROJECT_ID,
        canvas_id: agentSkillMatch[1],
        sources: selectedNodeIds.map((nodeId) => ({
          node_id: nodeId,
          role: 'canvas-node',
          node_type: nodeId === 'script-source' ? 'script' : 'generation',
          subtype: nodeId === 'script-source' ? 'script' : 'image',
        })),
        execution_mode: 'mock-only',
        requires_acknowledgement: false,
        provider: { available: false }, quota: { available: false }, task: { available: false },
      })
    }
    const shotSchemaMatch = path.match(new RegExp(`^/api/projects/${PROJECT_ID}/canvases/([^/]+)/shot-schema$`))
    if (method === 'POST' && shotSchemaMatch) {
      state.shotSchemaCount += 1
      state.events.push(`shot-schema-requested:${shotSchemaMatch[1]}`)
      await state.shotSchemaGate
      if (state.shotSchemaOutcome === 'failure') {
        return fulfillJson(route, { detail: 'mock shot provider unavailable' }, 503)
      }
      return fulfillJson(route, shotSchemaResponse(state, shotSchemaMatch[1], body ?? {}))
    }
    const instantiateMatch = path.match(new RegExp(`^/api/projects/${PROJECT_ID}/canvases/([^/]+)/templates/template-storyboard/instantiate$`))
    if (method === 'POST' && instantiateMatch) {
      await state.templateInstantiationGate
      const result = instantiateTemplate(state, instantiateMatch[1])
      state.events.push(`template-committed:${instantiateMatch[1]}`)
      return fulfillJson(route, result, 201)
    }
    if (method === 'POST' && path === '/api/v2/generation-jobs') {
      const canvasId = String(body?.canvas_id ?? FIRST_CANVAS_ID)
      const nodeId = String(body?.node_id ?? 'generation-cover')
      const mediaType = body?.media_type === 'video' ? 'video' : 'image'
      const input = (
        body?.input && typeof body.input === 'object' && !Array.isArray(body.input)
          ? body.input
          : {}
      ) as Record<string, unknown>
      const requestBody = {
        ...input,
        client_request_id: body?.client_request_id,
      }
      state.events.push(`generation-requested:${nodeId}`)
      const batch = input.batch as Record<string, unknown> | undefined
      const slotIndex = Number(batch?.slot_index ?? 0)
      const generationCall = state.events.filter((event) => event.startsWith('generation-requested:')).length
      const jobId = slotIndex
        ? `job-${nodeId}-${generationCall}`
        : generationCall === 1
          ? 'job-generation'
          : `job-generation-${generationCall}`
      const queuedTask = generationTask({
        id: jobId,
        origin_canvas_id: canvasId, canvas_node_id: nodeId, media_type: mediaType,
        model: String(body?.model_id ?? `mock-${mediaType}-v1`),
        status: 'queued', result_asset_id: null,
        provider_request_id: null, client_request_id: body?.client_request_id,
        request_fingerprint: 'a'.repeat(64),
        request_parameters: createMockGenerationRequestParameters(mediaType, requestBody),
      })
      state.tasks = [queuedTask, ...state.tasks.filter((item) => item.id !== jobId)]
      state.generationJobs[jobId] = {
        job_id: jobId,
        node_id: nodeId,
        media_type: mediaType,
        status: 'queued',
        stage: 'queued',
        progress: 0,
        error: null,
        result_asset_id: null,
        version: 1,
        updated_at: NOW,
      }
      state.generationJobCanvasIds[jobId] = canvasId
      void Promise.resolve(state.generationGate).then(() => {
        const succeeds = (
          state.generationOutcome === 'success' &&
          !state.generationFailureSlots.includes(slotIndex) &&
          !state.generationFailureCalls.includes(generationCall)
        )
        if (succeeds) {
          const response = generationResponse(
            state,
            canvasId,
            nodeId,
            mediaType,
            requestBody,
            jobId,
          )
          const asset = response.asset as Record<string, unknown>
          state.generationJobs[jobId] = {
            job_id: jobId,
            node_id: nodeId,
            media_type: mediaType,
            status: 'succeeded',
            stage: null,
            progress: 100,
            error: null,
            result_asset_id: asset.id,
            version: 2,
            updated_at: NOW,
          }
          state.generationJobResults[jobId] = {
            job_id: jobId,
            node_id: nodeId,
            result: {
              asset_id: asset.id,
              media_type: mediaType,
              url: asset.url,
            },
            version: 2,
          }
          return
        }
        const failedTask = generationTask({
          ...queuedTask,
          status: 'failed',
          error_code: 'provider_error',
          error_message: 'mock provider unavailable',
        })
        state.tasks = [failedTask, ...state.tasks.filter((item) => item.id !== jobId)]
        state.generationJobs[jobId] = {
          job_id: jobId,
          node_id: nodeId,
          media_type: mediaType,
          status: 'failed',
          stage: 'provider',
          progress: null,
          error: 'mock provider unavailable',
          result_asset_id: null,
          version: 2,
          updated_at: NOW,
        }
      })
      return fulfillJson(route, {
        job_id: jobId,
        project_id: PROJECT_ID,
        canvas_id: canvasId,
        node_id: nodeId,
        media_type: mediaType,
        status: 'queued',
        model_id: String(body?.model_id ?? `mock-${mediaType}-v1`),
        quota_revision: state.quotaRevision,
        version: 1,
      }, 202)
    }
    if (method === 'POST' && (path === '/api/image-generate' || path === '/api/video-generate')) {
      return fulfillJson(route, { detail: 'legacy media generation retired' }, 410)
    }
    if (method === 'POST' && path === '/api/text-generate') {
      const canvasId = String(body?.origin_canvas_id ?? FIRST_CANVAS_ID)
      if (body?.intent === 'script_draft' || body?.intent === 'script_refine') {
        state.events.push(`script-authoring-requested:${body?.canvas_node_id}`)
        if (state.generationOutcome === 'failure') {
          return fulfillJson(route, { detail: {
            code: 'provider_unavailable', message: 'mock provider unavailable', retryable: true,
            retry_after_seconds: 2,
          } }, 503)
        }
        return fulfillJson(route, scriptAuthoringGenerationResponse(state, canvasId, body ?? {}))
      }
      state.events.push(`cinematic-script-requested:${body?.canvas_node_id}`)
      return fulfillJson(route, cinematicScriptGenerationResponse(state, canvasId, body ?? {}))
    }
    return fulfillJson(route, { detail: `Unhandled mock route: ${method} ${path}` }, 501)
  })
}

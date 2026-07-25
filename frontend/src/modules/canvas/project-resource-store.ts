import { isAxiosError } from 'axios'
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useAuthStore } from '../../store/auth'
import type { Asset, ProjectAssetUploadType } from '../../types/asset'
import {
  captureCanvasTemplate,
  fetchTemplates,
  instantiateCanvasTemplate,
} from '../template/api'
import type { Template } from '../template/types'
import {
  fetchProjectAssets,
  fetchProjectGenerationTasks,
  uploadProjectAsset,
} from './project-resource-api'
import type {
  GenerationTask,
  TemplateInstantiationOptions,
} from './project-resource-types'

const MUTATION_ID_LIMIT = 64
const MUTATION_ID_POOL_LIMIT = 32

export interface StableMutationIdPool {
  readonly size: number
  acquire(key: string, fingerprint: string): string
  release(key: string): void
  clear(): void
}

function createMutationId() {
  const suffix = globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `template-${suffix}`
}

export function createStableMutationIdPool(
  maxEntries = MUTATION_ID_POOL_LIMIT,
  idFactory: () => string = createMutationId,
): StableMutationIdPool {
  const requestedCapacity = Number.isFinite(maxEntries)
    ? Math.floor(maxEntries)
    : MUTATION_ID_POOL_LIMIT
  const capacity = Math.max(1, Math.min(MUTATION_ID_POOL_LIMIT, requestedCapacity))
  const entries = new Map<string, { fingerprint: string; id: string }>()

  function acquire(key: string, fingerprint: string) {
    const normalizedKey = key.trim()
    const normalizedFingerprint = fingerprint.trim()
    if (!normalizedKey || !normalizedFingerprint) {
      throw new TypeError('Mutation key and fingerprint are required.')
    }
    const existing = entries.get(normalizedKey)
    if (existing?.fingerprint === normalizedFingerprint) return existing.id
    entries.delete(normalizedKey)
    while (entries.size >= capacity) {
      const oldestKey = entries.keys().next().value
      if (typeof oldestKey !== 'string') break
      entries.delete(oldestKey)
    }
    const id = idFactory().trim().slice(0, MUTATION_ID_LIMIT)
    if (!id) throw new TypeError('Mutation ID factory returned an empty value.')
    entries.set(normalizedKey, { fingerprint: normalizedFingerprint, id })
    return id
  }

  return {
    get size() {
      return entries.size
    },
    acquire,
    release: (key) => entries.delete(key.trim()),
    clear: () => entries.clear(),
  }
}

interface LoadRequest {
  generation: number
  projectId: string
  promise: Promise<ProjectResourceSnapshot>
}

interface TaskRefreshRequest {
  generation: number
  projectId: string
  promise: Promise<GenerationTask[]>
}

interface ResourceErrorResponse {
  detail?: unknown
}

export interface ProjectResourceSnapshot {
  assets: Asset[]
  templates: Template[]
  tasks: GenerationTask[]
}

type ProjectLoadOptions = boolean | {
  force?: boolean
  includeTaskHistory?: boolean
}

function errorMessage(error: unknown) {
  if (isAxiosError<ResourceErrorResponse>(error)) {
    const detail = error.response?.data?.detail
    if (typeof detail === 'string' && detail.trim()) return detail
    if (error.code === 'ECONNABORTED') return '项目资源请求超时，请重试。'
  }
  return '项目资源加载失败，请重试。'
}

export const useProjectResourceStore = defineStore('canvas-project-resources', () => {
  const authStore = useAuthStore()
  const projectId = ref('')
  const assets = ref<Asset[]>([])
  const templates = ref<Template[]>([])
  const tasks = ref<GenerationTask[]>([])
  const isLoading = ref(false)
  const error = ref('')
  const hasLoaded = ref(false)

  let generation = 0
  let resourceRevision = 0
  let loadRequest: LoadRequest | null = null
  let taskRefreshRequest: TaskRefreshRequest | null = null
  const mutationIds = createStableMutationIdPool()
  const assetRevisions = new Map<string, number>()
  const taskRevisions = new Map<string, number>()
  const templateRevisions = new Map<string, number>()

  function snapshot(): ProjectResourceSnapshot {
    return {
      assets: assets.value,
      templates: templates.value,
      tasks: tasks.value,
    }
  }

  function resetProjectResources() {
    generation += 1
    loadRequest = null
    taskRefreshRequest = null
    projectId.value = ''
    assets.value = []
    templates.value = []
    tasks.value = []
    isLoading.value = false
    error.value = ''
    hasLoaded.value = false
    mutationIds.clear()
    resourceRevision = 0
    assetRevisions.clear()
    taskRevisions.clear()
    templateRevisions.clear()
  }

  async function loadProject(nextProjectId: string, options: ProjectLoadOptions = false) {
    const force = typeof options === 'boolean' ? options : options.force ?? false
    const includeTaskHistory = typeof options === 'boolean'
      ? true
      : options.includeTaskHistory ?? true
    const normalizedProjectId = nextProjectId.trim()
    if (!normalizedProjectId) {
      resetProjectResources()
      return snapshot()
    }

    if (normalizedProjectId !== projectId.value) {
      generation += 1
      loadRequest = null
      taskRefreshRequest = null
      projectId.value = normalizedProjectId
      assets.value = []
      templates.value = []
      tasks.value = []
      error.value = ''
      hasLoaded.value = false
      resourceRevision = 0
      assetRevisions.clear()
      taskRevisions.clear()
      templateRevisions.clear()
    }

    const requestedGeneration = generation
    if (!force && hasLoaded.value) return snapshot()
    if (
      loadRequest?.generation === requestedGeneration &&
      loadRequest.projectId === normalizedProjectId
    ) {
      return loadRequest.promise
    }

    isLoading.value = true
    error.value = ''
    const requestedResourceRevision = resourceRevision
    const promise = (async () => {
      try {
        const [assetResponse, templateResponse, taskResponse] = await Promise.all([
          fetchProjectAssets(normalizedProjectId),
          fetchTemplates(),
          includeTaskHistory ? fetchProjectGenerationTasks(normalizedProjectId) : Promise.resolve(null),
        ])
        if (
          generation === requestedGeneration &&
          projectId.value === normalizedProjectId
        ) {
          assets.value = mergeAfterRequest(
            assetResponse.data.items.filter((asset) => asset.project_id === normalizedProjectId),
            assets.value, assetRevisions, requestedResourceRevision,
          )
          templates.value = mergeAfterRequest(
            templateResponse.data.items, templates.value, templateRevisions, requestedResourceRevision,
          )
          if (taskResponse) {
            tasks.value = mergeAfterRequest(
              taskResponse.data.items.filter((task) => task.project_id === normalizedProjectId),
              tasks.value, taskRevisions, requestedResourceRevision,
            )
          }
          hasLoaded.value = true
        }
        return snapshot()
      } catch (requestError) {
        if (
          generation === requestedGeneration &&
          projectId.value === normalizedProjectId
        ) {
          error.value = errorMessage(requestError)
        }
        throw requestError
      }
    })()

    const currentRequest = {
      generation: requestedGeneration,
      projectId: normalizedProjectId,
      promise,
    }
    loadRequest = currentRequest
    try {
      return await promise
    } finally {
      if (loadRequest === currentRequest) {
        loadRequest = null
        isLoading.value = false
      }
    }
  }

  function refresh() {
    return projectId.value
      ? loadProject(projectId.value, true)
      : Promise.resolve(snapshot())
  }

  function refreshIfCurrent(expectedProjectId: string) {
    const normalizedProjectId = expectedProjectId.trim()
    return normalizedProjectId && normalizedProjectId === projectId.value
      ? loadProject(normalizedProjectId, { force: true, includeTaskHistory: false })
      : Promise.resolve(snapshot())
  }

  function refreshTasksIfCurrent(expectedProjectId: string) {
    const normalizedProjectId = expectedProjectId.trim()
    if (!normalizedProjectId || normalizedProjectId !== projectId.value) {
      return Promise.resolve(tasks.value)
    }
    const requestedGeneration = generation
    if (
      taskRefreshRequest?.generation === requestedGeneration &&
      taskRefreshRequest.projectId === normalizedProjectId
    ) {
      return taskRefreshRequest.promise
    }
    const requestedResourceRevision = resourceRevision
    const promise = (async () => {
      const response = await fetchProjectGenerationTasks(normalizedProjectId)
      if (generation === requestedGeneration && projectId.value === normalizedProjectId) {
        tasks.value = mergeAfterRequest(
          response.data.items.filter((task) => task.project_id === normalizedProjectId),
          tasks.value,
          taskRevisions,
          requestedResourceRevision,
        )
      }
      return tasks.value
    })()
    const currentRequest = { generation: requestedGeneration, projectId: normalizedProjectId, promise }
    taskRefreshRequest = currentRequest
    return promise.finally(() => {
      if (taskRefreshRequest === currentRequest) taskRefreshRequest = null
    })
  }

  function loadTaskHistory(expectedProjectId: string) {
    return refreshTasksIfCurrent(expectedProjectId)
  }

  function upsertById<T extends { id: string }>(items: T[], item: T) {
    const existingIndex = items.findIndex((candidate) => candidate.id === item.id)
    if (existingIndex < 0) return [item, ...items]
    const nextItems = [...items]
    nextItems[existingIndex] = item
    return nextItems
  }

  function mergeAfterRequest<T extends { id: string }>(
    serverItems: T[],
    currentItems: T[],
    revisions: Map<string, number>,
    requestedRevision: number,
  ) {
    const newerItems = currentItems.filter(
      (item) => (revisions.get(item.id) ?? 0) > requestedRevision,
    )
    const newerIds = new Set(newerItems.map((item) => item.id))
    for (const [id, revision] of revisions) {
      if (revision <= requestedRevision) revisions.delete(id)
    }
    return [...newerItems, ...serverItems.filter((item) => !newerIds.has(item.id))]
  }

  function markUpsert(revisions: Map<string, number>, id: string) {
    resourceRevision += 1
    revisions.set(id, resourceRevision)
  }

  function upsertAsset(asset: Asset) {
    if (!projectId.value || asset.project_id !== projectId.value) return false
    assets.value = upsertById(assets.value, asset)
    markUpsert(assetRevisions, asset.id)
    return true
  }

  function upsertTask(task: GenerationTask) {
    if (!projectId.value || task.project_id !== projectId.value) return false
    tasks.value = upsertById(tasks.value, task)
    markUpsert(taskRevisions, task.id)
    return true
  }

  function upsertTemplate(template: Template) {
    templates.value = upsertById(templates.value, template)
    markUpsert(templateRevisions, template.id)
    return template
  }

  function assertProject(expectedProjectId: string) {
    const normalizedProjectId = expectedProjectId.trim()
    if (!normalizedProjectId) throw new TypeError('Project ID is required.')
    if (normalizedProjectId !== projectId.value) {
      throw new Error('项目资源上下文已变化，请重试。')
    }
    return { generation, projectId: normalizedProjectId }
  }

  function assertMutationContext(context: { generation: number; projectId: string }) {
    if (context.generation !== generation || context.projectId !== projectId.value) {
      throw new Error('项目资源上下文已变化，请重试。')
    }
  }

  async function uploadAsset(
    expectedProjectId: string,
    canvasId: string,
    file: File,
    type: ProjectAssetUploadType,
  ) {
    const context = assertProject(expectedProjectId)
    error.value = ''
    try {
      const response = await uploadProjectAsset(context.projectId, canvasId, file, type)
      assertMutationContext(context)
      upsertAsset(response.data)
      return response.data
    } catch (requestError) {
      if (context.generation === generation) error.value = errorMessage(requestError)
      throw requestError
    }
  }

  async function captureTemplate(
    expectedProjectId: string,
    canvasId: string,
    name: string,
  ) {
    const context = assertProject(expectedProjectId)
    error.value = ''
    try {
      const response = await captureCanvasTemplate(context.projectId, canvasId, { name })
      assertMutationContext(context)
      return upsertTemplate(response.data)
    } catch (requestError) {
      if (context.generation === generation) error.value = errorMessage(requestError)
      throw requestError
    }
  }

  function templateMutationPayload(options: TemplateInstantiationOptions) {
    if (!Number.isSafeInteger(options.baseRevision) || options.baseRevision < 0) {
      throw new TypeError('Base revision must be a non-negative safe integer.')
    }
    const hasAnchorX = options.anchorX !== undefined
    const hasAnchorY = options.anchorY !== undefined
    if (hasAnchorX !== hasAnchorY) {
      throw new TypeError('Template anchor coordinates must be provided together.')
    }
    if (
      (hasAnchorX && !Number.isFinite(options.anchorX)) ||
      (hasAnchorY && !Number.isFinite(options.anchorY))
    ) {
      throw new TypeError('Template anchor coordinates must be finite.')
    }
    return {
      base_revision: options.baseRevision,
      ...(hasAnchorX ? { anchor_x: options.anchorX, anchor_y: options.anchorY } : {}),
    }
  }

  async function instantiateTemplate(
    expectedProjectId: string,
    canvasId: string,
    templateId: string,
    options: TemplateInstantiationOptions,
  ) {
    const context = assertProject(expectedProjectId)
    const payload = templateMutationPayload(options)
    const retryKey = options.retryKey?.trim() ||
      `${context.projectId}:${canvasId.trim()}:${templateId.trim()}`
    const fingerprint = JSON.stringify({
      projectId: context.projectId,
      canvasId: canvasId.trim(),
      templateId: templateId.trim(),
      ...payload,
    })
    const clientMutationId = mutationIds.acquire(retryKey, fingerprint)
    error.value = ''
    try {
      const response = await instantiateCanvasTemplate(
        context.projectId,
        canvasId,
        templateId,
        { ...payload, client_mutation_id: clientMutationId },
      )
      assertMutationContext(context)
      return response.data
    } catch (requestError) {
      if (context.generation === generation) error.value = errorMessage(requestError)
      throw requestError
    }
  }

  function confirmTemplateInstantiation(retryKey: string) {
    mutationIds.release(retryKey)
  }

  watch(
    () => authStore.token,
    (token, previousToken) => {
      if (token !== previousToken) resetProjectResources()
    },
    { flush: 'sync' },
  )

  return {
    projectId,
    assets,
    templates,
    tasks,
    isLoading,
    error,
    hasLoaded,
    loadProject,
    refresh,
    refreshIfCurrent,
    refreshTasksIfCurrent,
    loadTaskHistory,
    uploadAsset,
    captureTemplate,
    instantiateTemplate,
    confirmTemplateInstantiation,
    upsertAsset,
    upsertTask,
    resetProjectResources,
  }
})

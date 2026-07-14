import { request } from '../../api/request'
import type {
  Asset,
  AssetListResponse,
  ProjectAssetUploadType,
} from '../../types/asset'
import type { GenerationTaskListResponse } from './project-resource-types'

const RESOURCE_PAGE_SIZE = 100
const RESOURCE_MAX_PAGES = 10_000
const RESOURCE_SNAPSHOT_ATTEMPTS = 3

function requireId(value: string, label: string) {
  const normalized = value.trim()
  if (!normalized) throw new TypeError(`${label} is required.`)
  return normalized
}

function fetchProjectAssetPage(projectId: string, page: number) {
  return request.get<AssetListResponse>('/assets', {
    params: {
      project_id: requireId(projectId, 'Project ID'),
      page,
      page_size: RESOURCE_PAGE_SIZE,
    },
  })
}

function fetchProjectGenerationTaskPage(projectId: string, page: number) {
  return request.get<GenerationTaskListResponse>('/api/generation-tasks', {
    params: {
      project_id: requireId(projectId, 'Project ID'),
      page,
      page_size: RESOURCE_PAGE_SIZE,
    },
  })
}

function normalizedPageTotal(response: { items: unknown[]; total: number }) {
  return Number.isSafeInteger(response.total) && response.total >= 0
    ? response.total
    : response.items.length
}

function samePageIdentity(left: readonly { id: string }[], right: readonly { id: string }[]) {
  return left.length === right.length && left.every((item, index) => item.id === right[index]?.id)
}

async function fetchStablePages<T extends { id: string }, TResponse extends {
  items: T[]
  page: number
  page_size: number
  total: number
}>(fetchPage: (page: number) => Promise<{ data: TResponse }>) {
  for (let attempt = 0; attempt < RESOURCE_SNAPSHOT_ATTEMPTS; attempt += 1) {
    const firstResponse = await fetchPage(1)
    const pageSize = Number.isSafeInteger(firstResponse.data.page_size) && firstResponse.data.page_size > 0
      ? firstResponse.data.page_size
      : RESOURCE_PAGE_SIZE
    const total = normalizedPageTotal(firstResponse.data)
    const pageCount = Math.max(1, Math.ceil(total / pageSize))
    if (pageCount > RESOURCE_MAX_PAGES) {
      throw new Error('Project resource collection exceeds the supported safe page count.')
    }
    if (pageCount === 1) {
      const uniqueItemCount = new Set(firstResponse.data.items.map((item) => item.id)).size
      if (firstResponse.data.page === 1 && uniqueItemCount === total) return firstResponse
      continue
    }

    const itemsById = new Map(firstResponse.data.items.map((item) => [item.id, item]))
    let hasStableTotals = true
    for (let page = 2; page <= pageCount; page += 1) {
      const response = await fetchPage(page)
      if (
        normalizedPageTotal(response.data) !== total ||
        response.data.page_size !== pageSize ||
        response.data.page !== page
      ) {
        hasStableTotals = false
        break
      }
      for (const item of response.data.items) itemsById.set(item.id, item)
    }
    if (!hasStableTotals || itemsById.size !== total) continue

    const confirmation = await fetchPage(1)
    if (
      normalizedPageTotal(confirmation.data) !== total ||
      confirmation.data.page_size !== pageSize ||
      !samePageIdentity(firstResponse.data.items, confirmation.data.items)
    ) continue

    return {
      ...firstResponse,
      data: {
        ...firstResponse.data,
        items: [...itemsById.values()],
        page: 1,
        page_size: pageSize,
        total,
      },
    }
  }
  throw new Error('Project resources changed during pagination. Please retry.')
}

export function fetchProjectAssets(projectId: string) {
  const normalizedProjectId = requireId(projectId, 'Project ID')
  return fetchStablePages((page) => fetchProjectAssetPage(normalizedProjectId, page))
}

export function fetchProjectGenerationTasks(projectId: string) {
  const normalizedProjectId = requireId(projectId, 'Project ID')
  return fetchStablePages((page) => fetchProjectGenerationTaskPage(normalizedProjectId, page))
}

export function uploadProjectAsset(
  projectId: string,
  originCanvasId: string,
  file: File,
  type: ProjectAssetUploadType,
) {
  const form = new FormData()
  form.append('project_id', requireId(projectId, 'Project ID'))
  form.append('origin_canvas_id', requireId(originCanvasId, 'Canvas ID'))
  form.append('type', type)
  form.append('file', file)
  return request.post<Asset>('/assets/upload', form)
}

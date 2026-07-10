import { isAxiosError } from 'axios'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { createProject as requestProjectCreation, fetchProjects } from './api'
import type { Project, ProjectCreatePayload } from './types'

interface ProjectErrorResponse {
  detail?: unknown
}

interface LoadRequest {
  generation: number
  promise: Promise<Project[]>
}

interface CreateRequest {
  generation: number
  name: string
  promise: Promise<Project>
}

function getProjectErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError<ProjectErrorResponse>(error)) {
    const detail = error.response?.data?.detail
    if (typeof detail === 'string' && detail.trim()) {
      return detail
    }

    if (error.code === 'ECONNABORTED') {
      return '请求超时，请稍后重试。'
    }
  }

  return fallback
}

export const useProjectStore = defineStore('projects', () => {
  const items = ref<Project[]>([])
  const total = ref(0)
  const hasLoaded = ref(false)
  const isLoading = ref(false)
  const isCreating = ref(false)
  const loadError = ref('')
  const createError = ref('')

  let generation = 0
  let loadRequest: LoadRequest | null = null
  let createRequest: CreateRequest | null = null

  async function loadProjects(force = false): Promise<Project[]> {
    const requestedGeneration = generation
    const pendingCreate = createRequest

    if (pendingCreate?.generation === requestedGeneration) {
      try {
        await pendingCreate.promise
      } catch {
        // A failed create must not block a list refresh.
      }
    }

    if (requestedGeneration !== generation) {
      return items.value
    }

    if (!force && hasLoaded.value) {
      return items.value
    }

    if (loadRequest?.generation === requestedGeneration) {
      return loadRequest.promise
    }

    isLoading.value = true
    loadError.value = ''

    const currentPromise = (async () => {
      try {
        const response = await fetchProjects()

        if (requestedGeneration === generation) {
          items.value = response.data.items
          total.value = response.data.total
          hasLoaded.value = true
        }

        return items.value
      } catch (error) {
        if (requestedGeneration === generation) {
          loadError.value = getProjectErrorMessage(error, '项目列表加载失败，请稍后重试。')
        }
        throw error
      }
    })()

    loadRequest = { generation: requestedGeneration, promise: currentPromise }

    try {
      return await currentPromise
    } finally {
      if (loadRequest?.promise === currentPromise) {
        loadRequest = null
        isLoading.value = false
      }
    }
  }

  function refreshProjects() {
    return loadProjects(true)
  }

  async function createProject(payload: ProjectCreatePayload): Promise<Project> {
    const requestedGeneration = generation
    const pendingCreate = createRequest

    if (pendingCreate?.generation === requestedGeneration) {
      if (pendingCreate.name === payload.name) {
        return pendingCreate.promise
      }

      throw new Error('已有另一个项目创建请求正在处理，请稍后重试。')
    }

    isCreating.value = true
    createError.value = ''

    const currentPromise = (async () => {
      const pendingLoad = loadRequest
      if (pendingLoad?.generation === requestedGeneration) {
        try {
          await pendingLoad.promise
        } catch {
          // Project creation remains available when the initial list request fails.
        }
      }

      if (requestedGeneration !== generation) {
        throw new Error('登录状态已变化，请重新提交项目。')
      }

      try {
        const response = await requestProjectCreation(payload)

        if (requestedGeneration !== generation) {
          throw new Error('登录状态已变化，请重新加载项目列表。')
        }

        const project = response.data
        const alreadyExists = items.value.some((item) => item.id === project.id)
        items.value = [project, ...items.value.filter((item) => item.id !== project.id)]
        if (!alreadyExists) {
          total.value += 1
        }
        total.value = Math.max(total.value, items.value.length)
        return project
      } catch (error) {
        if (requestedGeneration === generation) {
          createError.value = getProjectErrorMessage(error, '项目创建失败，请稍后重试。')
        }
        throw error
      }
    })()

    createRequest = {
      generation: requestedGeneration,
      name: payload.name,
      promise: currentPromise,
    }

    try {
      return await currentPromise
    } finally {
      if (createRequest?.promise === currentPromise) {
        createRequest = null
        isCreating.value = false
      }
    }
  }

  function resetProjects() {
    generation += 1
    loadRequest = null
    createRequest = null
    items.value = []
    total.value = 0
    hasLoaded.value = false
    isLoading.value = false
    isCreating.value = false
    loadError.value = ''
    createError.value = ''
  }

  return {
    items,
    total,
    hasLoaded,
    isLoading,
    isCreating,
    loadError,
    createError,
    loadProjects,
    refreshProjects,
    createProject,
    resetProjects,
  }
})

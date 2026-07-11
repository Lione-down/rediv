import { isAxiosError } from 'axios'
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useAuthStore } from '../../store/auth'
import { fetchTemplateDetail, fetchTemplates } from './api'
import type { Template, TemplateListResponse } from './types'

interface TemplateErrorResponse {
  detail?: unknown
}

interface ListRequest {
  generation: number
  promise: Promise<void>
}

interface DetailRequest {
  id: number
  generation: number
  promise: Promise<void>
}

function createEmptyTemplateListResponse(): TemplateListResponse {
  return {
    items: [],
    total: 0,
  }
}

function getTemplateErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError<TemplateErrorResponse>(error)) {
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

export const useTemplateStore = defineStore('templates', () => {
  const authStore = useAuthStore()
  const collection = ref<TemplateListResponse>(createEmptyTemplateListResponse())
  const hasLoaded = ref(false)
  const isLoading = ref(false)
  const loadError = ref('')

  const selectedTemplate = ref<Template | null>(null)
  const selectedTemplateId = ref('')
  const detailHasLoaded = ref(false)
  const detailIsLoading = ref(false)
  const detailLoadError = ref('')

  let generation = 0
  let listRequest: ListRequest | null = null
  const detailRequests = new Map<string, DetailRequest>()
  let detailRequestSequence = 0
  let activeDetailRequestId: number | null = null
  let latestDetailTemplateId = ''

  async function loadTemplates(force = false): Promise<void> {
    const requestedGeneration = generation

    if (listRequest?.generation === requestedGeneration) {
      return listRequest.promise
    }

    if (!force && hasLoaded.value) {
      return
    }

    isLoading.value = true
    loadError.value = ''

    const currentPromise = (async () => {
      try {
        const response = await fetchTemplates()

        if (requestedGeneration !== generation) {
          return
        }

        collection.value = response.data
        hasLoaded.value = true
      } catch (error) {
        if (requestedGeneration !== generation) {
          return
        }

        loadError.value = getTemplateErrorMessage(
          error,
          '模板列表加载失败，请稍后重试。',
        )
        throw error
      }
    })()

    const currentRequest: ListRequest = {
      generation: requestedGeneration,
      promise: currentPromise,
    }
    listRequest = currentRequest

    try {
      return await currentPromise
    } finally {
      if (listRequest === currentRequest) {
        listRequest = null
        isLoading.value = false
      }
    }
  }

  function refreshTemplates() {
    return loadTemplates(true)
  }

  function isCurrentDetailRequest(
    requestGeneration: number,
    templateId: string,
    requestId: number,
  ) {
    return (
      requestGeneration === generation &&
      activeDetailRequestId === requestId &&
      latestDetailTemplateId === templateId
    )
  }

  async function loadTemplateDetail(
    templateId: string,
    force = false,
  ): Promise<void> {
    const requestedTemplateId = templateId.trim()
    const requestedGeneration = generation
    const isSameTemplate = latestDetailTemplateId === requestedTemplateId

    latestDetailTemplateId = requestedTemplateId
    selectedTemplateId.value = requestedTemplateId
    detailLoadError.value = ''

    if (!isSameTemplate) {
      selectedTemplate.value = null
      detailHasLoaded.value = false
    }

    const pendingRequest = detailRequests.get(requestedTemplateId)
    if (pendingRequest?.generation === requestedGeneration) {
      activeDetailRequestId = pendingRequest.id
      detailIsLoading.value = true
      return pendingRequest.promise
    }

    if (!force && isSameTemplate && detailHasLoaded.value) {
      activeDetailRequestId = null
      detailIsLoading.value = false
      return
    }

    detailIsLoading.value = true

    const requestId = ++detailRequestSequence
    const currentPromise = (async () => {
      try {
        const response = await fetchTemplateDetail(requestedTemplateId)

        if (
          !isCurrentDetailRequest(
            requestedGeneration,
            requestedTemplateId,
            requestId,
          )
        ) {
          return
        }

        selectedTemplate.value = response.data
        detailHasLoaded.value = true
      } catch (error) {
        if (
          !isCurrentDetailRequest(
            requestedGeneration,
            requestedTemplateId,
            requestId,
          )
        ) {
          return
        }

        detailLoadError.value = getTemplateErrorMessage(
          error,
          '模板详情加载失败，请稍后重试。',
        )
        throw error
      }
    })()

    const currentRequest: DetailRequest = {
      id: requestId,
      generation: requestedGeneration,
      promise: currentPromise,
    }
    detailRequests.set(requestedTemplateId, currentRequest)
    activeDetailRequestId = requestId

    try {
      return await currentPromise
    } finally {
      if (detailRequests.get(requestedTemplateId) === currentRequest) {
        detailRequests.delete(requestedTemplateId)
      }

      if (
        isCurrentDetailRequest(
          requestedGeneration,
          requestedTemplateId,
          requestId,
        )
      ) {
        activeDetailRequestId = null
        detailIsLoading.value = false
      }
    }
  }

  function refreshTemplateDetail() {
    if (!selectedTemplateId.value) {
      return Promise.resolve()
    }

    return loadTemplateDetail(selectedTemplateId.value, true)
  }

  function clearTemplateDetail() {
    activeDetailRequestId = null
    latestDetailTemplateId = ''
    selectedTemplate.value = null
    selectedTemplateId.value = ''
    detailHasLoaded.value = false
    detailIsLoading.value = false
    detailLoadError.value = ''
  }

  function resetTemplates() {
    generation += 1
    listRequest = null
    detailRequests.clear()
    activeDetailRequestId = null
    latestDetailTemplateId = ''

    collection.value = createEmptyTemplateListResponse()
    hasLoaded.value = false
    isLoading.value = false
    loadError.value = ''

    selectedTemplate.value = null
    selectedTemplateId.value = ''
    detailHasLoaded.value = false
    detailIsLoading.value = false
    detailLoadError.value = ''
  }

  watch(
    () => authStore.token,
    (token, previousToken) => {
      if (token !== previousToken) {
        resetTemplates()
      }
    },
    { flush: 'sync' },
  )

  return {
    collection,
    hasLoaded,
    isLoading,
    loadError,
    selectedTemplate,
    selectedTemplateId,
    detailHasLoaded,
    detailIsLoading,
    detailLoadError,
    loadTemplates,
    refreshTemplates,
    loadTemplateDetail,
    refreshTemplateDetail,
    clearTemplateDetail,
    resetTemplates,
  }
})

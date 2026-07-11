import { isAxiosError } from 'axios'
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useAuthStore } from '../../store/auth'
import {
  deleteTemplate as requestTemplateDeletion,
  fetchTemplateDetail,
  fetchTemplates,
  useTemplate as requestTemplateUse,
} from './api'
import type {
  Template,
  TemplateListResponse,
  TemplateUseResponse,
} from './types'

interface TemplateErrorResponse {
  detail?: unknown
}

interface ListRequest {
  id: number
  generation: number
  promise: Promise<void>
}

interface DetailRequest {
  id: number
  generation: number
  promise: Promise<void>
}

interface DeleteRequest {
  id: number
  generation: number
  promise: Promise<boolean>
}

interface UseRequest {
  id: number
  generation: number
  promise: Promise<TemplateUseResponse | null>
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

function normalizeTemplateId(templateId: string) {
  const normalizedTemplateId = templateId.trim()
  if (!normalizedTemplateId) {
    throw new TypeError('Template ID is required.')
  }

  return normalizedTemplateId
}

const TEMPLATE_USE_BUSY_ERROR = '已有模板正在创建项目，请等待完成。'

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

  const deletingTemplateId = ref('')
  const deleteError = ref('')
  const usingTemplateId = ref('')
  const useError = ref('')

  let generation = 0
  let listRequest: ListRequest | null = null
  let listRequestSequence = 0
  let activeListRequestId: number | null = null
  const detailRequests = new Map<string, DetailRequest>()
  let detailRequestSequence = 0
  let activeDetailRequestId: number | null = null
  let latestDetailTemplateId = ''
  const deleteRequests = new Map<string, DeleteRequest>()
  let deleteRequestSequence = 0
  let activeDeleteRequestId: number | null = null
  let latestDeleteTemplateId = ''
  const useRequests = new Map<string, UseRequest>()
  let useRequestSequence = 0
  let activeUseRequestId: number | null = null
  let latestUseTemplateId = ''

  function isCurrentListRequest(
    requestGeneration: number,
    requestId: number,
  ) {
    return (
      requestGeneration === generation && activeListRequestId === requestId
    )
  }

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
    const requestId = ++listRequestSequence

    const currentPromise = (async () => {
      try {
        const response = await fetchTemplates()

        if (!isCurrentListRequest(requestedGeneration, requestId)) {
          return
        }

        collection.value = response.data
        hasLoaded.value = true
      } catch (error) {
        if (!isCurrentListRequest(requestedGeneration, requestId)) {
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
      id: requestId,
      generation: requestedGeneration,
      promise: currentPromise,
    }
    listRequest = currentRequest
    activeListRequestId = requestId

    try {
      return await currentPromise
    } finally {
      if (listRequest === currentRequest) {
        listRequest = null
        activeListRequestId = null
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
    const requestedTemplateId = normalizeTemplateId(templateId)
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

  function invalidateDeletedTemplate(templateId: string) {
    listRequest = null
    activeListRequestId = null
    isLoading.value = false

    if (collection.value.items.some((template) => template.id === templateId)) {
      collection.value = {
        items: collection.value.items.filter(
          (template) => template.id !== templateId,
        ),
        total: Math.max(0, collection.value.total - 1),
      }
    }

    detailRequests.delete(templateId)
    if (selectedTemplateId.value === templateId) {
      clearTemplateDetail()
    }
  }

  function isCurrentDeleteRequest(
    requestGeneration: number,
    templateId: string,
    requestId: number,
  ) {
    return (
      requestGeneration === generation &&
      activeDeleteRequestId === requestId &&
      latestDeleteTemplateId === templateId
    )
  }

  async function deleteTemplateById(templateId: string): Promise<boolean> {
    const requestedTemplateId = normalizeTemplateId(templateId)
    const requestedGeneration = generation
    latestDeleteTemplateId = requestedTemplateId
    deletingTemplateId.value = requestedTemplateId
    deleteError.value = ''

    const pendingRequest = deleteRequests.get(requestedTemplateId)
    if (pendingRequest?.generation === requestedGeneration) {
      activeDeleteRequestId = pendingRequest.id
      return pendingRequest.promise
    }

    const requestId = ++deleteRequestSequence
    const currentPromise = (async () => {
      try {
        await requestTemplateDeletion(requestedTemplateId)
        if (requestedGeneration !== generation) {
          return false
        }

        invalidateDeletedTemplate(requestedTemplateId)
        return true
      } catch (error) {
        if (
          !isCurrentDeleteRequest(
            requestedGeneration,
            requestedTemplateId,
            requestId,
          )
        ) {
          return false
        }

        deleteError.value = getTemplateErrorMessage(
          error,
          '模板删除失败，请稍后重试。',
        )
        throw error
      }
    })()

    const currentRequest: DeleteRequest = {
      id: requestId,
      generation: requestedGeneration,
      promise: currentPromise,
    }
    deleteRequests.set(requestedTemplateId, currentRequest)
    activeDeleteRequestId = requestId

    try {
      return await currentPromise
    } finally {
      if (deleteRequests.get(requestedTemplateId) === currentRequest) {
        deleteRequests.delete(requestedTemplateId)
      }
      if (
        isCurrentDeleteRequest(
          requestedGeneration,
          requestedTemplateId,
          requestId,
        )
      ) {
        activeDeleteRequestId = null
        deletingTemplateId.value = ''
      }
    }
  }

  function isCurrentUseRequest(
    requestGeneration: number,
    templateId: string,
    requestId: number,
  ) {
    return (
      requestGeneration === generation &&
      activeUseRequestId === requestId &&
      latestUseTemplateId === templateId
    )
  }

  async function useTemplateById(
    templateId: string,
  ): Promise<TemplateUseResponse | null> {
    const requestedTemplateId = normalizeTemplateId(templateId)
    const requestedGeneration = generation

    const pendingRequest = useRequests.get(requestedTemplateId)
    if (pendingRequest?.generation === requestedGeneration) {
      activeUseRequestId = pendingRequest.id
      latestUseTemplateId = requestedTemplateId
      usingTemplateId.value = requestedTemplateId
      useError.value = ''
      return pendingRequest.promise
    }

    if (useRequests.size > 0) {
      useError.value = TEMPLATE_USE_BUSY_ERROR
      throw new Error(TEMPLATE_USE_BUSY_ERROR)
    }

    latestUseTemplateId = requestedTemplateId
    usingTemplateId.value = requestedTemplateId
    useError.value = ''

    const requestId = ++useRequestSequence
    const currentPromise = (async () => {
      try {
        const response = await requestTemplateUse(requestedTemplateId)
        if (!isCurrentUseRequest(
          requestedGeneration,
          requestedTemplateId,
          requestId,
        )) {
          return null
        }

        useError.value = ''
        return response.data
      } catch (error) {
        if (
          !isCurrentUseRequest(
            requestedGeneration,
            requestedTemplateId,
            requestId,
          )
        ) {
          return null
        }

        useError.value = getTemplateErrorMessage(
          error,
          '模板使用失败，请稍后重试。',
        )
        throw error
      }
    })()

    const currentRequest: UseRequest = {
      id: requestId,
      generation: requestedGeneration,
      promise: currentPromise,
    }
    useRequests.set(requestedTemplateId, currentRequest)
    activeUseRequestId = requestId

    try {
      return await currentPromise
    } finally {
      if (useRequests.get(requestedTemplateId) === currentRequest) {
        useRequests.delete(requestedTemplateId)
      }
      if (
        isCurrentUseRequest(
          requestedGeneration,
          requestedTemplateId,
          requestId,
        )
      ) {
        activeUseRequestId = null
        usingTemplateId.value = ''
      }
    }
  }

  function resetTemplates() {
    generation += 1
    listRequest = null
    activeListRequestId = null
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

    deleteRequests.clear()
    activeDeleteRequestId = null
    latestDeleteTemplateId = ''
    deletingTemplateId.value = ''
    deleteError.value = ''

    useRequests.clear()
    activeUseRequestId = null
    latestUseTemplateId = ''
    usingTemplateId.value = ''
    useError.value = ''
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
    deletingTemplateId,
    deleteError,
    deleteTemplateById,
    usingTemplateId,
    useError,
    useTemplateById,
    resetTemplates,
  }
})

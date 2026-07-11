import { ref } from 'vue'
import {
  deleteTemplate as requestTemplateDeletion,
  useTemplate as requestTemplateUse,
} from './api'
import type { TemplateUseResponse } from './types'

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

interface TemplateMutationControllerOptions {
  getGeneration: () => number
  getErrorMessage: (error: unknown, fallback: string) => string
  normalizeTemplateId: (templateId: string) => string
  invalidateDeletedTemplate: (templateId: string) => void
}

const TEMPLATE_USE_BUSY_ERROR = '已有模板正在创建项目，请等待完成。'

export function createTemplateMutationController(
  options: TemplateMutationControllerOptions,
) {
  const deletingTemplateId = ref('')
  const deleteError = ref('')
  const usingTemplateId = ref('')
  const useError = ref('')
  const useErrorTemplateId = ref('')

  const deleteRequests = new Map<string, DeleteRequest>()
  let deleteRequestSequence = 0
  let activeDeleteRequestId: number | null = null
  let latestDeleteTemplateId = ''
  const useRequests = new Map<string, UseRequest>()
  let useRequestSequence = 0
  let activeUseRequestId: number | null = null
  let latestUseTemplateId = ''

  function isCurrentDeleteRequest(
    requestGeneration: number,
    templateId: string,
    requestId: number,
  ) {
    return (
      requestGeneration === options.getGeneration() &&
      activeDeleteRequestId === requestId &&
      latestDeleteTemplateId === templateId
    )
  }

  async function deleteTemplateById(templateId: string): Promise<boolean> {
    const requestedTemplateId = options.normalizeTemplateId(templateId)
    const requestedGeneration = options.getGeneration()
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
        if (requestedGeneration !== options.getGeneration()) {
          return false
        }

        options.invalidateDeletedTemplate(requestedTemplateId)
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

        deleteError.value = options.getErrorMessage(
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
      requestGeneration === options.getGeneration() &&
      activeUseRequestId === requestId &&
      latestUseTemplateId === templateId
    )
  }

  async function useTemplateById(
    templateId: string,
  ): Promise<TemplateUseResponse | null> {
    const requestedTemplateId = options.normalizeTemplateId(templateId)
    const requestedGeneration = options.getGeneration()

    const pendingRequest = useRequests.get(requestedTemplateId)
    if (pendingRequest?.generation === requestedGeneration) {
      activeUseRequestId = pendingRequest.id
      latestUseTemplateId = requestedTemplateId
      usingTemplateId.value = requestedTemplateId
      useError.value = ''
      useErrorTemplateId.value = ''
      return pendingRequest.promise
    }

    if (useRequests.size > 0) {
      useError.value = TEMPLATE_USE_BUSY_ERROR
      useErrorTemplateId.value = requestedTemplateId
      throw new Error(TEMPLATE_USE_BUSY_ERROR)
    }

    latestUseTemplateId = requestedTemplateId
    usingTemplateId.value = requestedTemplateId
    useError.value = ''
    useErrorTemplateId.value = ''

    const requestId = ++useRequestSequence
    const currentPromise = (async () => {
      try {
        const response = await requestTemplateUse(requestedTemplateId)
        if (
          !isCurrentUseRequest(
            requestedGeneration,
            requestedTemplateId,
            requestId,
          )
        ) {
          return null
        }

        useError.value = ''
        useErrorTemplateId.value = ''
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

        useError.value = options.getErrorMessage(
          error,
          '模板使用失败，请稍后重试。',
        )
        useErrorTemplateId.value = requestedTemplateId
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

  function reset() {
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
    useErrorTemplateId.value = ''
  }

  return {
    deletingTemplateId,
    deleteError,
    deleteTemplateById,
    usingTemplateId,
    useError,
    useErrorTemplateId,
    useTemplateById,
    reset,
  }
}

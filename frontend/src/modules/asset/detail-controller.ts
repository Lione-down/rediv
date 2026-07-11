import { ref } from 'vue'
import {
  deleteAsset as requestAssetDeletion,
  fetchAssetDetail,
} from '../../api/assets'
import type { Asset } from '../../types/asset'

interface DetailRequest {
  id: number
  generation: number
  promise: Promise<void>
}

interface DeleteRequest {
  id: number
  generation: number
  promise: Promise<Asset | null>
}

interface AssetCollectionRefreshPlan {
  shouldRefreshDefault: boolean
  shouldRefreshSpace: boolean
}

interface AssetDetailControllerOptions {
  getGeneration: () => number
  getErrorMessage: (error: unknown, fallback: string) => string
  invalidateCollections: (deletedAsset: Asset) => AssetCollectionRefreshPlan
  refreshDefaultAssets: () => Promise<unknown>
  refreshSpaceAssets: () => Promise<unknown>
}

function normalizeAssetId(assetId: string) {
  const normalizedAssetId = assetId.trim()
  if (!normalizedAssetId) {
    throw new TypeError('Asset ID is required.')
  }

  return normalizedAssetId
}

export function createAssetDetailController(
  options: AssetDetailControllerOptions,
) {
  const selectedAsset = ref<Asset | null>(null)
  const selectedAssetId = ref('')
  const detailHasLoaded = ref(false)
  const detailIsLoading = ref(false)
  const detailLoadError = ref('')

  const deletingAssetId = ref('')
  const deleteError = ref('')

  const detailRequests = new Map<string, DetailRequest>()
  let detailRequestSequence = 0
  let activeDetailRequestId: number | null = null
  let latestDetailAssetId = ''
  const deleteRequests = new Map<string, DeleteRequest>()
  let deleteRequestSequence = 0
  let activeDeleteRequestId: number | null = null
  let latestDeleteAssetId = ''

  function isCurrentDetailRequest(
    requestGeneration: number,
    assetId: string,
    requestId: number,
  ) {
    return (
      requestGeneration === options.getGeneration() &&
      activeDetailRequestId === requestId &&
      latestDetailAssetId === assetId
    )
  }

  async function loadAssetDetail(
    assetId: string,
    force = false,
  ): Promise<void> {
    const requestedAssetId = normalizeAssetId(assetId)
    const requestedGeneration = options.getGeneration()
    const isSameAsset = latestDetailAssetId === requestedAssetId

    latestDetailAssetId = requestedAssetId
    selectedAssetId.value = requestedAssetId
    detailLoadError.value = ''

    if (!isSameAsset) {
      selectedAsset.value = null
      detailHasLoaded.value = false
    }

    const pendingRequest = detailRequests.get(requestedAssetId)
    if (pendingRequest?.generation === requestedGeneration) {
      activeDetailRequestId = pendingRequest.id
      detailIsLoading.value = true
      return pendingRequest.promise
    }

    if (!force && isSameAsset && detailHasLoaded.value) {
      activeDetailRequestId = null
      detailIsLoading.value = false
      return
    }

    detailIsLoading.value = true
    const requestId = ++detailRequestSequence
    const currentPromise = (async () => {
      try {
        const response = await fetchAssetDetail(requestedAssetId)
        if (
          !isCurrentDetailRequest(
            requestedGeneration,
            requestedAssetId,
            requestId,
          )
        ) {
          return
        }

        selectedAsset.value = response.data
        detailHasLoaded.value = true
      } catch (error) {
        if (
          !isCurrentDetailRequest(
            requestedGeneration,
            requestedAssetId,
            requestId,
          )
        ) {
          return
        }

        detailLoadError.value = options.getErrorMessage(
          error,
          '资产详情加载失败，请稍后重试。',
        )
        throw error
      }
    })()

    const currentRequest: DetailRequest = {
      id: requestId,
      generation: requestedGeneration,
      promise: currentPromise,
    }
    detailRequests.set(requestedAssetId, currentRequest)
    activeDetailRequestId = requestId

    try {
      return await currentPromise
    } finally {
      if (detailRequests.get(requestedAssetId) === currentRequest) {
        detailRequests.delete(requestedAssetId)
      }
      if (
        isCurrentDetailRequest(
          requestedGeneration,
          requestedAssetId,
          requestId,
        )
      ) {
        activeDetailRequestId = null
        detailIsLoading.value = false
      }
    }
  }

  function refreshAssetDetail() {
    return selectedAssetId.value
      ? loadAssetDetail(selectedAssetId.value, true)
      : Promise.resolve()
  }

  function clearAssetDetail() {
    activeDetailRequestId = null
    latestDetailAssetId = ''
    selectedAsset.value = null
    selectedAssetId.value = ''
    detailHasLoaded.value = false
    detailIsLoading.value = false
    detailLoadError.value = ''
  }

  function invalidateDeletedAssetDetail(assetId: string) {
    detailRequests.delete(assetId)
    if (selectedAssetId.value === assetId) {
      clearAssetDetail()
    }
  }

  function isCurrentDeleteRequest(
    requestGeneration: number,
    assetId: string,
    requestId: number,
  ) {
    return (
      requestGeneration === options.getGeneration() &&
      activeDeleteRequestId === requestId &&
      latestDeleteAssetId === assetId
    )
  }

  async function deleteAssetById(assetId: string): Promise<Asset | null> {
    const requestedAssetId = normalizeAssetId(assetId)
    const requestedGeneration = options.getGeneration()
    latestDeleteAssetId = requestedAssetId
    deletingAssetId.value = requestedAssetId
    deleteError.value = ''

    const pendingRequest = deleteRequests.get(requestedAssetId)
    if (pendingRequest?.generation === requestedGeneration) {
      activeDeleteRequestId = pendingRequest.id
      return pendingRequest.promise
    }

    const requestId = ++deleteRequestSequence
    const currentPromise = (async () => {
      try {
        const response = await requestAssetDeletion(requestedAssetId)
        if (requestedGeneration !== options.getGeneration()) {
          return null
        }

        const refresh = options.invalidateCollections(response.data)
        invalidateDeletedAssetDetail(response.data.id)
        const refreshRequests: Promise<unknown>[] = []
        if (refresh.shouldRefreshDefault) {
          refreshRequests.push(options.refreshDefaultAssets())
        }
        if (refresh.shouldRefreshSpace) {
          refreshRequests.push(options.refreshSpaceAssets())
        }
        await Promise.allSettled(refreshRequests)

        return requestedGeneration === options.getGeneration()
          ? response.data
          : null
      } catch (error) {
        if (
          !isCurrentDeleteRequest(
            requestedGeneration,
            requestedAssetId,
            requestId,
          )
        ) {
          return null
        }

        deleteError.value = options.getErrorMessage(
          error,
          '资产删除失败，请稍后重试。',
        )
        throw error
      }
    })()

    const currentRequest: DeleteRequest = {
      id: requestId,
      generation: requestedGeneration,
      promise: currentPromise,
    }
    deleteRequests.set(requestedAssetId, currentRequest)
    activeDeleteRequestId = requestId

    try {
      return await currentPromise
    } finally {
      if (deleteRequests.get(requestedAssetId) === currentRequest) {
        deleteRequests.delete(requestedAssetId)
      }
      if (
        isCurrentDeleteRequest(
          requestedGeneration,
          requestedAssetId,
          requestId,
        )
      ) {
        activeDeleteRequestId = null
        deletingAssetId.value = ''
      }
    }
  }

  function reset() {
    detailRequests.clear()
    activeDetailRequestId = null
    latestDetailAssetId = ''
    selectedAsset.value = null
    selectedAssetId.value = ''
    detailHasLoaded.value = false
    detailIsLoading.value = false
    detailLoadError.value = ''

    deleteRequests.clear()
    activeDeleteRequestId = null
    latestDeleteAssetId = ''
    deletingAssetId.value = ''
    deleteError.value = ''
  }

  return {
    selectedAsset,
    selectedAssetId,
    detailHasLoaded,
    detailIsLoading,
    detailLoadError,
    loadAssetDetail,
    refreshAssetDetail,
    clearAssetDetail,
    deletingAssetId,
    deleteError,
    deleteAssetById,
    reset,
  }
}

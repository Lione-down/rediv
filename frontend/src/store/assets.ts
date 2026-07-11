import { isAxiosError } from 'axios'
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { fetchAssets } from '../api/assets'
import { createAssetDetailController } from '../modules/asset/detail-controller'
import { useAuthStore } from './auth'
import type {
  Asset,
  AssetListParams,
  AssetListQuery,
  AssetListResponse,
} from '../types/asset'

interface AssetErrorResponse {
  detail?: unknown
}

interface LoadRequest {
  generation: number
  revision: number
  promise: Promise<Asset[]>
}

interface SpaceLoadRequest {
  id: number
  generation: number
  queryKey: string
  promise: Promise<void>
}

const DEFAULT_ASSET_PAGE = 1
const DEFAULT_ASSET_PAGE_SIZE = 20

function resolveAssetListQuery(params: AssetListParams = {}): AssetListQuery {
  return {
    ...(params.asset_type ? { asset_type: params.asset_type } : {}),
    ...(params.project_id ? { project_id: params.project_id } : {}),
    page: params.page ?? DEFAULT_ASSET_PAGE,
    page_size: params.page_size ?? DEFAULT_ASSET_PAGE_SIZE,
  }
}

function getAssetListQueryKey(query: AssetListQuery) {
  return JSON.stringify([
    query.asset_type ?? null,
    query.project_id ?? null,
    query.page,
    query.page_size,
  ])
}

function createEmptyAssetListResponse(query: AssetListQuery): AssetListResponse {
  return {
    items: [],
    total: 0,
    page: query.page,
    page_size: query.page_size,
  }
}

function getAssetErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError<AssetErrorResponse>(error)) {
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

export const useAssetStore = defineStore('assets', () => {
  const authStore = useAuthStore()
  const items = ref<Asset[]>([])
  const hasLoaded = ref(false)
  const isLoading = ref(false)
  const loadError = ref('')

  const initialSpaceQuery = resolveAssetListQuery()
  const spaceCollection = ref<AssetListResponse>(
    createEmptyAssetListResponse(initialSpaceQuery),
  )
  const spaceQuery = ref<AssetListQuery>(initialSpaceQuery)
  const spaceHasLoaded = ref(false)
  const spaceIsLoading = ref(false)
  const spaceLoadError = ref('')

  let generation = 0
  let defaultCollectionRevision = 0
  let loadRequest: LoadRequest | null = null
  const spaceLoadRequests = new Map<string, SpaceLoadRequest>()
  let spaceRequestSequence = 0
  let activeSpaceRequestId: number | null = null
  let latestSpaceQueryKey = ''
  const detailController = createAssetDetailController({
    getGeneration: () => generation,
    getErrorMessage: getAssetErrorMessage,
    invalidateCollections: invalidateDeletedAssetCollections,
    refreshDefaultAssets: refreshAssets,
    refreshSpaceAssets,
  })

  async function loadAssets(force = true): Promise<Asset[]> {
    const requestedGeneration = generation
    const requestedRevision = defaultCollectionRevision

    if (
      loadRequest?.generation === requestedGeneration &&
      loadRequest.revision === requestedRevision
    ) {
      return loadRequest.promise
    }

    if (!force && hasLoaded.value) {
      return items.value
    }

    isLoading.value = true
    loadError.value = ''

    const currentPromise = (async () => {
      try {
        const response = await fetchAssets()

        if (
          requestedGeneration === generation &&
          requestedRevision === defaultCollectionRevision
        ) {
          items.value = response.data.items
          hasLoaded.value = true
        }

        return items.value
      } catch (error) {
        if (
          requestedGeneration !== generation ||
          requestedRevision !== defaultCollectionRevision
        ) {
          return items.value
        }

        loadError.value = getAssetErrorMessage(
          error,
          '资产列表加载失败，请稍后重试。',
        )
        throw error
      }
    })()

    loadRequest = {
      generation: requestedGeneration,
      revision: requestedRevision,
      promise: currentPromise,
    }

    try {
      return await currentPromise
    } finally {
      if (loadRequest?.promise === currentPromise) {
        loadRequest = null
        isLoading.value = false
      }
    }
  }

  function refreshAssets() {
    return loadAssets(true)
  }

  function isCurrentSpaceRequest(
    requestGeneration: number,
    queryKey: string,
    requestId: number,
  ) {
    return (
      requestGeneration === generation &&
      activeSpaceRequestId === requestId &&
      latestSpaceQueryKey === queryKey
    )
  }

  async function loadSpaceAssets(
    params: AssetListParams = {},
    force = false,
  ): Promise<void> {
    const query = resolveAssetListQuery(params)
    const queryKey = getAssetListQueryKey(query)
    const requestedGeneration = generation
    const isSameQuery = latestSpaceQueryKey === queryKey

    latestSpaceQueryKey = queryKey
    spaceQuery.value = query
    spaceLoadError.value = ''

    if (!isSameQuery) {
      spaceCollection.value = createEmptyAssetListResponse(query)
      spaceHasLoaded.value = false
    }

    const pendingRequest = spaceLoadRequests.get(queryKey)
    if (pendingRequest?.generation === requestedGeneration) {
      activeSpaceRequestId = pendingRequest.id
      spaceIsLoading.value = true
      return pendingRequest.promise
    }

    if (!force && isSameQuery && spaceHasLoaded.value) {
      activeSpaceRequestId = null
      spaceIsLoading.value = false
      return
    }

    spaceIsLoading.value = true

    const requestId = ++spaceRequestSequence
    const currentPromise = (async () => {
      try {
        const response = await fetchAssets(query)

        if (!isCurrentSpaceRequest(requestedGeneration, queryKey, requestId)) {
          return
        }

        spaceCollection.value = response.data
        spaceHasLoaded.value = true
      } catch (error) {
        if (!isCurrentSpaceRequest(requestedGeneration, queryKey, requestId)) {
          return
        }

        spaceLoadError.value = getAssetErrorMessage(
          error,
          '资产列表加载失败，请稍后重试。',
        )
        throw error
      }
    })()

    const currentRequest: SpaceLoadRequest = {
      id: requestId,
      generation: requestedGeneration,
      queryKey,
      promise: currentPromise,
    }
    spaceLoadRequests.set(queryKey, currentRequest)
    activeSpaceRequestId = requestId

    try {
      return await currentPromise
    } finally {
      if (spaceLoadRequests.get(queryKey) === currentRequest) {
        spaceLoadRequests.delete(queryKey)
      }

      if (isCurrentSpaceRequest(requestedGeneration, queryKey, requestId)) {
        activeSpaceRequestId = null
        spaceIsLoading.value = false
      }
    }
  }

  function refreshSpaceAssets() {
    return loadSpaceAssets(spaceQuery.value, true)
  }

  function invalidateDeletedAssetCollections(deletedAsset: Asset) {
    const shouldRefreshDefault = hasLoaded.value || isLoading.value
    const shouldRefreshSpace = spaceHasLoaded.value || spaceIsLoading.value

    defaultCollectionRevision += 1
    loadRequest = null
    isLoading.value = false
    items.value = items.value.filter((asset) => asset.id !== deletedAsset.id)

    spaceLoadRequests.clear()
    activeSpaceRequestId = null
    spaceIsLoading.value = false
    if (spaceCollection.value.items.some((asset) => asset.id === deletedAsset.id)) {
      spaceCollection.value = {
        ...spaceCollection.value,
        items: spaceCollection.value.items.filter(
          (asset) => asset.id !== deletedAsset.id,
        ),
        total: Math.max(0, spaceCollection.value.total - 1),
      }
    }

    return { shouldRefreshDefault, shouldRefreshSpace }
  }

  function resetAssets() {
    generation += 1
    loadRequest = null
    spaceLoadRequests.clear()
    activeSpaceRequestId = null
    latestSpaceQueryKey = ''
    items.value = []
    hasLoaded.value = false
    isLoading.value = false
    loadError.value = ''

    const defaultSpaceQuery = resolveAssetListQuery()
    spaceCollection.value = createEmptyAssetListResponse(defaultSpaceQuery)
    spaceQuery.value = defaultSpaceQuery
    spaceHasLoaded.value = false
    spaceIsLoading.value = false
    spaceLoadError.value = ''

    detailController.reset()
  }

  watch(
    () => authStore.token,
    (token, previousToken) => {
      if (token !== previousToken) {
        resetAssets()
      }
    },
    { flush: 'sync' },
  )

  return {
    items,
    hasLoaded,
    isLoading,
    loadError,
    loadAssets,
    refreshAssets,
    spaceCollection,
    spaceQuery,
    spaceHasLoaded,
    spaceIsLoading,
    spaceLoadError,
    loadSpaceAssets,
    refreshSpaceAssets,
    selectedAsset: detailController.selectedAsset,
    selectedAssetId: detailController.selectedAssetId,
    detailHasLoaded: detailController.detailHasLoaded,
    detailIsLoading: detailController.detailIsLoading,
    detailLoadError: detailController.detailLoadError,
    loadAssetDetail: detailController.loadAssetDetail,
    refreshAssetDetail: detailController.refreshAssetDetail,
    clearAssetDetail: detailController.clearAssetDetail,
    deletingAssetId: detailController.deletingAssetId,
    deleteError: detailController.deleteError,
    deleteAssetById: detailController.deleteAssetById,
    resetAssets,
  }
})

import { isAxiosError } from 'axios'
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { fetchAssets } from '../api/assets'
import { useAuthStore } from './auth'
import type { Asset } from '../types/asset'

interface AssetErrorResponse {
  detail?: unknown
}

interface LoadRequest {
  generation: number
  promise: Promise<Asset[]>
}

function getAssetErrorMessage(error: unknown) {
  if (isAxiosError<AssetErrorResponse>(error)) {
    const detail = error.response?.data?.detail
    if (typeof detail === 'string' && detail.trim()) {
      return detail
    }

    if (error.code === 'ECONNABORTED') {
      return '请求超时，请稍后重试。'
    }
  }

  return '资产列表加载失败，请稍后重试。'
}

export const useAssetStore = defineStore('assets', () => {
  const authStore = useAuthStore()
  const items = ref<Asset[]>([])
  const hasLoaded = ref(false)
  const isLoading = ref(false)
  const loadError = ref('')

  let generation = 0
  let loadRequest: LoadRequest | null = null

  async function loadAssets(force = true): Promise<Asset[]> {
    const requestedGeneration = generation

    if (loadRequest?.generation === requestedGeneration) {
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

        if (requestedGeneration === generation) {
          items.value = response.data.items
          hasLoaded.value = true
        }

        return items.value
      } catch (error) {
        if (requestedGeneration !== generation) {
          return items.value
        }

        loadError.value = getAssetErrorMessage(error)
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

  function refreshAssets() {
    return loadAssets(true)
  }

  function resetAssets() {
    generation += 1
    loadRequest = null
    items.value = []
    hasLoaded.value = false
    isLoading.value = false
    loadError.value = ''
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
    resetAssets,
  }
})

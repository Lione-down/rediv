import { ref, watch } from 'vue'
import { request } from '../../../api/request'
import { loadGenerationCapabilities } from '../../../modules/canvas/generation-service'
import type { GenerationCapabilities } from '../../../modules/canvas/generation-parameters'
import { useAuthStore } from '../../../store/auth'

export function useGenerationCapabilities() {
  const authStore = useAuthStore()
  const generationCapabilities = ref<GenerationCapabilities | null>(null)
  const generationCapabilitiesError = ref('')
  const isGenerationCapabilitiesLoading = ref(false)
  let loadGeneration = 0

  async function reloadGenerationCapabilities() {
    const token = authStore.token
    const generation = ++loadGeneration
    generationCapabilities.value = null
    generationCapabilitiesError.value = ''
    if (!token) {
      isGenerationCapabilitiesLoading.value = false
      return
    }
    isGenerationCapabilitiesLoading.value = true
    try {
      const capabilities = await loadGenerationCapabilities(request)
      if (generation !== loadGeneration || token !== authStore.token) return
      generationCapabilities.value = capabilities
    } catch {
      if (generation !== loadGeneration || token !== authStore.token) return
      generationCapabilitiesError.value = '模型服务暂不可用，请重试。'
    } finally {
      if (generation === loadGeneration && token === authStore.token) {
        isGenerationCapabilitiesLoading.value = false
      }
    }
  }

  watch(
    () => authStore.token,
    () => { void reloadGenerationCapabilities() },
    { immediate: true },
  )

  return {
    generationCapabilities,
    generationCapabilitiesError,
    isGenerationCapabilitiesLoading,
    reloadGenerationCapabilities,
  }
}

import { ref, watch } from 'vue'
import { request } from '../../../api/request'
import { loadGenerationCapabilities } from '../../../modules/canvas/generation-service'
import type { GenerationCapabilities } from '../../../modules/canvas/generation-parameters'
import { useAuthStore } from '../../../store/auth'

export function useGenerationCapabilities() {
  const authStore = useAuthStore()
  const generationCapabilities = ref<GenerationCapabilities | null>(null)
  const generationCapabilitiesError = ref('')
  let loadGeneration = 0

  watch(
    () => authStore.token,
    async (token) => {
      const generation = ++loadGeneration
      generationCapabilities.value = null
      generationCapabilitiesError.value = ''
      if (!token) return
      try {
        const capabilities = await loadGenerationCapabilities(request)
        if (generation !== loadGeneration || token !== authStore.token) return
        generationCapabilities.value = capabilities
      } catch {
        if (generation !== loadGeneration || token !== authStore.token) return
        generationCapabilitiesError.value = '生成参数 capability 加载失败，当前生成请求已阻止。'
      }
    },
    { immediate: true },
  )

  return { generationCapabilities, generationCapabilitiesError }
}

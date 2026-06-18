import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchAssets } from '../api/assets'
import type { Asset } from '../types/asset'

export const useAssetStore = defineStore('assets', () => {
  const items = ref<Asset[]>([
    {
      id: 'local-prompt-1',
      type: 'prompt',
      url: null,
      content_text: '雨夜旧车站，暖色灯光，电影感镜头。',
      source: 'generation',
      status: 'active',
    },
    {
      id: 'local-image-1',
      type: 'image',
      url: null,
      content_text: '角色参考图',
      source: 'upload',
      status: 'active',
    },
  ])
  const isLoading = ref(false)

  async function loadAssets() {
    isLoading.value = true

    try {
      const response = await fetchAssets()
      items.value = response.data.items
    } finally {
      isLoading.value = false
    }
  }

  return { items, isLoading, loadAssets }
})

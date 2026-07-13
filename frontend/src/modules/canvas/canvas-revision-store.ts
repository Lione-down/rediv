import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useCanvasStore } from '../../store/canvas'
import { fetchCanvasRevisions, restoreCanvasRevision } from './api'
import { getCanvasErrorMessage } from './persistence'
import type { CanvasRevisionSummary } from './types'

export const useCanvasRevisionStore = defineStore('canvas-revisions', () => {
  const items = ref<CanvasRevisionSummary[]>([])
  const currentRevision = ref(0)
  const isLoading = ref(false)
  const restoringRevision = ref<number | null>(null)
  const error = ref('')
  const notice = ref('')
  let generation = 0
  let activeProjectId = ''
  let activeCanvasId = ''

  function reset(projectId = '', canvasId = '') {
    generation += 1
    activeProjectId = projectId
    activeCanvasId = canvasId
    items.value = []
    currentRevision.value = 0
    isLoading.value = false
    restoringRevision.value = null
    error.value = ''
    notice.value = ''
  }

  async function load(projectId: string, canvasId: string) {
    if (projectId !== activeProjectId || canvasId !== activeCanvasId) reset(projectId, canvasId)
    const requestGeneration = generation
    isLoading.value = true
    error.value = ''
    try {
      const response = await fetchCanvasRevisions(projectId, canvasId)
      if (requestGeneration !== generation) return
      items.value = response.data.items
      currentRevision.value = response.data.current_revision
    } catch (cause) {
      if (requestGeneration !== generation) return
      error.value = getCanvasErrorMessage(cause, '修订历史加载失败，请重试。')
      throw cause
    } finally {
      if (requestGeneration === generation) isLoading.value = false
    }
  }

  async function restore(projectId: string, canvasId: string, revision: number) {
    if (restoringRevision.value !== null) return
    const canvasStore = useCanvasStore()
    restoringRevision.value = revision
    error.value = ''
    notice.value = ''
    let committedRevision: number | null = null
    try {
      await canvasStore.flushPendingPersistence()
      const response = await restoreCanvasRevision(projectId, canvasId, revision)
      committedRevision = response.data.revision
      await canvasStore.reloadActiveDocument(true)
      await load(projectId, canvasId)
      notice.value = `已从 r${revision} 创建新 head r${response.data.revision}`
    } catch (cause) {
      error.value = committedRevision === null
        ? getCanvasErrorMessage(cause, `恢复 r${revision} 失败，画布未变更。`)
        : `服务器已创建新 head r${committedRevision}，但本地重新加载失败，请重试加载画布。`
      throw cause
    } finally {
      restoringRevision.value = null
    }
  }

  return {
    items, currentRevision, isLoading, restoringRevision, error, notice,
    load, reset, restore,
  }
})

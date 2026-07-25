import { computed, ref, watch } from 'vue'
import { request } from '../../../api/request'
import { loadCinematicSkillSources } from '../../../modules/canvas/cinematic-skills'
import {
  fetchGenerationJobCinematicLineage,
  type GenerationJobCinematicLineage,
} from '../../../modules/canvas/generation-job-api'

interface CanvasCinematicLineageOptions {
  getCanvasId: () => string
  getGenerationNodeId: () => string | null | undefined
  getProjectId: () => string
  getResultTaskId: () => string | null | undefined
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

export function useCanvasCinematicLineage(options: CanvasCinematicLineageOptions) {
  const currentRevisions = ref<Map<string, string> | null>(null)
  const boundLineage = ref<GenerationJobCinematicLineage | null>(null)
  let boundTaskRequestGeneration = 0
  const taskSnapshot = computed(() => record(boundLineage.value?.cinematic_skill))
  const isResultStale = computed(() => {
    const canonical = record(taskSnapshot.value?.canonical_request)
    const references = canonical?.references
    if (!currentRevisions.value || !Array.isArray(references)) return false
    return references.some((rawReference) => {
      const reference = record(rawReference)
      return typeof reference?.node_id !== 'string'
        || typeof reference.source_revision !== 'string'
        || currentRevisions.value?.get(reference.node_id) !== reference.source_revision
    })
  })

  async function refresh() {
    currentRevisions.value = null
    const projectId = options.getProjectId()
    const canvasId = options.getCanvasId()
    if (!taskSnapshot.value || !projectId || !canvasId) return
    try {
      const sources = await loadCinematicSkillSources(projectId, canvasId, request)
      currentRevisions.value = new Map(sources.items.map((item) => [item.node_id, item.source_revision]))
    } catch {
      currentRevisions.value = new Map()
    }
  }

  async function refreshBoundTask() {
    const requestGeneration = ++boundTaskRequestGeneration
    const taskId = options.getResultTaskId()?.trim()
    const projectId = options.getProjectId().trim()
    const canvasId = options.getCanvasId().trim()
    const nodeId = options.getGenerationNodeId()?.trim()
    boundLineage.value = null
    if (taskId && projectId && canvasId && nodeId) {
      try {
        const lineage = await fetchGenerationJobCinematicLineage({
          projectId,
          canvasId,
          nodeId,
          jobId: taskId,
        }, request)
        if (requestGeneration !== boundTaskRequestGeneration || options.getResultTaskId() !== taskId) return
        boundLineage.value = lineage
      } catch {
        if (requestGeneration !== boundTaskRequestGeneration) return
        boundLineage.value = null
      }
    }
    if (requestGeneration === boundTaskRequestGeneration) await refresh()
  }

  watch(
    () => [
      options.getResultTaskId(),
      options.getProjectId(),
      options.getCanvasId(),
      options.getGenerationNodeId(),
    ],
    () => { void refreshBoundTask() },
    { immediate: true },
  )

  return { cinematicResultStale: isResultStale, cinematicTaskSnapshot: taskSnapshot }
}

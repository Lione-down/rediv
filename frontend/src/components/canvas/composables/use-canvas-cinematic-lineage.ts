import { computed, ref, watch } from 'vue'
import { request } from '../../../api/request'
import { loadCinematicSkillSources } from '../../../modules/canvas/cinematic-skills'
import type { ProjectGenerationTask } from '../../../modules/canvas/project-resource-types'

interface CanvasCinematicLineageOptions {
  getCanvasId: () => string
  getGenerationTasks: () => ProjectGenerationTask[]
  getLatestTask: () => ProjectGenerationTask | null
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
  const taskSnapshot = computed(() => {
    const task = options.getGenerationTasks().find((candidate) => candidate.id === options.getResultTaskId())
      ?? options.getLatestTask()
    return record(record(task?.request_parameters)?.cinematic_skill)
  })
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

  watch(
    () => [options.getResultTaskId(), options.getProjectId(), options.getCanvasId(), options.getGenerationTasks().length],
    () => { void refresh() },
    { immediate: true },
  )

  return { cinematicResultStale: isResultStale, cinematicTaskSnapshot: taskSnapshot }
}

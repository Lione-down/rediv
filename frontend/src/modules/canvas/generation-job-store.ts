import type {
  GenerationJobDeltaPage,
  GenerationJobResult,
  GenerationJobStatus,
} from './generation-job-api'

export interface GenerationJobScope {
  projectId: string
  canvasId: string
}

export interface GenerationJobScopeSnapshot {
  cursor: string | null
  results: Map<string, GenerationJobResult>
  statuses: Map<string, GenerationJobStatus>
}

function scopeKey(scope: GenerationJobScope) {
  const projectId = scope.projectId.trim()
  const canvasId = scope.canvasId.trim()
  if (!projectId || !canvasId) throw new TypeError('Generation job scope is required.')
  return `${projectId}\u0000${canvasId}`
}

export function createGenerationJobStore() {
  const snapshots = new Map<string, GenerationJobScopeSnapshot>()

  function mutableSnapshot(scope: GenerationJobScope) {
    const key = scopeKey(scope)
    let current = snapshots.get(key)
    if (!current) {
      current = { cursor: null, results: new Map(), statuses: new Map() }
      snapshots.set(key, current)
    }
    return current
  }

  function applyDelta(scope: GenerationJobScope, page: GenerationJobDeltaPage) {
    const current = mutableSnapshot(scope)
    applyStatusesToSnapshot(current, page.items)
    current.cursor = page.next_cursor
  }

  function applyStatuses(scope: GenerationJobScope, statuses: readonly GenerationJobStatus[]) {
    applyStatusesToSnapshot(mutableSnapshot(scope), statuses)
  }

  function applyStatusesToSnapshot(
    current: GenerationJobScopeSnapshot,
    statuses: readonly GenerationJobStatus[],
  ) {
    for (const status of statuses) {
      const previous = current.statuses.get(status.job_id)
      if (!previous || status.version > previous.version) {
        current.statuses.set(status.job_id, status)
      }
    }
  }

  function applyResult(scope: GenerationJobScope, result: GenerationJobResult) {
    const current = mutableSnapshot(scope)
    const previous = current.results.get(result.job_id)
    if (!previous || result.version > previous.version) current.results.set(result.job_id, result)
  }

  function snapshot(scope: GenerationJobScope): GenerationJobScopeSnapshot {
    const current = snapshots.get(scopeKey(scope))
    return current
      ? {
          cursor: current.cursor,
          results: new Map(current.results),
          statuses: new Map(current.statuses),
        }
      : { cursor: null, results: new Map(), statuses: new Map() }
  }

  return { applyDelta, applyResult, applyStatuses, snapshot }
}

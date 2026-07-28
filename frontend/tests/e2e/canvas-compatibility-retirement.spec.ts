import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PROFESSIONAL_CANVAS_ACTIONS } from '../../src/modules/canvas/professional-action-registry'

function source(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

test('production registry retires the browser-local mock workflow batch action', () => {
  expect(PROFESSIONAL_CANVAS_ACTIONS.map((action) => action.id)).not.toContain(
    'workflow.canvas-generation-batch',
  )
  expect(source('src/views/app/CanvasWorkspace.vue')).not.toContain('CanvasWorkflowBatchOverlay')
  expect(source('src/components/canvas/composables/use-canvas-professional-actions.ts'))
    .not.toContain('open-workflow-batch')
})

test('ordinary media generation submits compact jobs without legacy full-task reconciliation', () => {
  const generationActions = source(
    'src/components/canvas/composables/use-canvas-generation-actions.ts',
  )
  const resourceExperience = source(
    'src/components/canvas/composables/use-canvas-resource-experience.ts',
  )

  expect(generationActions).toContain('submitGenerationJob')
  expect(generationActions).not.toContain('requestCanvasGeneration')
  expect(generationActions).not.toContain('queueResourceReconciliation')
  expect(resourceExperience).not.toContain('createGeneratedResultCommand')
  expect(resourceExperience).not.toContain('hasResultForTask')
})

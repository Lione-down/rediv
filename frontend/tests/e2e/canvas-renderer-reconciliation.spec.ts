import { expect, test } from '@playwright/test'
import { planKeyedReconciliation } from '../../src/components/canvas/canvas-renderer-reconciliation'

test('keyed reconciliation retains existing visuals and isolates create/remove work', () => {
  const retained = { id: 'node-retained', title: '保留节点' }
  const created = { id: 'node-created', title: '新增节点' }

  expect(planKeyedReconciliation(['node-retained', 'node-removed'], [retained, created])).toEqual({
    create: [created],
    update: [retained],
    remove: ['node-removed'],
  })
})

test('keyed reconciliation handles empty boundaries and rejects duplicate renderer keys', () => {
  expect(planKeyedReconciliation([], [])).toEqual({ create: [], update: [], remove: [] })
  expect(planKeyedReconciliation(['node-a'], [])).toEqual({ create: [], update: [], remove: ['node-a'] })
  expect(() => planKeyedReconciliation([], [{ id: 'node-a' }, { id: 'node-a' }])).toThrow(
    'Duplicate renderer key: node-a',
  )
})

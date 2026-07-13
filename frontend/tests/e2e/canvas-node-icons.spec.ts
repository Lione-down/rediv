import { expect, test } from '@playwright/test'
import { hasCanvasNodeIcon } from '../../src/components/canvas/canvas-node-icons'
import { getCreatableNodeDefinitions } from '../../src/modules/canvas/node-registry'

test('every canonical registry icon key resolves through the shared Canvas icon catalog', () => {
  for (const definition of getCreatableNodeDefinitions()) {
    expect(hasCanvasNodeIcon(definition.icon), definition.type).toBe(true)
  }
})

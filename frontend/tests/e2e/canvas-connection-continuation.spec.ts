import { expect, test } from '@playwright/test'
import {
  createConnectionContinuationCommand,
  resolveConnectionContinuationOptions,
} from '../../src/modules/canvas/connection-continuation'
import type { CanvasNode } from '../../src/types/canvas'

function node(id: string, type: CanvasNode['type'], subtype: string): CanvasNode {
  return {
    id, type, title: id, x: 0, y: 0, width: 320, height: 200,
    contentData: { subtype, serialization_version: 1 },
  }
}

test('text output offers only image and video generation continuations', () => {
  const options = resolveConnectionContinuationOptions(node('script', 'script', 'script'), 'out')

  expect(options.map(({ type, subtype, targetPort }) => ({ type, subtype, targetPort }))).toEqual([
    { type: 'generation', subtype: 'image', targetPort: 'prompt' },
    { type: 'generation', subtype: 'video', targetPort: 'prompt' },
  ])
})

test('media and result outputs expose registry-compatible typed continuations', () => {
  const media = resolveConnectionContinuationOptions(node('asset', 'asset', 'image'), 'out')
  const result = resolveConnectionContinuationOptions(node('result', 'result', 'image'), 'out')

  expect(media.map((option) => option.key)).toEqual([
    'generation:image:media', 'generation:video:media',
  ])
  expect(result.map((option) => option.key)).toEqual([
    'generation:image:media', 'generation:video:media',
    'result:image:in', 'result:video:in', 'result:text:in',
  ])
})

test('non-connectable and unknown source ports expose no continuation', () => {
  expect(resolveConnectionContinuationOptions(node('note', 'note', 'annotation'), 'out')).toEqual([])
  expect(resolveConnectionContinuationOptions(node('script', 'script', 'script'), 'missing')).toEqual([])
})

test('continuation builds one deterministic node-plus-edge graph command', () => {
  const source = node('script', 'script', 'script')
  const option = resolveConnectionContinuationOptions(source, 'out')[0]
  const ids = ['node-created', 'edge-created']
  const command = createConnectionContinuationCommand(source, option, { x: 600, y: 320 }, () => ids.shift()!)

  expect(command).toEqual({
    type: 'insert-graph',
    nodes: [expect.objectContaining({
      id: 'node-created', type: 'generation', x: 648, y: 210,
      contentData: { subtype: 'image', serialization_version: 1 },
    })],
    connections: [{
      id: 'edge-created', from: 'script', to: 'node-created', sourcePort: 'out',
      targetPort: 'prompt', status: 'active', active: true,
    }],
  })
})

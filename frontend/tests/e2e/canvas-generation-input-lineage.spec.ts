import { expect, test } from '@playwright/test'
import { resolveGenerationInputLineageBridges } from '../../src/modules/canvas/generation-input-lineage'
import type { CanvasConnection, CanvasNode } from '../../src/types/canvas'

function node(
  id: string,
  type: CanvasNode['type'],
  subtype: string,
  contentData: Record<string, unknown> = {},
): CanvasNode {
  return {
    id, type, title: id, x: 0, y: 0, width: 320, height: 200,
    contentData: { subtype, serialization_version: 1, ...contentData },
  }
}

function edge(
  id: string,
  from: string,
  to: string,
  targetPort: 'in' | 'media' = 'in',
  metadata: Record<string, unknown> = {},
): CanvasConnection {
  return { id, from, to, sourcePort: 'out', targetPort, active: true, status: 'active', metadata }
}

function chainedGraph() {
  const generationOne = node('generation-one', 'generation', 'image')
  const variantOne = node('variant-one', 'result', 'image', {
    asset_id: 'asset-v1', source_task_id: 'task-v1', source_model: 'agnes-image',
  })
  const variantTwo = node('variant-two', 'result', 'image', {
    asset_id: 'asset-v2', source_task_id: 'task-v2', source_model: 'agnes-image',
  })
  const upload = node('upload', 'asset', 'image', { asset_id: 'asset-upload' })
  const generationTwo = node('generation-two', 'generation', 'video')
  const nodes = [generationOne, variantOne, variantTwo, upload, generationTwo]
  const connections = [
    edge('variant-edge-1', generationOne.id, variantOne.id, 'in', { source_task_id: 'task-v1' }),
    edge('variant-edge-2', generationOne.id, variantTwo.id, 'in', { source_task_id: 'task-v2' }),
    edge('downstream-result', variantTwo.id, generationTwo.id, 'media', { input_order: 1 }),
    edge('downstream-upload', upload.id, generationTwo.id, 'media', { input_order: 2 }),
  ]
  return { connections, generationTwo, nodes, upload, variantTwo }
}

test('chained generation input bridges exact downstream R and upstream G V identity', () => {
  const graph = chainedGraph()
  expect(resolveGenerationInputLineageBridges(
    graph.generationTwo, graph.nodes, graph.connections,
  )).toEqual([{
    connectionId: 'downstream-result',
    generationNodeId: 'generation-one',
    generationTitle: 'generation-one',
    nodeId: 'variant-two',
    requestOrder: 1,
    variantCount: 2,
    variantOrder: 2,
  }])
})

test('two distinct upstream generations retain independent downstream R and upstream V identity', () => {
  const graph = chainedGraph()
  const generationThree = node('generation-three', 'generation', 'image')
  const otherResult = node('other-result', 'result', 'image', {
    asset_id: 'asset-other', source_task_id: 'task-other', source_model: 'agnes-image',
  })
  const nodes = [...graph.nodes, generationThree, otherResult]
  const connections = [
    ...graph.connections.filter((connection) => connection.id !== 'downstream-upload'),
    edge('other-result-edge', generationThree.id, otherResult.id, 'in', { source_task_id: 'task-other' }),
    edge('downstream-other', otherResult.id, graph.generationTwo.id, 'media', { input_order: 2 }),
  ]

  expect(resolveGenerationInputLineageBridges(graph.generationTwo, nodes, connections)).toEqual([
    expect.objectContaining({
      connectionId: 'downstream-result', generationNodeId: 'generation-one', requestOrder: 1, variantOrder: 2,
    }),
    expect.objectContaining({
      connectionId: 'downstream-other', generationNodeId: 'generation-three', requestOrder: 2, variantOrder: 1,
    }),
  ])
})

test('bridge resolver rejects invalid upstream lineage and excluded downstream inputs', () => {
  const graph = chainedGraph()
  const upstream = graph.connections.find((connection) => connection.id === 'variant-edge-2')!
  expect(resolveGenerationInputLineageBridges(graph.generationTwo, graph.nodes, [
    ...graph.connections.filter((connection) => connection.id !== upstream.id),
    { ...upstream, active: false, status: 'inactive' },
  ])).toEqual([])
  expect(resolveGenerationInputLineageBridges(graph.generationTwo, graph.nodes, [
    ...graph.connections.filter((connection) => connection.id !== upstream.id),
    { ...upstream, metadata: { source_task_id: 'task-other' } },
  ])).toEqual([])
  expect(resolveGenerationInputLineageBridges(graph.generationTwo, graph.nodes, [
    ...graph.connections,
    edge('ambiguous-origin', 'generation-one', graph.variantTwo.id, 'in'),
  ])).toEqual([])

  graph.upload.contentData = { ...graph.upload.contentData, asset_id: 'asset-v2' }
  const duplicateConnections = graph.connections.map((connection) => {
    if (connection.id === 'downstream-upload') return { ...connection, metadata: { input_order: 1 } }
    if (connection.id === 'downstream-result') return { ...connection, metadata: { input_order: 2 } }
    return connection
  })
  expect(resolveGenerationInputLineageBridges(graph.generationTwo, graph.nodes, duplicateConnections)).toEqual([])
  expect(resolveGenerationInputLineageBridges(graph.upload, graph.nodes, graph.connections)).toEqual([])
})

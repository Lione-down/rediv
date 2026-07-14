import type { CanvasConnection, CanvasNode } from '../../types/canvas'
import { getDefaultConnectionPorts } from './node-registry'

export const GENERATION_PROMPT_LIMIT = 4_000
export const GENERATION_IMAGE_LIMIT = 8

export interface ConnectedTextContext {
  nodeId: string
  title: string
  content: string
  isIncluded: boolean
}

export type ConnectedMediaState = 'included' | 'missing-asset' | 'unsupported-media' | 'duplicate' | 'limit'

export interface ConnectedMediaContext {
  nodeId: string
  title: string
  assetId: string | null
  state: ConnectedMediaState
}

export interface ResolvedGenerationContext {
  prompt: string
  localPrompt: string
  textSources: ConnectedTextContext[]
  mediaSources: ConnectedMediaContext[]
  imageIds: string[]
}

function activeIncomingConnections(nodeId: string, connections: readonly CanvasConnection[]) {
  return connections.filter((connection) => (
    connection.to === nodeId &&
    connection.active !== false &&
    (!connection.status || connection.status === 'active')
  ))
}

function boundedPrompt(localPrompt: string, sources: readonly ConnectedTextContext[]) {
  const segments = [
    localPrompt,
    ...sources.filter((source) => source.content).map((source) => `【${source.title}】\n${source.content}`),
  ].filter(Boolean)
  return segments.join('\n\n').slice(0, GENERATION_PROMPT_LIMIT)
}

function imageSubtype(node: CanvasNode) {
  const subtype = node.contentData?.subtype
  return subtype === 'image' || (node.type === 'image' && subtype === undefined)
}

export function resolveGenerationContext(
  generationNode: CanvasNode,
  nodes: readonly CanvasNode[],
  connections: readonly CanvasConnection[],
): ResolvedGenerationContext {
  const nodesById = new Map(nodes.map((node) => [node.id, node]))
  const localPrompt = generationNode.content?.trim() ?? ''
  const textSources: ConnectedTextContext[] = []
  const mediaSources: ConnectedMediaContext[] = []
  const imageIds: string[] = []
  const seenTextNodes = new Set<string>()
  const seenImageIds = new Set<string>()

  for (const connection of activeIncomingConnections(generationNode.id, connections)) {
    const source = nodesById.get(connection.from)
    if (!source) continue
    const ports = getDefaultConnectionPorts(
      source,
      generationNode,
      connection.sourcePort,
      connection.targetPort,
    )
    if (!ports) continue

    if (ports.targetPort === 'prompt' && !seenTextNodes.has(source.id)) {
      seenTextNodes.add(source.id)
      const content = source.content?.trim() ?? ''
      textSources.push({ nodeId: source.id, title: source.title, content, isIncluded: Boolean(content) })
      continue
    }
    if (ports.targetPort !== 'media') continue

    const rawAssetId = source.contentData?.asset_id
    const assetId = typeof rawAssetId === 'string' && rawAssetId.trim() ? rawAssetId.trim() : null
    let state: ConnectedMediaState = 'included'
    if (!imageSubtype(source)) state = 'unsupported-media'
    else if (!assetId) state = 'missing-asset'
    else if (seenImageIds.has(assetId)) state = 'duplicate'
    else if (imageIds.length >= GENERATION_IMAGE_LIMIT) state = 'limit'
    else {
      seenImageIds.add(assetId)
      imageIds.push(assetId)
    }
    mediaSources.push({ nodeId: source.id, title: source.title, assetId, state })
  }

  return {
    prompt: boundedPrompt(localPrompt, textSources),
    localPrompt,
    textSources,
    mediaSources,
    imageIds,
  }
}

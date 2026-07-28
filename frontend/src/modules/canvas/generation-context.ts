import type { CanvasConnection, CanvasNode } from '../../types/canvas'
import { getDefaultConnectionPorts } from './node-registry'
import { orderedGenerationInputConnections } from './generation-input-order'

export const GENERATION_PROMPT_LIMIT = 4_000
export const GENERATION_IMAGE_LIMIT = 9

export interface ConnectedTextContext {
  connectionId: string
  nodeId: string
  title: string
  content: string
  isIncluded: boolean
  order: number
}

export type ConnectedMediaState =
  | 'included' | 'missing-asset' | 'unsupported-media' | 'duplicate' | 'limit'
  | 'reference-mode-excluded'

export interface ConnectedMediaContext {
  connectionId: string
  nodeId: string
  title: string
  assetId: string | null
  thumbnailUrl?: string
  order: number
  requestOrder: number | null
  state: ConnectedMediaState
}

export interface GenerationInputProvenance {
  connectionId: string
  isIncluded: boolean
  kind: 'text' | 'media'
  nodeId: string
  order: number
}

export interface ResolvedGenerationContext {
  prompt: string
  localPrompt: string
  textSources: ConnectedTextContext[]
  mediaSources: ConnectedMediaContext[]
  imageIds: string[]
  provenance: GenerationInputProvenance[]
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

  for (const { connection } of orderedGenerationInputConnections(generationNode, nodes, connections)) {
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
      textSources.push({
        connectionId: connection.id,
        nodeId: source.id,
        title: source.title,
        content,
        isIncluded: Boolean(content),
        order: textSources.length + 1,
      })
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
    mediaSources.push({
      connectionId: connection.id,
      nodeId: source.id,
      title: source.title,
      assetId,
      ...([
        source.contentData?.thumbnail_url,
        source.contentData?.preview_url,
        source.contentData?.url,
      ].find((value): value is string => typeof value === 'string' && Boolean(value.trim()))
        ? {
            thumbnailUrl: [
              source.contentData?.thumbnail_url,
              source.contentData?.preview_url,
              source.contentData?.url,
            ].find((value): value is string => typeof value === 'string' && Boolean(value.trim()))!.trim(),
          }
        : {}),
      order: mediaSources.length + 1,
      requestOrder: state === 'included' ? imageIds.length : null,
      state,
    })
  }

  const provenance: GenerationInputProvenance[] = [
    ...textSources.map((source) => ({
      connectionId: source.connectionId,
      isIncluded: source.isIncluded,
      kind: 'text' as const,
      nodeId: source.nodeId,
      order: source.order,
    })),
    ...mediaSources.map((source) => ({
      connectionId: source.connectionId,
      isIncluded: source.state === 'included',
      kind: 'media' as const,
      nodeId: source.nodeId,
      order: source.requestOrder ?? source.order,
    })),
  ]

  return {
    prompt: boundedPrompt(localPrompt, textSources),
    localPrompt,
    textSources,
    mediaSources,
    imageIds,
    provenance,
  }
}

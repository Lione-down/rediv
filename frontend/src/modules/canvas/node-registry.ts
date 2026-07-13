import type { CanvasNode } from '../../types/canvas'

export const CANONICAL_NODE_TYPES = [
  'script',
  'note',
  'asset',
  'generation',
  'result',
  'group',
] as const

export type CanonicalNodeType = typeof CANONICAL_NODE_TYPES[number]
export type NodeDefinitionKind = 'canonical' | 'compatibility'
export type NodePortDirection = 'input' | 'output'
export type NodePortDataType = 'any' | 'text' | 'media' | 'result'

export interface NodeSubtypeDefinition {
  id: string
  label: string
}

export interface NodePortDefinition {
  id: string
  direction: NodePortDirection
  dataType: NodePortDataType
  accepts?: readonly NodePortDataType[]
}

export interface NodeCapabilities {
  canEditContent: boolean
  canGenerate: boolean
  canPreviewMedia: boolean
  canReferenceAsset: boolean
  canContainChildren: boolean
}

export interface NodeDefinition {
  type: string
  kind: NodeDefinitionKind
  label: string
  icon: string
  subtypes: readonly NodeSubtypeDefinition[]
  defaultSubtype: string
  ports: readonly NodePortDefinition[]
  defaultSize: { width: number; height: number }
  capabilities: NodeCapabilities
  serializationVersion: number
}

export interface UnsupportedNodeDefinition {
  type: string
  kind: 'unsupported'
  reason: 'unknown-type' | 'serialization-version' | 'subtype'
  label: string
  icon: 'circle-help'
  subtypes: readonly []
  defaultSubtype: ''
  ports: readonly []
  defaultSize: { width: 280; height: 160 }
  capabilities: NodeCapabilities
  serializationVersion: 0
}

export type ResolvedNodeDefinition = NodeDefinition | UnsupportedNodeDefinition

const disabledCapabilities: NodeCapabilities = {
  canEditContent: false,
  canGenerate: false,
  canPreviewMedia: false,
  canReferenceAsset: false,
  canContainChildren: false,
}

function capabilities(overrides: Partial<NodeCapabilities> = {}): NodeCapabilities {
  return { ...disabledCapabilities, ...overrides }
}

const canonicalDefinitions: readonly NodeDefinition[] = [
  {
    type: 'script', kind: 'canonical', label: '脚本', icon: 'file-text',
    subtypes: [{ id: 'script', label: '脚本' }, { id: 'prompt', label: '提示词' }],
    defaultSubtype: 'script',
    ports: [{ id: 'out', direction: 'output', dataType: 'text' }],
    defaultSize: { width: 320, height: 200 },
    capabilities: capabilities({ canEditContent: true }), serializationVersion: 1,
  },
  {
    type: 'note', kind: 'canonical', label: '笔记', icon: 'sticky-note',
    subtypes: [{ id: 'annotation', label: '笔记' }], defaultSubtype: 'annotation', ports: [],
    defaultSize: { width: 260, height: 180 },
    capabilities: capabilities({ canEditContent: true }), serializationVersion: 1,
  },
  {
    type: 'asset', kind: 'canonical', label: '素材', icon: 'image',
    subtypes: [
      { id: 'image', label: '图片素材' },
      { id: 'video', label: '视频素材' },
      { id: 'audio', label: '音频素材' },
    ],
    defaultSubtype: 'image',
    ports: [{ id: 'out', direction: 'output', dataType: 'media' }],
    defaultSize: { width: 320, height: 240 },
    capabilities: capabilities({ canPreviewMedia: true, canReferenceAsset: true }),
    serializationVersion: 1,
  },
  {
    type: 'generation', kind: 'canonical', label: '生成任务', icon: 'sparkles',
    subtypes: [{ id: 'image', label: '图片生成' }, { id: 'video', label: '视频生成' }],
    defaultSubtype: 'image',
    ports: [
      { id: 'prompt', direction: 'input', dataType: 'text', accepts: ['text'] },
      { id: 'media', direction: 'input', dataType: 'media', accepts: ['media', 'result'] },
      { id: 'out', direction: 'output', dataType: 'result' },
    ],
    defaultSize: { width: 340, height: 220 },
    capabilities: capabilities({ canEditContent: true, canGenerate: true }),
    serializationVersion: 1,
  },
  {
    type: 'result', kind: 'canonical', label: '生成结果', icon: 'play-square',
    subtypes: [
      { id: 'image', label: '图片结果' },
      { id: 'video', label: '视频结果' },
      { id: 'text', label: '文本结果' },
    ],
    defaultSubtype: 'image',
    ports: [
      { id: 'in', direction: 'input', dataType: 'result', accepts: ['result'] },
      { id: 'out', direction: 'output', dataType: 'result' },
    ],
    defaultSize: { width: 360, height: 280 },
    capabilities: capabilities({ canPreviewMedia: true, canReferenceAsset: true }),
    serializationVersion: 1,
  },
  {
    type: 'group', kind: 'canonical', label: '组合', icon: 'group',
    subtypes: [{ id: 'group', label: '组合' }], defaultSubtype: 'group', ports: [],
    defaultSize: { width: 480, height: 320 },
    capabilities: capabilities({ canContainChildren: true }), serializationVersion: 1,
  },
]

function legacyPorts(outputDataType: NodePortDataType): readonly NodePortDefinition[] {
  return [
    { id: 'in', direction: 'input', dataType: 'any', accepts: ['any', 'text', 'media', 'result'] },
    { id: 'out', direction: 'output', dataType: outputDataType },
  ]
}

const compatibilityDefinitions: readonly NodeDefinition[] = [
  { type: 'text', label: '文本节点', icon: 'file-text', outputDataType: 'text', capabilityOverrides: { canEditContent: true } },
  { type: 'image', label: '图片节点', icon: 'image', outputDataType: 'media', capabilityOverrides: { canEditContent: true, canGenerate: true, canPreviewMedia: true } },
  { type: 'video', label: '视频节点', icon: 'video', outputDataType: 'media', capabilityOverrides: { canEditContent: true, canGenerate: true, canPreviewMedia: true } },
  { type: 'model', label: '模型节点', icon: 'box', outputDataType: 'media', capabilityOverrides: { canEditContent: true, canGenerate: true } },
  { type: 'refine', label: '优化节点', icon: 'wand-sparkles', outputDataType: 'result', capabilityOverrides: { canEditContent: true } },
  { type: 'composite', label: '合成节点', icon: 'layers', outputDataType: 'result', capabilityOverrides: { canEditContent: true } },
].map(({ type, label, icon, outputDataType, capabilityOverrides }) => ({
  type,
  kind: 'compatibility' as const,
  label,
  icon,
  subtypes: [{ id: type, label }],
  defaultSubtype: type,
  ports: legacyPorts(outputDataType as NodePortDataType),
  defaultSize: { width: 240, height: 140 },
  capabilities: capabilities(capabilityOverrides),
  serializationVersion: 1,
}))

const legacyResultDefinition: NodeDefinition = {
  type: 'result',
  kind: 'compatibility',
  label: '结果节点',
  icon: 'play-square',
  subtypes: [{ id: 'result', label: '结果节点' }],
  defaultSubtype: 'result',
  ports: legacyPorts('result'),
  defaultSize: { width: 240, height: 140 },
  capabilities: capabilities({ canPreviewMedia: true, canReferenceAsset: true }),
  serializationVersion: 1,
}

const legacyGroupDefinition: NodeDefinition = {
  type: 'group',
  kind: 'compatibility',
  label: '组合',
  icon: 'group',
  subtypes: [{ id: 'group', label: '组合' }],
  defaultSubtype: 'group',
  ports: [],
  defaultSize: { width: 480, height: 320 },
  capabilities: capabilities({ canContainChildren: true }),
  serializationVersion: 1,
}

const definitions = new Map(
  [...canonicalDefinitions, ...compatibilityDefinitions].map((definition) => [definition.type, definition]),
)

function unsupported(type: string, reason: UnsupportedNodeDefinition['reason']): UnsupportedNodeDefinition {
  return {
    type,
    kind: 'unsupported',
    reason,
    label: '不支持的节点',
    icon: 'circle-help',
    subtypes: [],
    defaultSubtype: '',
    ports: [],
    defaultSize: { width: 280, height: 160 },
    capabilities: { ...disabledCapabilities },
    serializationVersion: 0,
  }
}

export function getCreatableNodeDefinitions(): readonly NodeDefinition[] {
  return canonicalDefinitions
}

export function resolveNodeDefinition(
  type: string,
  content: Record<string, unknown> = {},
): ResolvedNodeDefinition {
  if (type === 'result' && content.serialization_version === undefined) {
    return legacyResultDefinition
  }
  if (type === 'group' && content.serialization_version === undefined) {
    return legacyGroupDefinition
  }
  const definition = definitions.get(type)
  if (!definition) return unsupported(type, 'unknown-type')

  const version = content.serialization_version
  if (version !== undefined && version !== definition.serializationVersion) {
    return unsupported(type, 'serialization-version')
  }
  const subtype = content.subtype
  if (
    subtype !== undefined &&
    (typeof subtype !== 'string' || !definition.subtypes.some((candidate) => candidate.id === subtype))
  ) return unsupported(type, 'subtype')
  return definition
}

export function createRegistryNodeDraft(
  type: CanonicalNodeType,
  subtype: string,
  position: { x: number; y: number },
): Omit<CanvasNode, 'id'> {
  const definition = canonicalDefinitions.find((candidate) => candidate.type === type)
  if (!definition) throw new Error(`Unknown canonical node type: ${type}`)
  const subtypeDefinition = definition.subtypes.find((candidate) => candidate.id === subtype)
  if (!subtypeDefinition) throw new Error(`Unsupported ${type} subtype: ${subtype}`)
  return {
    type,
    title: subtypeDefinition.label,
    x: position.x,
    y: position.y,
    width: definition.defaultSize.width,
    height: definition.defaultSize.height,
    contentData: { subtype, serialization_version: definition.serializationVersion },
  }
}

export function isNodeGroupContainer(node: Pick<CanvasNode, 'type' | 'contentData'>) {
  const definition = resolveNodeDefinition(node.type, node.contentData)
  return definition.kind !== 'unsupported' && definition.capabilities.canContainChildren
}

export function isNodeMutationSupported(node: Pick<CanvasNode, 'type' | 'contentData'>) {
  return resolveNodeDefinition(node.type, node.contentData).kind !== 'unsupported'
}

export function getLegacyGenerationQuotaType(
  node: Pick<CanvasNode, 'type' | 'contentData'>,
): 'image' | 'video' | null {
  const definition = resolveNodeDefinition(node.type, node.contentData)
  if (definition.kind === 'unsupported' || !definition.capabilities.canGenerate) return null
  if (node.type === 'image' || node.type === 'model') return 'image'
  if (node.type === 'video') return 'video'
  return null
}

function portsAreCompatible(output: NodePortDefinition, input: NodePortDefinition) {
  if (output.direction !== 'output' || input.direction !== 'input') return false
  const accepted = input.accepts ?? [input.dataType]
  return output.dataType === 'any' || accepted.includes('any') || accepted.includes(output.dataType)
}

export function getDefaultConnectionPorts(
  source: Pick<CanvasNode, 'type' | 'contentData'>,
  target: Pick<CanvasNode, 'type' | 'contentData'>,
  sourcePort?: string,
  targetPort?: string,
): { sourcePort: string; targetPort: string } | null {
  if (Boolean(sourcePort) !== Boolean(targetPort)) return null
  const sourceDefinition = resolveNodeDefinition(source.type, source.contentData)
  const targetDefinition = resolveNodeDefinition(target.type, target.contentData)
  if (sourceDefinition.kind === 'unsupported' || targetDefinition.kind === 'unsupported') return null
  const outputs = sourceDefinition.ports.filter((port) => !sourcePort || port.id === sourcePort)
  const inputs = targetDefinition.ports.filter((port) => !targetPort || port.id === targetPort)
  for (const output of outputs) {
    for (const input of inputs) {
      if (portsAreCompatible(output, input)) {
        return { sourcePort: output.id, targetPort: input.id }
      }
    }
  }
  return null
}

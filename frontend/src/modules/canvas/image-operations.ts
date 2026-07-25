import type { Asset } from '../../types/asset'
import type { CanvasNode } from '../../types/canvas'
import { resolveNodeDefinition } from './node-registry'

export type ImageOperationId =
  | 'expand'
  | 'inpaint'
  | 'erase'
  | 'cutout'
  | 'upscale'
  | 'region'
  | 'fusion'

export type ProviderImageOperationId = Exclude<ImageOperationId, 'region'>
export type ImageOperationControl = 'region' | 'mask' | 'expansion' | 'upscale'

export interface ImageOperationCapabilities {
  contract_version: 1
  supported_operations: ImageOperationId[]
  provider_operations: ProviderImageOperationId[]
  region_coordinate_space: 'source-normalized'
  max_fusion_images: number
  upscale_factors: number[]
}

export interface ImageOperationDefinition {
  id: ImageOperationId
  version: 1
  title: string
  actionLabel: string
  description: string
  keywords: readonly string[]
  execution: 'local' | 'provider'
  sourceCount: readonly [number, number]
  requiresPrompt: boolean
  controls: readonly ImageOperationControl[]
}

export interface ImageOperationRegion {
  contract_version: 1
  coordinate_space: 'source-normalized'
  x: number
  y: number
  width: number
  height: number
}

export interface ImageOperationMask {
  contract_version: 1
  kind: 'region'
  feather: number
  invert: boolean
}

export interface ImageOperationExpansion {
  contract_version: 1
  top: number
  right: number
  bottom: number
  left: number
}

export interface ImageOperationContract {
  contract_version: 1
  id: ImageOperationId
  region?: ImageOperationRegion
  mask?: ImageOperationMask
  expansion?: ImageOperationExpansion
  upscale_factor?: number
}

export interface ImageOperationSourceContext {
  assets: readonly Asset[]
  capabilities: ImageOperationCapabilities | null
  projectId: string
  selectedNodes: readonly CanvasNode[]
  userId: string
}

export const IMAGE_OPERATIONS = {
  expand: {
    id: 'expand', version: 1, execution: 'provider', sourceCount: [1, 1], requiresPrompt: true,
    title: '画面扩展', actionLabel: '扩展画面', description: '向画面边界外扩展内容，原图保持不变。',
    keywords: ['扩图', '扩展', 'outpaint', 'expand'], controls: ['expansion'],
  },
  inpaint: {
    id: 'inpaint', version: 1, execution: 'provider', sourceCount: [1, 1], requiresPrompt: true,
    title: '局部重绘', actionLabel: '局部重绘', description: '按规范化区域重绘指定内容。',
    keywords: ['重绘', '局部', 'inpaint', 'mask'], controls: ['region', 'mask'],
  },
  erase: {
    id: 'erase', version: 1, execution: 'provider', sourceCount: [1, 1], requiresPrompt: false,
    title: '区域擦除', actionLabel: '擦除区域', description: '擦除规范化区域并保留原始结果。',
    keywords: ['擦除', '移除', 'erase', 'remove'], controls: ['region', 'mask'],
  },
  cutout: {
    id: 'cutout', version: 1, execution: 'provider', sourceCount: [1, 1], requiresPrompt: false,
    title: '主体抠图', actionLabel: '主体抠图', description: '创建透明背景主体分支。',
    keywords: ['抠图', '背景移除', 'cutout', 'background'], controls: [],
  },
  upscale: {
    id: 'upscale', version: 1, execution: 'provider', sourceCount: [1, 1], requiresPrompt: false,
    title: '高清放大', actionLabel: '高清放大', description: '按 capability 支持的倍率创建高清分支。',
    keywords: ['高清', '放大', 'upscale', 'resolution'], controls: ['upscale'],
  },
  region: {
    id: 'region', version: 1, execution: 'local', sourceCount: [1, 1], requiresPrompt: false,
    title: '区域标记', actionLabel: '标记区域', description: '在本地记录规范化目标区域，不调用 provider。',
    keywords: ['区域', '标记', 'region', 'selection'], controls: ['region'],
  },
  fusion: {
    id: 'fusion', version: 1, execution: 'provider', sourceCount: [2, 8], requiresPrompt: true,
    title: '多图融合', actionLabel: '多图融合', description: '按选择顺序融合 2–8 个图片结果。',
    keywords: ['融合', '多图', 'fusion', 'merge'], controls: [],
  },
} as const satisfies Record<ImageOperationId, ImageOperationDefinition>

const OPERATION_IDS = new Set<ImageOperationId>(Object.keys(IMAGE_OPERATIONS) as ImageOperationId[])
const PROVIDER_OPERATION_IDS = new Set<ProviderImageOperationId>([
  'expand', 'inpaint', 'erase', 'cutout', 'upscale', 'fusion',
])

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]) {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return actual.length === expected.length && actual.every((key, index) => key === expected[index])
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export function parseImageOperationCapabilities(value: unknown): ImageOperationCapabilities {
  if (!isRecord(value) || !hasExactKeys(value, [
    'contract_version', 'supported_operations', 'provider_operations', 'region_coordinate_space',
    'max_fusion_images', 'upscale_factors',
  ]) || value.contract_version !== 1 || value.region_coordinate_space !== 'source-normalized') {
    throw new Error('图片操作 capability contract 无效。')
  }
  const supported = value.supported_operations
  const provider = value.provider_operations
  const factors = value.upscale_factors
  if (
    !Array.isArray(supported) || supported.some((id) => typeof id !== 'string' || !OPERATION_IDS.has(id as ImageOperationId)) ||
    new Set(supported).size !== supported.length ||
    !Array.isArray(provider) || provider.some((id) => typeof id !== 'string' || !PROVIDER_OPERATION_IDS.has(id as ProviderImageOperationId)) ||
    new Set(provider).size !== provider.length || provider.some((id) => !supported.includes(id)) ||
    !Number.isInteger(value.max_fusion_images) || Number(value.max_fusion_images) < 2 || Number(value.max_fusion_images) > 8 ||
    !Array.isArray(factors) || !factors.length || factors.some((factor) => !Number.isInteger(factor) || Number(factor) < 2 || Number(factor) > 8) ||
    new Set(factors).size !== factors.length
  ) throw new Error('图片操作 capability contract 无效。')
  return {
    contract_version: 1,
    supported_operations: [...supported] as ImageOperationId[],
    provider_operations: [...provider] as ProviderImageOperationId[],
    region_coordinate_space: 'source-normalized',
    max_fusion_images: Number(value.max_fusion_images),
    upscale_factors: [...factors] as number[],
  }
}

function resolveImageResultAsset(node: CanvasNode, context: ImageOperationSourceContext) {
  const assetId = typeof node.contentData?.asset_id === 'string' ? node.contentData.asset_id.trim() : ''
  const url = typeof node.contentData?.url === 'string' ? node.contentData.url.trim() : ''
  const isSameCardResult = (
    node.type === 'generation' &&
    node.contentData?.result_asset_id === assetId &&
    typeof node.contentData?.last_generation_job_id === 'string' &&
    node.contentData.last_generation_job_id.trim() !== ''
  )
  if (
    (node.type !== 'result' && !isSameCardResult) || node.isLocked || node.parentNodeId ||
    resolveNodeDefinition(node.type, node.contentData).kind !== 'canonical' ||
    node.contentData?.subtype !== 'image'
  ) return null
  const projectId = typeof node.contentData?.project_id === 'string'
    ? node.contentData.project_id.trim()
    : context.projectId
  if (!assetId || projectId !== context.projectId || !url) return null
  const asset = context.assets.find((candidate) => candidate.id === assetId)
  if (
    !asset || asset.user_id !== context.userId || asset.project_id !== context.projectId ||
    asset.type !== 'image' || asset.status !== 'active' || asset.source !== 'generation' || asset.url !== url
  ) return null
  return asset
}

export function resolveImageOperationSources(
  operation: ImageOperationDefinition,
  context: ImageOperationSourceContext,
) {
  const capabilities = context.capabilities
  if (!capabilities || !capabilities.supported_operations.includes(operation.id)) return null
  if (operation.execution === 'provider' && !capabilities.provider_operations.includes(operation.id as ProviderImageOperationId)) return null
  const maxSources = operation.id === 'fusion'
    ? Math.min(operation.sourceCount[1], capabilities.max_fusion_images)
    : operation.sourceCount[1]
  if (context.selectedNodes.length < operation.sourceCount[0] || context.selectedNodes.length > maxSources) return null
  if (new Set(context.selectedNodes.map((node) => node.id)).size !== context.selectedNodes.length) return null
  const assets = context.selectedNodes.map((node) => resolveImageResultAsset(node, context))
  if (assets.some((asset) => !asset)) return null
  if (new Set(assets.map((asset) => asset!.id)).size !== assets.length) return null
  return { nodes: [...context.selectedNodes], assets: assets as Asset[] }
}

function parseRegion(value: unknown): ImageOperationRegion {
  if (!isRecord(value) || !hasExactKeys(value, [
    'contract_version', 'coordinate_space', 'x', 'y', 'width', 'height',
  ]) || value.contract_version !== 1 || value.coordinate_space !== 'source-normalized') {
    throw new Error('图片操作 contract 无效。')
  }
  const { x, y, width, height } = value
  if (
    !isFiniteNumber(x) || !isFiniteNumber(y) || !isFiniteNumber(width) || !isFiniteNumber(height) ||
    x < 0 || y < 0 || width <= 0 || height <= 0 || x + width > 1 || y + height > 1
  ) throw new Error('图片操作 contract 无效。')
  return { contract_version: 1, coordinate_space: 'source-normalized', x, y, width, height }
}

function parseMask(value: unknown): ImageOperationMask {
  if (!isRecord(value) || !hasExactKeys(value, ['contract_version', 'kind', 'feather', 'invert']) ||
    value.contract_version !== 1 || value.kind !== 'region' || !isFiniteNumber(value.feather) ||
    value.feather < 0 || value.feather > 1 || typeof value.invert !== 'boolean') {
    throw new Error('图片操作 contract 无效。')
  }
  return { contract_version: 1, kind: 'region', feather: value.feather, invert: value.invert }
}

function parseExpansion(value: unknown): ImageOperationExpansion {
  if (!isRecord(value) || !hasExactKeys(value, ['contract_version', 'top', 'right', 'bottom', 'left']) || value.contract_version !== 1) {
    throw new Error('图片操作 contract 无效。')
  }
  const margins = [value.top, value.right, value.bottom, value.left]
  if (margins.some((margin) => !isFiniteNumber(margin) || margin < 0 || margin > 1) || !margins.some(Boolean)) {
    throw new Error('图片操作 contract 无效。')
  }
  return {
    contract_version: 1,
    top: value.top as number,
    right: value.right as number,
    bottom: value.bottom as number,
    left: value.left as number,
  }
}

export function parseImageOperationContract(
  value: unknown,
  capabilities: ImageOperationCapabilities,
): ImageOperationContract {
  if (!isRecord(value) || value.contract_version !== 1 || typeof value.id !== 'string' ||
    !OPERATION_IDS.has(value.id as ImageOperationId) || !capabilities.supported_operations.includes(value.id as ImageOperationId)) {
    throw new Error('图片操作 contract 无效。')
  }
  const id = value.id as ImageOperationId
  const definition: ImageOperationDefinition = IMAGE_OPERATIONS[id]
  const expectedKeys = ['contract_version', 'id', ...definition.controls.map((control) => (
    control === 'upscale' ? 'upscale_factor' : control
  ))]
  if (!hasExactKeys(value, expectedKeys)) throw new Error('图片操作 contract 无效。')
  const contract: ImageOperationContract = { contract_version: 1, id }
  if (definition.controls.includes('region')) contract.region = parseRegion(value.region)
  if (definition.controls.includes('mask')) contract.mask = parseMask(value.mask)
  if (definition.controls.includes('expansion')) contract.expansion = parseExpansion(value.expansion)
  if (definition.controls.includes('upscale')) {
    if (!Number.isInteger(value.upscale_factor) || !capabilities.upscale_factors.includes(Number(value.upscale_factor))) {
      throw new Error('图片操作 contract 无效。')
    }
    contract.upscale_factor = Number(value.upscale_factor)
  }
  return contract
}

export function createDefaultImageOperationContract(
  id: ImageOperationId,
  capabilities: ImageOperationCapabilities,
): ImageOperationContract {
  const definition: ImageOperationDefinition = IMAGE_OPERATIONS[id]
  const contract: ImageOperationContract = { contract_version: 1, id }
  if (definition.controls.includes('region')) {
    contract.region = {
      contract_version: 1,
      coordinate_space: 'source-normalized',
      x: 0.25,
      y: 0.25,
      width: 0.5,
      height: 0.5,
    }
  }
  if (definition.controls.includes('mask')) {
    contract.mask = { contract_version: 1, kind: 'region', feather: 0, invert: false }
  }
  if (definition.controls.includes('expansion')) {
    contract.expansion = { contract_version: 1, top: 0.25, right: 0.25, bottom: 0.25, left: 0.25 }
  }
  if (definition.controls.includes('upscale')) {
    const factor = capabilities.upscale_factors[0]
    if (!factor) throw new Error('图片操作 contract 无效。')
    contract.upscale_factor = factor
  }
  return parseImageOperationContract(contract, capabilities)
}

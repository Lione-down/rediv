import type { CanvasConnection, CanvasNode } from '../../types/canvas'
import { resolveGenerationContext, type GenerationInputProvenance } from '../../modules/canvas/generation-context'
import { resolveGenerationResultVariants } from '../../modules/canvas/generation-lineage'

export interface CanvasConnectionPresentation {
  accessibleLabel: string
  roleLabel: string
  sourceTitle: string
  stateLabel: string | null
  targetTitle: string
}

type OrderedConnectionRole = GenerationInputProvenance | {
  isIncluded: true
  kind: 'result'
  order: number
}

function orderedRole(
  connection: CanvasConnection,
  source: CanvasNode,
  target: CanvasNode,
  nodes: readonly CanvasNode[],
  connections: readonly CanvasConnection[],
): OrderedConnectionRole | null {
  if (target.type === 'generation') {
    return resolveGenerationContext(target, nodes, connections).provenance.find(
      (item) => item.connectionId === connection.id,
    ) ?? null
  }
  if (source.type === 'generation' && target.type === 'result') {
    const variant = resolveGenerationResultVariants(source, nodes, connections, target.id).find(
      (item) => item.connectionId === connection.id,
    )
    return variant ? { isIncluded: true, kind: 'result', order: variant.order } : null
  }
  return null
}

function connectionRole(
  connection: CanvasConnection,
  source: CanvasNode,
  target: CanvasNode,
  role: OrderedConnectionRole | null,
) {
  if (role?.kind === 'text') return `T${role.order} 提示词`
  if (role?.kind === 'media') return `R${role.order} 参考图`
  if (role?.kind === 'result') return `V${role.order} 生成结果`
  if (connection.targetPort === 'prompt') return '提示词输入'
  if (connection.targetPort === 'media') return '参考图输入'
  if (source.type === 'generation' && target.type === 'result') return '生成结果'
  if (target.type === 'generation') return '生成输入'
  if (target.type === 'result') return '结果输入'
  return '数据连接'
}

export function resolveCanvasConnectionPresentation(
  connection: CanvasConnection,
  source: CanvasNode,
  target: CanvasNode,
  nodes: readonly CanvasNode[],
  connections: readonly CanvasConnection[],
): CanvasConnectionPresentation {
  const role = orderedRole(connection, source, target, nodes, connections)
  const roleLabel = connectionRole(connection, source, target, role)
  const stateLabel = role?.isIncluded === false ? '未参与' : null
  const accessibleState = stateLabel ? '，未参与生成' : ''
  return {
    roleLabel,
    sourceTitle: source.title,
    stateLabel,
    targetTitle: target.title,
    accessibleLabel: `选中连线：${roleLabel}${accessibleState}，${source.title} 到 ${target.title}`,
  }
}

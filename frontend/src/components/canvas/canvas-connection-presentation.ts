import type { CanvasConnection, CanvasNode } from '../../types/canvas'

export interface CanvasConnectionPresentation {
  accessibleLabel: string
  roleLabel: string
  sourceTitle: string
  targetTitle: string
}

function connectionRole(
  connection: CanvasConnection,
  source: CanvasNode,
  target: CanvasNode,
) {
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
): CanvasConnectionPresentation {
  const roleLabel = connectionRole(connection, source, target)
  return {
    roleLabel,
    sourceTitle: source.title,
    targetTitle: target.title,
    accessibleLabel: `选中连线：${roleLabel}，${source.title} 到 ${target.title}`,
  }
}

import type { CanvasConnection, CanvasNode } from '../../types/canvas'
import { createCanvasEntityId } from '../../modules/canvas/canvas-autosave'
import type { InsertGraphCommand } from '../../modules/canvas/canvas-commands'
import {
  createRegistryNodeDraft,
  getAuthoringConnectionPorts,
  type CanonicalNodeType,
} from '../../modules/canvas/node-registry'
import type { Point } from './canvas-geometry'

export type WorkflowStarterId = 'script' | 'character' | 'first-frame' | 'audio-video'

export interface WorkflowStarter {
  id: WorkflowStarterId
  title: string
  detail: string
  marker: string
  isAvailable: boolean
}

export const WORKFLOW_STARTERS: readonly WorkflowStarter[] = [
  { id: 'script', title: '故事脚本', detail: '从故事结构开始', marker: '脚本', isAvailable: true },
  { id: 'character', title: '角色多视图', detail: '角色设定连接图片任务', marker: '角色', isAvailable: true },
  { id: 'first-frame', title: '首帧视频', detail: '首帧连接视频任务', marker: '首帧', isAvailable: true },
  { id: 'audio-video', title: '音频驱动视频', detail: '当前 provider 暂不可用', marker: '音频', isAvailable: false },
]

function createNode(
  type: CanonicalNodeType,
  subtype: string,
  position: Point,
  title?: string,
): CanvasNode {
  const draft = createRegistryNodeDraft(type, subtype, position)
  return { id: createCanvasEntityId(), ...draft, title: title ?? draft.title }
}

function connect(source: CanvasNode, target: CanvasNode): CanvasConnection {
  const ports = getAuthoringConnectionPorts(source, target)
  if (!ports) throw new Error('工作流起点包含不兼容的节点端口。')
  return {
    id: createCanvasEntityId(),
    from: source.id,
    to: target.id,
    sourcePort: ports.sourcePort,
    targetPort: ports.targetPort,
    status: 'active',
    active: true,
  }
}

export function createWorkflowStarterCommand(
  starterId: WorkflowStarterId,
  anchor: Point,
  brief = '',
  referenceAssetIds: readonly string[] = [],
): InsertGraphCommand | null {
  const normalizedBrief = brief.trim().slice(0, 4000)
  const applyBrief = (node: CanvasNode) => normalizedBrief
    ? { ...node, content: normalizedBrief, contentData: { ...node.contentData, text: normalizedBrief } }
    : node
  if (starterId === 'audio-video') return null
  if (starterId === 'script') {
    const script = applyBrief(createNode('script', 'script', { x: anchor.x - 160, y: anchor.y - 100 }, '故事脚本'))
    script.contentData = {
      ...script.contentData,
      ...(referenceAssetIds.length ? { reference_asset_ids: [...new Set(referenceAssetIds)].slice(0, 8) } : {}),
    }
    return {
      type: 'insert-graph',
      nodes: [script],
      connections: [],
    }
  }

  const prompt = applyBrief(createNode('script', 'prompt', { x: anchor.x - 360, y: anchor.y - 100 }))
  const image = createNode('generation', 'image', { x: anchor.x, y: anchor.y - 110 }, starterId === 'character' ? '角色多视图' : '首帧图')
  if (starterId === 'first-frame') {
    const video = createNode('generation', 'video', { x: anchor.x + 440, y: anchor.y - 110 }, '首帧视频')
    return {
      type: 'insert-graph',
      nodes: [prompt, image, video],
      connections: [connect(prompt, image), connect(prompt, video)],
    }
  }
  return {
    type: 'insert-graph',
    nodes: [prompt, image],
    connections: [connect(prompt, image)],
  }
}

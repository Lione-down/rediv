import type { CanvasConnection, CanvasNode } from '../../types/canvas'
import { createCanvasEntityId } from '../../modules/canvas/canvas-autosave'
import type { InsertGraphCommand } from '../../modules/canvas/canvas-commands'
import {
  createRegistryNodeDraft,
  getDefaultConnectionPorts,
  type CanonicalNodeType,
} from '../../modules/canvas/node-registry'
import type { Point } from './canvas-geometry'

export type WorkflowStarterId = 'script' | 'image' | 'video' | 'storyboard'

export interface WorkflowStarter {
  id: WorkflowStarterId
  title: string
  detail: string
  marker: string
}

export const WORKFLOW_STARTERS: readonly WorkflowStarter[] = [
  { id: 'script', title: '脚本起步', detail: '从故事结构开始', marker: '文案' },
  { id: 'image', title: '图片生成', detail: '提示词连接图片任务', marker: '图片' },
  { id: 'video', title: '视频生成', detail: '脚本连接视频任务', marker: '视频' },
  { id: 'storyboard', title: '分镜规划', detail: '并排整理脚本与场记', marker: '分镜' },
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
  const ports = getDefaultConnectionPorts(source, target)
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
): InsertGraphCommand {
  if (starterId === 'script') {
    return {
      type: 'insert-graph',
      nodes: [createNode('script', 'script', { x: anchor.x - 160, y: anchor.y - 100 }, '故事脚本')],
      connections: [],
    }
  }

  if (starterId === 'storyboard') {
    return {
      type: 'insert-graph',
      nodes: [
        createNode('script', 'script', { x: anchor.x - 340, y: anchor.y - 100 }, '分镜脚本'),
        createNode('note', 'annotation', { x: anchor.x + 40, y: anchor.y - 90 }, '分镜场记'),
      ],
      connections: [],
    }
  }

  const prompt = createNode('script', 'prompt', { x: anchor.x - 360, y: anchor.y - 100 })
  const generation = createNode(
    'generation',
    starterId,
    { x: anchor.x, y: anchor.y - 110 },
  )
  return {
    type: 'insert-graph',
    nodes: [prompt, generation],
    connections: [connect(prompt, generation)],
  }
}
